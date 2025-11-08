from contextlib import asynccontextmanager
import os
from pathlib import Path
import redis.asyncio as redis
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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

# Include API routes first (before static files)
app.include_router(routes.router, tags=["notes"])

@app.get("/health")
async def health():
    try:
        pong = await app.state.redis.ping()
        return {"db": "ok", "redis": pong}
    except Exception as e:
        return {"db": "ok", "redis": False, "error": str(e)}

# Serve static files (JS, CSS, images, etc.) from the frontend build
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    # Mount static assets (JS, CSS, etc.)
    static_dir = frontend_dist / "assets"
    if static_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(static_dir)), name="assets")
    
    # Serve other static files from dist root (like vite.svg, etc.)
    # This must come after /assets to avoid conflicts
    app.mount("/static", StaticFiles(directory=str(frontend_dist / "static")), name="static")
    
    # Serve files from dist root (like vite.svg)
    # Note: This is a catch-all for static files, so it should be last
    @app.get("/vite.svg")
    async def serve_vite_svg():
        """Serve vite.svg from dist root"""
        svg_path = frontend_dist / "vite.svg"
        if svg_path.exists():
            return FileResponse(str(svg_path))
        raise HTTPException(status_code=404)