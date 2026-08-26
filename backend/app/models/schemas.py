from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class BaseResponse(BaseModel):
    success: bool
    message: str = "Operation completed successfully"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Dict[str, Any] = {}

class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# -- Upload Schemas --
class UploadResponseData(BaseModel):
    upload_id: str
    filename: str
    file_size_bytes: int
    file_type: str
    uploaded_at: datetime
    status: str

class UploadResponse(BaseResponse):
    data: UploadResponseData

class UploadDetailsResponse(BaseModel):
    upload_id: str
    filename: str
    file_type: str
    status: str
    uploaded_at: str
    processing_result: Dict[str, int] = {}

# -- Process Schemas --
class ProcessRequestOptions(BaseModel):
    run_entity_resolution: bool = True
    build_graph: bool = True
    run_analytics: bool = True
    calculate_risk: bool = True

class ProcessRequest(BaseModel):
    upload_ids: List[str]
    options: ProcessRequestOptions = ProcessRequestOptions()

class ProcessResponseData(BaseModel):
    task_id: str
    status: str
    estimated_duration_seconds: int
    message: str

class ProcessResponse(BaseResponse):
    data: ProcessResponseData

class ProcessStatusResponse(BaseModel):
    task_id: str
    status: str
    progress_percent: int
    current_step: str
    steps_completed: List[str]
    result: Dict[str, Any]
    started_at: str
    completed_at: Optional[str] = None
    duration_seconds: Optional[int] = None
    errors: List[str] = []

# -- Graph Schemas --
class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None
    pagerank_score: Optional[float] = None
    degree_centrality: Optional[float] = None
    community_id: Optional[int] = None
    sources: List[str] = []
    metadata: Dict[str, Any] = {}
    position: Optional[Dict[str, int]] = None

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str
    weight: float
    label: Optional[str] = None
    metadata: Dict[str, Any] = {}

class GraphResponseStats(BaseModel):
    total_nodes: int
    total_edges: int
    nodes_returned: int
    edges_returned: int
    communities: Optional[int] = None
    avg_risk_score: Optional[int] = None

class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: GraphResponseStats

# -- Search Schemas --
class SearchResultItem(BaseModel):
    entity_id: str
    type: str
    label: str
    risk_score: Optional[int]
    match_score: float
    match_type: str
    snippet: Optional[str] = None
    sources: List[str] = []
    last_activity: Optional[str] = None

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem]
    total_results: int
    search_time_ms: int

class SearchSuggestion(BaseModel):
    text: str
    entity_id: str
    type: str
    risk_score: Optional[int] = None

class SuggestionResponse(BaseModel):
    suggestions: List[SearchSuggestion]
