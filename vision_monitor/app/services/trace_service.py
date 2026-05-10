import httpx
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)


class TraceService:
    """Service for Langfuse trace logging via HTTP API."""
    
    @staticmethod
    async def create_trace(
        model_name: str,
        input_text: Optional[str],
        input_image_url: Optional[str]
    ) -> Optional[str]:
        """Create a Langfuse trace and return trace_id."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{settings.LANGFUSE_HOST}/api/public/traces",
                    headers={
                        "Authorization": f"Bearer {settings.LANGFUSE_PUBLIC_KEY}:{settings.LANGFUSE_SECRET_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "id": None,  # Let Langfuse generate
                        "name": f"inference_{model_name}",
                        "userId": "vision_monitor",
                        "metadata": {
                            "model": model_name,
                            "input_text": input_text,
                            "input_image_url": input_image_url
                        }
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("id")
                else:
                    logger.warning(f"Langfuse trace creation failed: {response.status_code}")
                    return None
        except Exception as e:
            logger.warning(f"Langfuse trace creation error: {e}")
            return None
    
    @staticmethod
    async def create_observation(
        trace_id: str,
        span_name: str,
        latency_ms: Optional[int] = None,
        metadata: Optional[dict] = None
    ) -> bool:
        """Create a Langfuse observation/span."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{settings.LANGFUSE_HOST}/api/public/observations",
                    headers={
                        "Authorization": f"Bearer {settings.LANGFUSE_PUBLIC_KEY}:{settings.LANGFUSE_SECRET_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "traceId": trace_id,
                        "name": span_name,
                        "startTime": None,
                        "endTime": None,
                        "level": "DEFAULT",
                        "metadata": metadata or {},
                        "latencyMs": latency_ms
                    }
                )
                
                return response.status_code == 200
        except Exception as e:
            logger.warning(f"Langfuse observation creation error: {e}")
            return False
    
    @staticmethod
    async def log_inference_trace(
        model_name: str,
        input_text: Optional[str],
        input_image_url: Optional[str],
        latency_ms: int,
        token_count_input: int,
        token_count_output: int
    ) -> Optional[str]:
        """Log complete inference trace with spans."""
        # Create trace
        trace_id = await TraceService.create_trace(model_name, input_text, input_image_url)
        
        if not trace_id:
            return None
        
        # Create spans
        await TraceService.create_observation(
            trace_id,
            "tokenize",
            metadata={"token_count_input": token_count_input}
        )
        
        await TraceService.create_observation(
            trace_id,
            "inference",
            latency_ms=latency_ms,
            metadata={
                "model": model_name,
                "token_count_output": token_count_output
            }
        )
        
        await TraceService.create_observation(
            trace_id,
            "post-process",
            metadata={"status": "complete"}
        )
        
        return trace_id
    
    @staticmethod
    async def get_trace_metadata(trace_id: str) -> Optional[dict]:
        """Fetch trace metadata from Langfuse."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{settings.LANGFUSE_HOST}/api/public/traces/{trace_id}",
                    headers={
                        "Authorization": f"Bearer {settings.LANGFUSE_PUBLIC_KEY}:{settings.LANGFUSE_SECRET_KEY}"
                    }
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.warning(f"Langfuse trace fetch failed: {response.status_code}")
                    return None
        except Exception as e:
            logger.warning(f"Langfuse trace fetch error: {e}")
            return None
