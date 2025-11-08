from typing import Optional
from fastapi import APIRouter, HTTPException, status, Response, Request
from fastapi.responses import RedirectResponse
from sqlmodel import SQLModel, Field, select
from deps import SessionDep, RedisDep
from models.dbmodels import Charity
from models.inmodels import CharityCreate, CharityEdit, CharityLogin
from models.outmodels import CharityRead
from fastapi.encoders import jsonable_encoder
import json
import bcrypt
import uuid

router = APIRouter()

@router.get("/")
def home():
    return {"status": "ok"}



@router.get("/charities/logout")
async def charity_logout(response: Response, request: Request, r: RedisDep):
    sid = request.cookies.get("sid")
    if sid is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
   
    await r.delete(f"session:{sid}")
    response.delete_cookie(key="sid")
    return {"ok": True}



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


@router.post("/charities")
async def new_charity(data: CharityCreate, db: SessionDep, r: RedisDep):
    data.password = hash_password(data.password)
    charity = Charity(**data.model_dump())
    db.add(charity)
    await db.commit()
    await db.refresh(charity)
    cur_ver = await _get_ver(r)
    await r.delete(f"charities:all:v{cur_ver}")

    await _bump_ver(r)
    return charity


@router.get("/charities/login")
def charity_login_page():
    return {"status": "ok"}


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


@router.get("/charities/{id}/edit")
def charity_edit_page(id: int):
    return {"status": "ok"}


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
