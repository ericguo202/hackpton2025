from contextlib import asynccontextmanager
import os
from pathlib import Path
import redis.asyncio as redis
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlmodel import SQLModel, select 
from sqlalchemy.ext.asyncio import AsyncEngine
from deps import engine, SessionDep
from routes import routes
from deps import RedisDep
from rate_limit import RateLimitMiddleware
from models.dbmodels import Charity
from sqlalchemy.ext.asyncio import AsyncSession

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB   = int(os.getenv("REDIS_DB", "0"))

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    async with AsyncSession(engine) as session:
        result = await session.execute(select(Charity))
        existing = result.scalars().all()

        if len(existing) == 0:  
            e1 = Charity(
                username="david123",
                password="david123", 
                name="The david foundation",
                address="67 street",
                description="awesome charity",
                website="coolwebsite.com",
                contact="david123@gmail.com",
                needs_donations=True,
                needs_volunteers=False,
                is_approved=True,
            )

            e2 = Charity(
                username="chungus",
                password="bignuts67",  
                name="Hawktuah simulator",
                address="65 Glendale Ave",
                description="best charity",
                website="hi@gmail.com",
                contact="fattymatt@gmail.com",
                needs_donations=True,
                needs_volunteers=True,
            )

            session.add_all([e1, e2])
            await session.commit()

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
app.add_middleware(GZipMiddleware, minimum_size=500)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    RateLimitMiddleware,
    limit=10,
    window=60,
    paths=["/charities/login"],  
)

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