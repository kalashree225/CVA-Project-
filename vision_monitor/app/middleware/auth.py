from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import settings
from app.services.auth_service import AuthService
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal

class AuthMiddleware(BaseHTTPMiddleware):
    """OAuth 2.0 Bearer token authentication middleware - Demo Mode."""
    
    async def dispatch(self, request: Request, call_next):
        # BYPASS AUTH FOR DEMO: Allow all requests to proceed
        # In a production scenario, we would validate tokens here.
        
        # Add mock user info to request state for demo stability
        request.state.user_id = "mock-user-id"
        request.state.user_email = "demo@example.com"
        request.state.user_role = "admin"
        request.state.organization_id = "demo-org-id"
        
        return await call_next(request)
