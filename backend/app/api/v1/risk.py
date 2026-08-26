from fastapi import APIRouter

router = APIRouter()

@router.get("/risk/score/{entity_id}")
async def get_risk_score(entity_id: str):
    return {"entity_id": entity_id, "risk_score": 50, "risk_level": "MEDIUM"}

@router.post("/risk/recalculate", status_code=202)
async def recalculate_risk():
    return {"task_id": "risk_task_1"}
