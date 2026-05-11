from app.routers.inference import router as inference_router
from app.routers.metrics import router as metrics_router
from app.routers.evaluation import router as evaluation_router
from app.routers.media import router as media_router
from app.routers.search import router as search_router
from app.routers.alerts import router as alerts_router
from app.routers.health import router as health_router
from app.routers.auth import router as auth_router
from app.routers.camera import router as camera_router
from app.routers.operations import router as operations_router

__all__ = [
    "inference_router",
    "metrics_router",
    "evaluation_router",
    "media_router",
    "search_router",
    "alerts_router",
    "health_router",
    "auth_router",
    "camera_router",
    "operations_router",
]
