import os
from typing import Generator, Annotated
from sqlmodel import create_engine, Session
from fastapi import Depends, Request, HTTPException
import redis 


DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5434"))  
DB_NAME = os.getenv("DB_NAME", "charity")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "postgres")

DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

def get_session() -> Generator[Session, None, None]:
    """Per-request DB session."""
    with Session(engine) as session:
        yield session

def get_redis(request: Request):
    r = getattr(request.app.state, "redis", None)
    if r is None:
        raise HTTPException(500, "Redis not initialized")
    return r


SessionDep = Annotated[Session, Depends(get_session)]
RedisDep = Annotated[redis.Redis, Depends(get_redis)]