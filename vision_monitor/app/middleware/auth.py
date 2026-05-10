from fastapi import Request, HTTPException, status
<<<<<<< HEAD
from fastapi.responses import JSONResponse
=======
>>>>>>> 1f9e1f428c60a05a90a56f90b558cb17b6e52531
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import settings
from app.services.auth_service import AuthService
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal


class AuthMiddleware(BaseHTTPMiddleware):
    """OAuth 2.0 Bearer token authentication middleware."""
    
    async def dispatch(self, request: Request, call_next):
        # Skip auth for health endpoint, docs, and auth endpoints
        skip_paths = [
<<<<<<< HEAD
            "/",
            "/health", 
            "/metrics",
            "/docs", 
            "/redoc",
=======
            "/health", 
            "/docs", 
>>>>>>> 1f9e1f428c60a05a90a56f90b558cb17b6e52531
            "/openapi.json", 
            "/api/v1/health", 
            "/api/v1/health/stream",
            "/api/v1/auth/login",
            "/api/v1/auth/register"
        ]
        
        if request.url.path in skip_paths:
            return await call_next(request)
        
        # Get Authorization header
        auth_header = request.headers.get("Authorization")
        
        if not auth_header or not auth_header.startswith("Bearer "):
<<<<<<< HEAD
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Missing or invalid Authorization header"},
=======
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid Authorization header",
>>>>>>> 1f9e1f428c60a05a90a56f90b558cb17b6e52531
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        token = auth_header.replace("Bearer ", "")
        
        # Validate token
        payload = AuthService.decode_access_token(token)
        if not payload:
<<<<<<< HEAD
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid or expired token"},
=======
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
>>>>>>> 1f9e1f428c60a05a90a56f90b558cb17b6e52531
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify user still exists and is active
        user_id = payload.get("sub")
        async with AsyncSessionLocal() as db:
            from app.models.user import User
            from sqlalchemy import select
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            
            if not user or not user.is_active:
<<<<<<< HEAD
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "User not found or inactive"},
=======
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found or inactive",
>>>>>>> 1f9e1f428c60a05a90a56f90b558cb17b6e52531
                    headers={"WWW-Authenticate": "Bearer"},
                )
        
        # Add user info to request state for use in endpoints
        request.state.user_id = user_id
        request.state.user_email = payload.get("email")
        request.state.user_role = payload.get("role")
        request.state.organization_id = str(user.organization_id) if user.organization_id else None
        
        return await call_next(request)
