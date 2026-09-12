from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.models.schemas import ProcessRequest, ProcessResponse, ProcessStatusResponse
from app.pipelines.runner import run_pipelines
import uuid

router = APIRouter()

@router.post("/process", response_model=ProcessResponse, status_code=202)
async def process_uploads(request: ProcessRequest, background_tasks: BackgroundTasks):
    if not request.upload_ids:
        return {"success": False, "message": "No upload IDs provided", "data": None}
        
    task_id = str(uuid.uuid4())
    
    # Run pipelines directly in the background to save memory and avoid Celery overhead
    background_tasks.add_task(run_pipelines, request.upload_ids)
    
    return {
        "success": True, 
        "data": {
            "task_id": task_id, 
            "status": "processing", 
            "estimated_duration_seconds": 45, 
            "message": "Started"
        }
    }

@router.get("/process/status/{task_id}", response_model=ProcessStatusResponse)
async def get_process_status(task_id: str):
    return {"task_id": task_id, "status": "completed", "progress_percent": 100, "current_step": "Done", "steps_completed": [], "result": {}, "started_at": "2024-01-01T00:00:00Z"}
