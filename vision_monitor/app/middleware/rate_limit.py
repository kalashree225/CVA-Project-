from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
import redis.asyncio as redis
from app.config import settings
import time


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Redis-based rate limiting using token bucket pattern."""
    
    def __init__(self, app):
        super().__init__(app)
        self.redis_client = None
    
    async def get_redis(self):
        """Lazy initialization of Redis client."""
        if self.redis_client is None:
            self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        return self.redis_client
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health endpoint and docs
        if request.url.path in ["/health", "/docs", "/openapi.json", "/api/v1/health", "/api/v1/health/stream"]:
            return await call_next(request)
        
        api_key = request.headers.get("X-API-Key", "anonymous")
        path = request.url.path
        
        # Determine rate limit based on path
        if path == "/api/v1/inference/run":
            max_requests = settings.RATE_LIMIT_INFERENCE
        else:
            max_requests = settings.RATE_LIMIT_DEFAULT
        
        # Use token bucket pattern with Redis sorted sets
        redis_client = await self.get_redis()
        current_time = time.time()
        window_start = current_time - 60  # 1 minute window
        
        key = f"rate_limit:{api_key}:{path}"
        
        try:
            # Clean up old entries
            await redis_client.zremrangebyscore(key, 0, window_start)
            
            # Count current requests
            current_count = await redis_client.zcard(key)
            
            if current_count >= max_requests:
                # Get oldest request to calculate retry-after
                oldest = await redis_client.zrange(key, 0, 0, withscores=True)
                if oldest:
                    retry_after = int(oldest[0][1] + 60 - current_time)
                    retry_after = max(1, retry_after)
                else:
                    retry_after = 60
                
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded",
                    headers={"Retry-After": str(retry_after)}
                )
            
            # Add current request
            await redis_client.zadd(key, {str(current_time): current_time})
            await redis_client.expire(key, 60)
            
        except redis.RedisError as e:
            # Log warning but don't block requests on Redis failure
            import logging
            logging.warning(f"Rate limiting Redis error: {e}")
        
        return await call_next(request)
