import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware 
import logging
import uvicorn

from app.config import settings
from app.db.neo4j_client import neo4j_client
from app.db.mongodb_client import mongodb_client
from app.db.redis_client import redis_client
from app.api.v1 import upload, process, graph, analytics, risk, search, admin

logging.basicConfig(level=getattr(logging, settings.log_level))
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.app_name)

# CORS configuration
origins = settings.cors_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    try:
        neo4j_client.connect()
    except Exception as e:
        logger.warning(f"Neo4j offline. Starting in No-DB mode. ({e})")
        
    try:
        mongodb_client.connect()
    except Exception as e:
        logger.warning(f"MongoDB offline. Starting in No-DB mode. ({e})")
        
    try:
        await redis_client.connect()
    except Exception as e:
        logger.warning(f"Redis offline. Starting in No-DB mode. ({e})")
        
    logger.info("API Startup sequence complete.")

@app.on_event("shutdown")
async def shutdown_event():
    try:
        neo4j_client.close()
        mongodb_client.close()
        await redis_client.close()
    except:
        pass
    logger.info("API Connections closed")

api_router = APIRouter()
api_router.include_router(upload.router, tags=["upload"])
api_router.include_router(process.router, tags=["process"])
api_router.include_router(graph.router, tags=["graph"])
api_router.include_router(analytics.router, tags=["analytics"])
api_router.include_router(risk.router, tags=["risk"])
api_router.include_router(search.router, tags=["search"])
api_router.include_router(admin.router, tags=["admin"])

app.include_router(api_router, prefix="/api/v1")

@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "mode": "standalone" if not mongodb_client.client else "connected",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
