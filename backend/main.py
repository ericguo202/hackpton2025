from contextlib import asynccontextmanager
import os
import redis.asyncio as redis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncEngine
from deps import engine
from routes import routes

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB   = int(os.getenv("REDIS_DB", "0"))

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    app.state.redis = redis.Redis(
        host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True
    )

    try:
        yield
    finally:
        r = getattr(app.state, "redis", None)
        if r is not None:
            await r.aclose()
        await engine.dispose()
app = FastAPI(lifespan=lifespan)


app.include_router(routes.router, tags=["notes"])

@app.get("/health")
async def health():
    try:
        pong = await app.state.redis.ping()
        return {"db": "ok", "redis": pong}
    except Exception as e:
        return {"db": "ok", "redis": False, "error": str(e)}