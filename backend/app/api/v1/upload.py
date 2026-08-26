import os
import uuid
import aiofiles
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.models.schemas import UploadResponse
from app.config import settings

# Force reload

router = APIRouter()

async def save_upload_file(upload_file: UploadFile, prefix: str, extension: str) -> str:
    upload_id = f"{prefix}_{uuid.uuid4().hex[:8]}"
    os.makedirs(settings.upload_dir, exist_ok=True)
    file_path = os.path.join(settings.upload_dir, f"{upload_id}{extension}")
    
    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await upload_file.read()
            await out_file.write(content)
        return upload_id
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

@router.post("/upload/fir", response_model=UploadResponse, status_code=201)
async def upload_fir(file: UploadFile = File(...), case_number: str = Form(None)):
    # Assuming FIR is PDF or TXT
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.pdf', '.txt', '.docx']:
        ext = '.pdf' # Default fallback
    
    upload_id = await save_upload_file(file, "fir", ext)
    
    return {
        "success": True, 
        "data": {
            "upload_id": upload_id, 
            "filename": file.filename, 
            "file_size_bytes": file.size or 0, 
            "file_type": "fir", 
            "uploaded_at": datetime.utcnow().isoformat(), 
            "status": "uploaded"
        }
    }

@router.post("/upload/cdr", response_model=UploadResponse, status_code=201)
async def upload_cdr(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.csv', '.xlsx', '.txt']:
        ext = '.csv'
        
    upload_id = await save_upload_file(file, "cdr", ext)
    
    return {
        "success": True, 
        "data": {
            "upload_id": upload_id, 
            "filename": file.filename, 
            "file_size_bytes": file.size or 0, 
            "file_type": "cdr", 
            "uploaded_at": datetime.utcnow().isoformat(), 
            "status": "uploaded"
        }
    }

@router.delete("/upload/{upload_id}", status_code=204)
async def delete_upload(upload_id: str):
    pass

