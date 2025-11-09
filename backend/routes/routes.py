from typing import Optional, Dict, Any
from urllib.parse import quote
from pathlib import Path
from fastapi import APIRouter, HTTPException, status, Response, Request
from fastapi.responses import RedirectResponse, FileResponse
from sqlmodel import SQLModel, Field, select
from deps import SessionDep, RedisDep
from models.dbmodels import Charity
from models.inmodels import CharityCreate, CharityEdit, CharityLogin
from models.outmodels import CharityRead
from fastapi.encoders import jsonable_encoder
import json
import bcrypt
import uuid
from dotenv import load_dotenv
import os
import httpx


load_dotenv()
MAPBOX_TOKEN = os.getenv("MAPBOX_API_TOKEN")  
MAPBOX_GEOCODE_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json"
MAPBOX_RETRIEVE_URL = "https://api.mapbox.com/search/searchbox/v1/retrieve/{mapbox_id}"

router = APIRouter()

frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"

@router.get("/") 
def home():
    return {"status": "ok"}


@router.get("/charities", response_model=list[CharityRead])
async def charities(db: SessionDep, r: RedisDep):
    ver = await _get_ver(r)  
    key = f"charities:all:v{ver}"
    cached = await r.get(key)
    if cached:
        print("cache used")
        return json.loads(cached)

    results = await db.execute(select(Charity))
    items = results.scalars().all()
    payload = jsonable_encoder(items)
    await r.setex(key, 180, json.dumps(payload))
    return payload


@router.post("/charities", response_model=CharityRead)
async def new_charity(data: CharityCreate, db: SessionDep, r: RedisDep):
    data.password = hash_password(data.password)
    feature = await geocode_address_to_features(address=data.address)
    payload = data.model_dump()
    charity = Charity(**payload,geojson=feature)
    db.add(charity)
    await db.commit()
    await db.refresh(charity)

    cur_ver = await _get_ver(r)
    await r.delete(f"charities:all:v{cur_ver}")
    await _bump_ver(r)
    
    return charity


@router.get("/charities/login")
async def serve_login_page():
    """Serve the React app for the login page"""
    index_path = frontend_dist / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    raise HTTPException(status_code=404, detail="Frontend not built. Run 'npm run build' in frontend directory.")


