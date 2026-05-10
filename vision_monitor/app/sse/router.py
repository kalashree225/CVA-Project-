"""
FastAPI SSE router — streams metric events to authenticated clients.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer

from app.config import settings
from app.services.auth_service import AuthService
from app.sse.service import RedisUnavailableError, metric_event_generator

router = APIRouter(prefix="/api/v1/stream", tags=["sse"])

# Reuse the same OAuth2 scheme as the rest of the app so Swagger UI shows
# the lock icon and the token is extracted from "Authorization: Bearer <token>".
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


@router.get(
    "/metrics/{project_id}",
    summary="Stream live metric events for a project",
    response_description="Server-Sent Events stream of MetricEvent JSON objects",
)
async def stream_metrics(
    project_id: str,
    token: str = Depends(oauth2_scheme),
) -> StreamingResponse:
    """
    Open an SSE stream for *project_id*.

    - **401** — JWT absent, invalid, or expired.
    - **503** — Redis is unreachable.
    - **200** — ``text/event-stream`` response that emits ``data:`` frames and
      periodic ``: heartbeat`` comments.
    """
    # --- JWT validation (Requirements 2.7) ---
    payload = AuthService.decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # --- Redis availability check (Requirements 2.8) ---
    # We must call the generator to trigger the initial Redis ping.  Because
    # metric_event_generator is an async generator, simply calling it returns a
    # generator object without executing any code yet.  We therefore wrap the
    # generator in a thin coroutine that catches RedisUnavailableError on the
    # first iteration and re-raises it as an HTTP 503 before the StreamingResponse
    # is returned to the client.
    #
    # The cleanest approach is to attempt the Redis ping eagerly by creating the
    # generator and advancing it once inside a helper, but that would require
    # buffering the first yielded value.  Instead we rely on the fact that
    # RedisUnavailableError is raised *synchronously* (from the perspective of
    # the async event loop) during the generator's startup phase — i.e. before
    # the first ``yield`` — so we can catch it by wrapping the generator in an
    # async wrapper that re-raises it as an HTTPException.

    async def _guarded_generator():
        """Thin wrapper that converts RedisUnavailableError into an SSE error frame."""
        try:
            async for chunk in metric_event_generator(project_id, settings.REDIS_URL):
                yield chunk
        except RedisUnavailableError:
            # This branch is only reached if the error surfaces mid-stream
            # (shouldn't happen given the startup ping, but kept for safety).
            yield 'event: error\ndata: {"code":"REDIS_UNAVAILABLE"}\n\n'

    # Eagerly attempt to connect to Redis so we can return HTTP 503 *before*
    # sending the 200 + streaming headers to the client.
    try:
        gen = metric_event_generator(project_id, settings.REDIS_URL)
        # Advance to the first yield to trigger the Redis ping inside the generator.
        first_chunk = await gen.__anext__()
    except RedisUnavailableError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stream unavailable: Redis connection failed",
        )
    except StopAsyncIteration:
        # Generator finished immediately (edge case — empty stream).
        first_chunk = None

    # Re-attach the already-started generator so we don't lose the first chunk.
    async def _stream_with_first_chunk():
        if first_chunk is not None:
            yield first_chunk
        try:
            async for chunk in gen:
                yield chunk
        except RedisUnavailableError:
            yield 'event: error\ndata: {"code":"REDIS_UNAVAILABLE"}\n\n'

    # --- Return SSE response (Requirements 2.1, 2.2) ---
    return StreamingResponse(
        _stream_with_first_chunk(),
        media_type="text/event-stream",
        headers={
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-cache",
        },
    )
