from fastapi import WebSocket
from typing import Dict, List
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Maps restaurant_id to a list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, restaurant_id: str):
        await websocket.accept()
        if restaurant_id not in self.active_connections:
            self.active_connections[restaurant_id] = []
        self.active_connections[restaurant_id].append(websocket)
        logger.info(f"Kitchen KDS connected for restaurant {restaurant_id}. Total: {len(self.active_connections[restaurant_id])}")

    def disconnect(self, websocket: WebSocket, restaurant_id: str):
        if restaurant_id in self.active_connections:
            if websocket in self.active_connections[restaurant_id]:
                self.active_connections[restaurant_id].remove(websocket)
                logger.info(f"Kitchen KDS disconnected for restaurant {restaurant_id}. Remaining: {len(self.active_connections[restaurant_id])}")
            if not self.active_connections[restaurant_id]:
                del self.active_connections[restaurant_id]

    async def broadcast(self, restaurant_id: str, message: dict):
        if restaurant_id in self.active_connections:
            # We must handle disconnected sockets that weren't cleaned up gracefully
            dead_sockets = []
            for connection in self.active_connections[restaurant_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to WS: {e}")
                    dead_sockets.append(connection)
            
            for dead in dead_sockets:
                self.disconnect(dead, restaurant_id)

manager = ConnectionManager()
