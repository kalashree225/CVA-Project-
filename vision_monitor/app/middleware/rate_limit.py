from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware - Pass-through for Demo."""
    
    async def dispatch(self, request: Request, call_next):
        # BYPASS RATE LIMITING FOR DEMO
        # Ensure the platform is always responsive during the presentation.
        return await call_next(request)
