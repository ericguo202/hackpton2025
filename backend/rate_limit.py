# rate_limit.py
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from starlette.requests import Request

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple fixed-window rate limiter that fetches the Redis client
    from request.app.state.redis (set in your lifespan).
    """

    def __init__(self, app, *, limit=10, window=60, key_fn=None, paths=None, redis_attr="redis"):
        super().__init__(app)
        self.limit = int(limit)
        self.window = int(window)
        self.key_fn = key_fn or (lambda req: req.client.host)
        self.paths = set(paths or [])  
        self.redis_attr = redis_attr  

    def _should_limit(self, request: Request) -> bool:
        return (not self.paths) or (request.url.path in self.paths)

    async def dispatch(self, request: Request, call_next):
        if not self._should_limit(request):
            return await call_next(request)

        r = getattr(request.app.state, self.redis_attr, None)
        if r is None:
            return JSONResponse(
                {"detail": "Rate limiter unavailable"},
                status_code=503
            )

        ident = self.key_fn(request)
        bucket = int(time.time()) // self.window
        key = f"rl:{request.url.path}:{ident}:{bucket}"

        count = await r.incr(key)
        if count == 1:
            await r.expire(key, self.window)

        if count > self.limit:
            return JSONResponse(
                {"detail": "Rate limit exceeded. Try again later."},
                status_code=429,
                headers={"Retry-After": str(self.window)}
            )

        return await call_next(request)
