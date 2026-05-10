"""
SSE service: Redis pub/sub async generator for metric event streaming.
"""
from __future__ import annotations

import asyncio
import logging
from typing import AsyncGenerator

import redis.asyncio as aioredis

logger = logging.getLogger(__name__)

# How long to wait for a message before emitting a heartbeat (seconds)
HEARTBEAT_INTERVAL = 15


class RedisUnavailableError(Exception):
    """Raised when the Redis connection cannot be established at startup."""


async def metric_event_generator(
    project_id: str,
    redis_url: str,
) -> AsyncGenerator[str, None]:
    """Async generator that subscribes to Redis pub/sub and yields SSE frames.

    Yields:
        - ``data: {json_string}\\n\\n`` for each received message
        - ``: heartbeat\\n\\n`` every ``HEARTBEAT_INTERVAL`` seconds when idle
        - ``event: error\\ndata: {"code":"REDIS_UNAVAILABLE"}\\n\\n`` on
          mid-stream Redis failure, then returns

    Raises:
        RedisUnavailableError: If the Redis connection cannot be established
            before the first subscription attempt.
    """
    channel_name = f"metrics:{project_id}"

    # --- Connect to Redis ---
    try:
        client = aioredis.from_url(redis_url, decode_responses=True)
        # Ping to verify the connection is actually reachable before subscribing.
        await client.ping()
    except Exception as exc:
        logger.error("Redis unavailable at startup for channel %s: %s", channel_name, exc)
        raise RedisUnavailableError(
            f"Cannot connect to Redis at {redis_url}: {exc}"
        ) from exc

    pubsub = client.pubsub()

    try:
        await pubsub.subscribe(channel_name)
        logger.info("SSE generator subscribed to Redis channel: %s", channel_name)

        while True:
            try:
                # Wait up to HEARTBEAT_INTERVAL seconds for the next message.
                message = await asyncio.wait_for(
                    pubsub.get_message(ignore_subscribe_messages=True, timeout=0.1),
                    timeout=HEARTBEAT_INTERVAL,
                )
            except asyncio.TimeoutError:
                # No message arrived within the heartbeat window — emit a comment.
                yield ": heartbeat\n\n"
                continue
            except asyncio.CancelledError:
                # Client disconnected; let the finally block clean up.
                raise
            except Exception as exc:
                # Mid-stream Redis failure.
                logger.warning(
                    "Redis error while reading from channel %s: %s", channel_name, exc
                )
                yield 'event: error\ndata: {"code":"REDIS_UNAVAILABLE"}\n\n'
                return

            if message is None:
                # get_message returned None (no message yet); loop and try again.
                continue

            if message.get("type") == "message":
                data = message.get("data", "")
                yield f"data: {data}\n\n"

    except asyncio.CancelledError:
        logger.info("SSE generator cancelled (client disconnected) for channel: %s", channel_name)
        raise
    finally:
        # Always unsubscribe and close cleanly, regardless of how we exit.
        try:
            await pubsub.unsubscribe(channel_name)
            await pubsub.close()
            await client.aclose()
            logger.info("SSE generator cleaned up Redis resources for channel: %s", channel_name)
        except Exception as exc:
            logger.warning("Error during SSE generator cleanup for %s: %s", channel_name, exc)
