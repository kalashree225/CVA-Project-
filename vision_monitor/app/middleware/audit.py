import logging
import time
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class AuditLogMiddleware(BaseHTTPMiddleware):
    """Middleware for audit logging of all requests."""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Extract user info from token if present
        user_id: Optional[str] = None
        user_email: Optional[str] = None
        organization_id: Optional[str] = None
        
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                from app.services.auth_service import AuthService
                token = auth_header.replace("Bearer ", "")
                payload = AuthService.decode_access_token(token)
                if payload:
                    user_id = payload.get("sub")
                    user_email = payload.get("email")
            except Exception:
                pass
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000
        
        # Create audit log entry
        audit_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "method": request.method,
            "path": request.url.path,
            "query_params": str(request.url.query) if request.url.query else None,
            "user_id": user_id,
            "user_email": user_email,
            "organization_id": organization_id,
            "status_code": response.status_code,
            "duration_ms": round(duration_ms, 2),
            "client_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent")
        }
        
        # Log audit entry as JSON
        logger.info(f"AUDIT: {json.dumps(audit_entry)}")
        
        # Store audit log in Redis for later analysis
        try:
            import redis.asyncio as redis
            from app.config import settings
            r = redis.from_url(settings.REDIS_URL, decode_responses=True)
            try:
                await r.lpush("audit_logs", json.dumps(audit_entry))
                # Keep only last 10000 audit logs
                await r.ltrim("audit_logs", 0, 9999)
                await r.expire("audit_logs", 7 * 24 * 60 * 60)  # 7 days
            finally:
                await r.aclose()
        except Exception as e:
            logger.warning(f"Failed to store audit log in Redis: {e}")
        
        return response
