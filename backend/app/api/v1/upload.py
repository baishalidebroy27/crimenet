import os
import uuid
import aiofiles
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.models.schemas import UploadResponse
from app.config import settings
from app.db.mongodb_client import mongodb_client
from app.db.neo4j_client import neo4j_client

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
    
    metadata = {
        "upload_id": upload_id, 
        "filename": file.filename, 
        "file_size_bytes": file.size or 0, 
        "file_type": "fir", 
        "uploaded_at": datetime.utcnow().isoformat(), 
        "status": "uploaded",
        "case_number": case_number
    }
    
    if mongodb_client.db is not None:
        await mongodb_client.db.uploads.insert_one(metadata.copy())
    
    return {
        "success": True, 
        "data": metadata
    }

@router.post("/upload/cdr", response_model=UploadResponse, status_code=201)
async def upload_cdr(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.csv', '.xlsx', '.txt']:
        ext = '.csv'
        
    upload_id = await save_upload_file(file, "cdr", ext)
    
    metadata = {
        "upload_id": upload_id, 
        "filename": file.filename, 
        "file_size_bytes": file.size or 0, 
        "file_type": "cdr", 
        "uploaded_at": datetime.utcnow().isoformat(), 
        "status": "uploaded"
    }
    
    if mongodb_client.db is not None:
        await mongodb_client.db.uploads.insert_one(metadata.copy())
    
    return {
        "success": True, 
        "data": metadata
    }

@router.get("/uploads")
async def get_uploads():
    if mongodb_client.db is None:
        return {"success": False, "data": []}
    
    cursor = mongodb_client.db.uploads.find({}).sort("uploaded_at", -1)
    uploads = await cursor.to_list(length=100)
    
    # Convert ObjectId to string for JSON serialization
    for upload in uploads:
        upload["_id"] = str(upload["_id"])
        
    return {"success": True, "data": uploads}

@router.delete("/upload/{upload_id}", status_code=204)
async def delete_upload(upload_id: str):
    if mongodb_client.db is not None:
        # Delete from uploads
        await mongodb_client.db.uploads.delete_one({"upload_id": upload_id})
        
        # Delete entities and relationships from MongoDB
        await mongodb_client.db.entities.delete_many({"sources.source_id": upload_id})
        await mongodb_client.db.relationships.delete_many({"source_upload_id": upload_id})
        
    # Delete associated nodes and edges from Neo4j
    driver = neo4j_client.get_driver()
    if driver is not None:
        with driver.session() as session:
            # Delete relationships originating from this upload
            session.run("MATCH ()-[r]-() WHERE r.source_upload_id = $upload_id DELETE r", upload_id=upload_id)
            # Delete nodes originating from this upload
            session.run("MATCH (n) WHERE $upload_id IN n.sources DETACH DELETE n", upload_id=upload_id)
            
    return {"success": True}