@router.post("/charities/login")
async def charity_login(
    data: CharityLogin,
    db: SessionDep,
    r: RedisDep,
    response: Response,
    request: Request,
):
    stmt = select(Charity).where(Charity.username == data.username)
    results = await db.execute(stmt)
    charity = results.scalars().first()
    if not charity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    if not verify_password(data.password, charity.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    sid = str(uuid.uuid4())
    await r.setex(f"session:{sid}", 3600, json.dumps({"user_id": charity.id}))


    url = request.url_for("get_charity", id=charity.id)
    resp = RedirectResponse(url, status_code=status.HTTP_303_SEE_OTHER)

    resp.set_cookie(
        key="sid",
        value=sid,
        httponly=True,
        secure=False,  
        samesite="lax",
        max_age=3600,
        path="/",
    )
    return resp

@router.get("/charities/me", response_model=CharityRead)
async def get_current_charity(db: SessionDep, r: RedisDep, request: Request):
    """Get the currently logged-in charity based on session cookie"""
    sid = request.cookies.get("sid")
    if not sid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not logged in")
    
    session_data = await r.get(f"session:{sid}")
    if not session_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
    
    session = json.loads(session_data)
    user_id = session.get("user_id")
    
    charity = await db.get(Charity, user_id)
    if not charity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Charity not found")
    
    return charity


@router.get("/charities/new")
async def serve_registration_page():
    """Serve the React app for the registration page"""
    index_path = frontend_dist / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    raise HTTPException(status_code=404, detail="Frontend not built. Run 'npm run build' in frontend directory.")

@router.post("/charities/logout")
async def charity_logout(response: Response, request: Request, r: RedisDep):
    sid = request.cookies.get("sid")
    if sid is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
   
    await r.delete(f"session:{sid}")
    response.delete_cookie(key="sid")
    return {"ok": True}

@router.get("/charities/{id}", response_model=CharityRead, name="get_charity")
async def get_charity(id: int, db: SessionDep, r: RedisDep):
    ver = await _get_charity_ver(id, r)
    key = f"charities:{id}:v{ver}"
    cache = await r.get(key)
    if cache:
        print("cache used")
        return json.loads(cache)

    charity = await db.get(Charity, id)
    if not charity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    payload = jsonable_encoder(charity)
    await r.setex(key, 180, json.dumps(payload))
    return payload

@router.patch("/charities/{id}/edit", response_model=CharityRead)
async def charity_edits(
    id: int,
    request: Request,
    data: CharityEdit,
    db: SessionDep,
    r: RedisDep,
):
    sid = request.cookies.get("sid")
    if sid is None:
        raise HTTPException(status_code=status.HTTP_405_METHOD_NOT_ALLOWED)
    if not await r.exists(f"session:{sid}"):
        raise HTTPException(status_code=status.HTTP_405_METHOD_NOT_ALLOWED)

    charity = await db.get(Charity, id)
    if not charity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    payload = data.model_dump(exclude_unset=True)
    for field, value in payload.items():
        setattr(charity, field, value)

    await db.commit()
    await db.refresh(charity)

   
    ent_ver = await _get_charity_ver(id, r)
    await r.delete(f"charities:{id}:v{ent_ver}")
    await _bump_charity_ver(id, r)


    cur_ver = await _get_ver(r)
    await r.delete(f"charities:all:v{cur_ver}")
    await _bump_ver(r)

    return charity


@router.delete("/charities/{id}")
async def charity_delete(
    id: int,
    request: Request,
    response: Response,
    db: SessionDep,
    r: RedisDep,
):
    sid = request.cookies.get("sid")
    if sid is None:
        raise HTTPException(status_code=status.HTTP_405_METHOD_NOT_ALLOWED)
    if not await r.exists(f"session:{sid}"):
        raise HTTPException(status_code=status.HTTP_405_METHOD_NOT_ALLOWED)

    charity = await db.get(Charity, id)
    if not charity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    await db.delete(charity)
    await db.commit()

   
    await r.delete(f"session:{sid}")
    response.delete_cookie(key="sid")

    
    ent_ver = await _get_charity_ver(id, r)
    await r.delete(f"charities:{id}:v{ent_ver}")
    await _bump_charity_ver(id, r)


    cur_ver = await _get_ver(r)
    await r.delete(f"charities:all:v{cur_ver}")
    await _bump_ver(r)

    return {"ok": True}



async def _get_charity_ver(id: int, r: RedisDep) -> int:
    v = await r.get(f"charities:{id}:ver")
    return int(v) if v is not None else 0

async def _bump_charity_ver(id: int, r: RedisDep) -> int:
    return await r.incr(f"charities:{id}:ver")

async def _get_ver(r: RedisDep) -> int:
    v = await r.get("charities:ver")
    return int(v) if v is not None else 0

async def _bump_ver(r: RedisDep) -> int:
    return await r.incr("charities:ver")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

async def geocode_address_to_features(address: str) -> dict:
    if not address:
        raise HTTPException(status_code=400, detail="Address is required")
    encoded = quote(address)

    url = MAPBOX_GEOCODE_URL.format(query=encoded)
    params = {
        "access_token": MAPBOX_TOKEN,
        "limit": 1,
        "autocomplete": "false",
    }

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, params=params)
        try:
            r.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=502, detail=f"Geocoding failed: {e.response.text}") from e

    payload = r.json()
    features = payload.get("features") or []
    if not features:
        raise HTTPException(status_code=400, detail="Address not found")

    feat = features[0]  
    return {
        "type": "Feature",
        "geometry": feat["geometry"],
        "properties": {
            "place_name": feat.get("place_name"),
            "source": "mapbox",
        },
    }