"""WebSocket manager for real-time updates."""

import logging
import json
from typing import Dict, Set, Any
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manager for WebSocket connections and broadcasting."""
    
    def __init__(self):
        # Store active connections by channel/topic
        self.active_connections: Dict[str, Set[WebSocket]] = {
            "metrics": set(),
            "inferences": set(),
            "alerts": set(),
            "workflows": set(),
        }
        # Store connection metadata
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, channel: str = "metrics"):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        
        if channel not in self.active_connections:
            self.active_connections[channel] = set()
        
        self.active_connections[channel].add(websocket)
        self.connection_metadata[websocket] = {
            "channel": channel,
            "connected_at": str(datetime.utcnow())
        }
        
        logger.info(f"WebSocket connected to channel: {channel}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        # Find which channel this connection belongs to
        for channel, connections in self.active_connections.items():
            if websocket in connections:
                connections.remove(websocket)
                logger.info(f"WebSocket disconnected from channel: {channel}")
                break
        
        # Remove metadata
        if websocket in self.connection_metadata:
            del self.connection_metadata[websocket]
    
    async def broadcast(self, channel: str, message: Dict[str, Any]):
        """Broadcast a message to all connections in a channel."""
        if channel not in self.active_connections:
            return
        
        disconnected = []
        for connection in self.active_connections[channel]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send message to connection: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected connections
        for connection in disconnected:
            self.disconnect(connection)
    
    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        """Send a message to a specific WebSocket connection."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.warning(f"Failed to send personal message: {e}")
            self.disconnect(websocket)
    
    def get_connection_count(self, channel: str) -> int:
        """Get the number of active connections in a channel."""
        return len(self.active_connections.get(channel, set()))
    
    def get_total_connections(self) -> int:
        """Get the total number of active connections across all channels."""
        return sum(len(conns) for conns in self.active_connections.values())


# Global WebSocket manager instance
manager = WebSocketManager()


# Import datetime for the connect method
from datetime import datetime
