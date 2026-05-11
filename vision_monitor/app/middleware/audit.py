import logging
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class AuditLogMiddleware(BaseHTTPMiddleware):
    """Middleware for audit logging of all sentinel requests."""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000
        
        # Create audit log entry (Logging to console/file only for demo)
        audit_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(duration_ms, 2),
            "client_ip": request.client.host if request.client else None
        }
        
        logger.info(f"AUDIT_EVENT: {json.dumps(audit_entry)}")
        
        return response
