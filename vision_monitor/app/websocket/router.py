"""WebSocket router for real-time updates."""

import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.websocket.handlers import (
    handle_metrics_websocket,
    handle_inferences_websocket,
    handle_alerts_websocket,
    handle_workflows_websocket,
)
from app.websocket.manager import manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ws", tags=["websocket"])


@router.websocket("/metrics")
async def websocket_metrics(
    websocket: WebSocket,
    model_name: str = Query("llava-1.5"),
    interval: int = Query(5, ge=1, le=60)
):
    """
    WebSocket endpoint for real-time metrics updates.
    
    Streams live metrics data at specified interval (default 5 seconds).
    """
    await handle_metrics_websocket(websocket, model_name, interval)


@router.websocket("/inferences")
async def websocket_inferences(
    websocket: WebSocket,
    interval: int = Query(5, ge=1, le=60)
):
    """
    WebSocket endpoint for real-time inference updates.
    
    Streams live inference run updates at specified interval (default 5 seconds).
    """
    await handle_inferences_websocket(websocket, interval)


@router.websocket("/alerts")
async def websocket_alerts(
    websocket: WebSocket,
    interval: int = Query(10, ge=1, le=60)
):
    """
    WebSocket endpoint for real-time alert notifications.
    
    Streams live alert events at specified interval (default 10 seconds).
    """
    await handle_alerts_websocket(websocket, interval)


@router.websocket("/workflows")
async def websocket_workflows(
    websocket: WebSocket,
    interval: int = Query(5, ge=1, le=60)
):
    """
    WebSocket endpoint for real-time workflow execution updates.
    
    Streams live workflow execution status at specified interval (default 5 seconds).
    """
    await handle_workflows_websocket(websocket, interval)


@router.get("/status")
async def get_websocket_status():
    """
    Get WebSocket connection status.
    
    Returns the number of active connections per channel.
    """
    return {
        "total_connections": manager.get_total_connections(),
        "connections_by_channel": {
            "metrics": manager.get_connection_count("metrics"),
            "inferences": manager.get_connection_count("inferences"),
            "alerts": manager.get_connection_count("alerts"),
            "workflows": manager.get_connection_count("workflows"),
        }
    }
