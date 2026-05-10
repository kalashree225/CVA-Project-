"""WebSocket handlers for real-time updates."""

import logging
import asyncio
from datetime import datetime
from typing import Dict, Any
from fastapi import WebSocket, WebSocketDisconnect, Query

from app.database import get_db
from sqlalchemy import select
from app.models.run import InferenceRun
from app.models.alert import AlertEvent
from app.websocket.manager import manager
from app.services.metric_service import MetricService

logger = logging.getLogger(__name__)


async def handle_metrics_websocket(
    websocket: WebSocket,
    model_name: str = "llava-1.5",
    interval: int = 5
):
    """
    Handle WebSocket connection for real-time metrics.
    
    Streams live metrics data at specified interval.
    """
    await manager.connect(websocket, channel="metrics")
    
    try:
        while True:
            # Get latest metrics
            try:
                # Get recent metrics summary
                summary = await MetricService.get_metrics_summary(hours=1)
                
                # Get time-series data for the model
                timeseries = await MetricService.get_timeseries(
                    metric="latency_ms",
                    model=model_name,
                    hours=1
                )
                
                message = {
                    "type": "metrics_update",
                    "timestamp": datetime.utcnow().isoformat(),
                    "model_name": model_name,
                    "summary": summary,
                    "timeseries": timeseries[-10:] if timeseries else []  # Last 10 points
                }
                
                await manager.send_personal_message(message, websocket)
                
            except Exception as e:
                logger.error(f"Error fetching metrics: {e}")
            
            await asyncio.sleep(interval)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Metrics WebSocket disconnected")
    except Exception as e:
        logger.error(f"Metrics WebSocket error: {e}")
        manager.disconnect(websocket)


async def handle_inferences_websocket(
    websocket: WebSocket,
    interval: int = 5
):
    """
    Handle WebSocket connection for real-time inference updates.
    
    Streams live inference run updates.
    """
    await manager.connect(websocket, channel="inferences")
    
    try:
        while True:
            # Get recent inference runs
            try:
                db = get_db()
                async with db as session:
                    query = select(InferenceRun).order_by(
                        InferenceRun.created_at.desc()
                    ).limit(10)
                    result = await session.execute(query)
                    runs = result.scalars().all()
                
                message = {
                    "type": "inferences_update",
                    "timestamp": datetime.utcnow().isoformat(),
                    "runs": [
                        {
                            "id": run.id,
                            "model_name": run.model_name,
                            "status": run.status,
                            "latency_ms": run.latency_ms,
                            "created_at": run.created_at.isoformat(),
                        }
                        for run in runs
                    ]
                }
                
                await manager.send_personal_message(message, websocket)
                
            except Exception as e:
                logger.error(f"Error fetching inferences: {e}")
            
            await asyncio.sleep(interval)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Inferences WebSocket disconnected")
    except Exception as e:
        logger.error(f"Inferences WebSocket error: {e}")
        manager.disconnect(websocket)


async def handle_alerts_websocket(
    websocket: WebSocket,
    interval: int = 10
):
    """
    Handle WebSocket connection for real-time alert notifications.
    
    Streams live alert events.
    """
    await manager.connect(websocket, channel="alerts")
    
    try:
        while True:
            # Get recent alert events
            try:
                db = get_db()
                async with db as session:
                    query = select(AlertEvent).order_by(
                        AlertEvent.triggered_at.desc()
                    ).limit(10)
                    result = await session.execute(query)
                    events = result.scalars().all()
                
                message = {
                    "type": "alerts_update",
                    "timestamp": datetime.utcnow().isoformat(),
                    "events": [
                        {
                            "id": event.id,
                            "rule_id": event.rule_id,
                            "severity": "high" if event.triggered_value > 0.8 else "medium",
                            "message": event.message,
                            "triggered_at": event.triggered_at.isoformat(),
                        }
                        for event in events
                    ]
                }
                
                await manager.send_personal_message(message, websocket)
                
            except Exception as e:
                logger.error(f"Error fetching alerts: {e}")
            
            await asyncio.sleep(interval)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Alerts WebSocket disconnected")
    except Exception as e:
        logger.error(f"Alerts WebSocket error: {e}")
        manager.disconnect(websocket)


async def handle_workflows_websocket(
    websocket: WebSocket,
    interval: int = 5
):
    """
    Handle WebSocket connection for real-time workflow execution updates.
    
    Streams live workflow execution status.
    """
    await manager.connect(websocket, channel="workflows")
    
    try:
        while True:
            # Get recent workflow executions
            try:
                from app.workflows.engine import workflow_engine
                
                # Get active executions
                active_executions = {
                    exec_id: {
                        "id": exec_id,
                        "workflow_id": exec.workflow_id,
                        "status": exec.status.value,
                        "started_at": exec.started_at.isoformat() if exec.started_at else None,
                    }
                    for exec_id, exec in workflow_engine.active_executions.items()
                }
                
                message = {
                    "type": "workflows_update",
                    "timestamp": datetime.utcnow().isoformat(),
                    "active_executions": active_executions,
                    "count": len(active_executions)
                }
                
                await manager.send_personal_message(message, websocket)
                
            except Exception as e:
                logger.error(f"Error fetching workflow executions: {e}")
            
            await asyncio.sleep(interval)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Workflows WebSocket disconnected")
    except Exception as e:
        logger.error(f"Workflows WebSocket error: {e}")
        manager.disconnect(websocket)
