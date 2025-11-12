import os
from typing import AsyncGenerator, Annotated
from sqlmodel import create_engine, Session
from fastapi import Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
import redis.asyncio as redis

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)
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