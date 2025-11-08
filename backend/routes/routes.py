from typing import Optional
from pathlib import Path
from fastapi import APIRouter, HTTPException, status, Response, Request
from fastapi.responses import RedirectResponse, FileResponse
from sqlmodel import SQLModel, Field, select
from deps import SessionDep, RedisDep
from models.dbmodels import Charity
from models.inmodels import CharityCreate, CharityLogin
from models.outmodels import CharityRead
from fastapi.encoders import jsonable_encoder
import json
import bcrypt
import uuid

router = APIRouter()

# Path to frontend build directory
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"

@router.get("/") 
def home():
    return {"status":"ok"}

@router.get("/charities", response_model=list[CharityRead]) 
async def charities(db: SessionDep, r: RedisDep): 
    ver = await _get_ver(r)
    key = f"charities:all:v{ver}"
    cached = await r.get(key)
    if cached:
        print("cache used") 
        return json.loads(cached)
    stmt = select(Charity)
    results = await db.execute(stmt)
    items = results.scalars().all()   
    payload = jsonable_encoder(items)
    await r.setex(key, 180, json.dumps(payload)) 
    return payload

@router.post("/charities")
async def new_charity(data: CharityCreate, db: SessionDep, r:RedisDep): 
    data.password = hash_password(data.password)
    charity = Charity(**data.model_dump())
    db.add(charity) 
    await db.commit()
    await db.refresh(charity)
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
async def charity_login(data: CharityLogin, db: SessionDep, r: RedisDep, response: Response, request: Request): 
    stmt = select(Charity).where(Charity.username==data.username)
    results = await db.execute(stmt)
    charity = results.scalars().first()
    if not charity: 
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    if not verify_password(data.password, charity.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    sid = str(uuid.uuid4())
    await r.setex(f"session:{sid}", 3600, json.dumps({"user_id": charity.id}))

    url = request.url_for("charity_page", charity=charity.name)
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

@router.get("/charities/{charity}")
async def charity_page(charity: str): 
    return {"status":"ok"}

async def _get_ver(r: RedisDep) -> int:
    v = await r.get("charities:ver")
    return int(v) if v else 1

async def _bump_ver(r: RedisDep) -> int:
    return await r.incr("charities:ver")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

