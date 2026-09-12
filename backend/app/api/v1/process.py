from fastapi import APIRouter
from app.models.schemas import ProcessRequest, ProcessResponse, ProcessStatusResponse
from app.tasks.celery_tasks import process_upload_task

router = APIRouter()

@router.post("/process", response_model=ProcessResponse, status_code=202)
async def process_uploads(request: ProcessRequest):
    if not request.upload_ids:
        return {"success": False, "message": "No upload IDs provided", "data": None}
        
    # Trigger the background celery task and wait for it to complete
    task = process_upload_task.delay(request.upload_ids, request.options.dict())
    try:
        task.get(timeout=60)
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))
    
    return {
        "success": True, 
        "data": {
            "task_id": str(task.id), 
            "status": "processing", 
            "estimated_duration_seconds": 45, 
            "message": "Started"
        }
    }

@router.get("/process/status/{task_id}", response_model=ProcessStatusResponse)
async def get_process_status(task_id: str):
    return {"task_id": task_id, "status": "completed", "progress_percent": 100, "current_step": "Done", "steps_completed": [], "result": {}, "started_at": "2024-01-01T00:00:00Z"}
