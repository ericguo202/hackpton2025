from typing import Optional, List, Annotated
from fastapi.encoders import jsonable_encoder
from fastapi import APIRouter, Depends, HTTPException, Request, status, Response
from sqlmodel import SQLModel, Field, Session, select
from deps import get_session, SessionDep, RedisDep
from models.outmodels import CharityRead
from models.inmodels import CharityCreate, CharityLogin
from models.dbmodels import Charity
from pydantic import BaseModel
import json 
import bcrypt
import uuid

router = APIRouter()

@router.get("/") 
def home():
    return {"status":"ok"}

@router.get("/charities", response_model=list[CharityRead]) 
def charities(db: SessionDep, r: RedisDep): 
    ver = _get_ver(r)
    key = f"charities:all:v{ver}"
    cached = r.get(key)
    if cached:
        return json.loads(cached)
    stmt = select(Charity)
    results = db.exec(stmt).all()    
    payload = jsonable_encoder(results)
    r.setex(key, 180, json.dumps(payload)) 
    return results

@router.post("/charities")
def new_charity(data: CharityCreate, db: SessionDep, r:RedisDep): 
    data.password = hash_password(data.password)
    charity = Charity(**data.model_dump())
    db.add(charity) 
    db.commit()
    db.refresh(charity)
    _bump_ver(r) 
    return charity 

@router.get("/charities/login")
def charity_page(): 
    return {"status": "ok"}

@router.post("/charities/login", response_model=CharityRead)
def charity_login(data: CharityLogin, db: SessionDep, r: RedisDep, response: Response): 
    stmt = select(Charity).where(Charity.username==data.username)
    charity = exec(stmt).first() 
    if not charity: 
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    if charity.password is not hash_password(data.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    sid = str(uuid.uuid4())
    response.set_cookie(key="sid", value=sid, httponly=True, secure=True, max_age=3600)
    r.setex(sid, 3600, True)
    return 

def _get_ver(r) -> int:
    v = r.get("charities:ver")
    return int(v) if v else 1

def _bump_ver(r) -> int:
    return r.incr("charities:ver")



def hash_password(password: str):
    password_bytes = password.encode('utf-8')
    hashed_password = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed_password

