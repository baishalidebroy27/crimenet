from fastapi import APIRouter
from app.models.schemas import SearchResponse, SuggestionResponse

router = APIRouter()

@router.get("/search", response_model=SearchResponse)
async def search(q: str, type: str = None, limit: int = 10):
    return {"query": q, "results": [], "total_results": 0, "search_time_ms": 0}

@router.get("/search/suggest", response_model=SuggestionResponse)
async def suggest(q: str, limit: int = 5):
    return {"suggestions": []}
