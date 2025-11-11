import os
from typing import AsyncGenerator, Annotated
from sqlmodel import create_engine, Session
from fastapi import Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
import redis.asyncio as redis


_db_url = os.getenv("DATABASE_URL") 
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif _db_url.startswith("postgresql://") and "+asyncpg" not in _db_url:
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(_db_url, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session

def get_redis(request: Request) -> redis.Redis:
    r = getattr(request.app.state, "redis", None)
    if r is None:
        raise HTTPException(500, "Redis not initialized")
    return r

SessionDep = Annotated[AsyncSession, Depends(get_session)]
RedisDep = Annotated[redis.Redis, Depends(get_redis)]