from fastapi import APIRouter
from app.models.schemas import SearchResponse, SuggestionResponse

router = APIRouter()

@router.get("/search", response_model=SearchResponse)
async def search(q: str, type: str = None, limit: int = 10):
    return {"query": q, "results": [], "total_results": 0, "search_time_ms": 0}

@router.get("/search/suggest", response_model=SuggestionResponse)
async def suggest(q: str, limit: int = 5):
    return {"suggestions": []}

from app.db.mongodb_client import mongodb_client
from fastapi.responses import JSONResponse

from fastapi.encoders import jsonable_encoder

@router.get("/debug/entities")
async def debug_entities(limit: int = 50):
    """
    Debug route to see raw extracted entities directly from MongoDB.
    Use this to see exactly what the NLP pipelines extracted.
    """
    if mongodb_client.db is None:
        return {"error": "MongoDB not connected"}
    
    cursor = mongodb_client.db.entities.find({}).sort("_id", -1).limit(limit)
    entities = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string for JSON serialization
    for ent in entities:
        if "_id" in ent:
            ent["_id"] = str(ent["_id"])
            
    return JSONResponse(content=jsonable_encoder({"entities": entities}))
