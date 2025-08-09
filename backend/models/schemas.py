from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime

# Request Models
class QueryRequest(BaseModel):
    query: str
    product_id: str
    language: str = "en"
    section_filter: Optional[str] = None

class ProductUpload(BaseModel):
    product_id: str
    product_name: str
    pdf_path: str

class FeedbackRequest(BaseModel):
    product_id: str
    step_number: int
    user_rating: int
    comments: Optional[str] = ""
    reported_issues: List[str] = []

# Response Models
class ProductInfo(BaseModel):
    id: str
    name: str
    category: str
    total_pages: int
    last_updated: datetime
    embeddings_count: int

class ProductListResponse(BaseModel):
    success: bool
    data: Dict[str, List[ProductInfo]]

class AIResponseData(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    confidence: float
    safety_warnings: List[str]

class AIResponse(BaseModel):
    success: bool
    data: AIResponseData

class DetectedComponent(BaseModel):
    name: str
    confidence: float
    status: str  # 'correct', 'incorrect', 'missing'
    bounding_box: Optional[Dict[str, float]] = None
    issues: List[str] = []

class ObjectDetectionResult(BaseModel):
    detected_components: List[DetectedComponent]
    overall_status: str  # 'complete', 'incomplete', 'error'
    suggestions: List[str]
    confidence: float

class VideoAnalysisResult(BaseModel):
    timestamp: datetime
    detected_objects: List[DetectedComponent]
    audio_transcript: Optional[str] = None
    ai_response: Optional[str] = None
    installation_guidance: List[str] = []
    safety_alerts: List[str] = []

class SessionInfo(BaseModel):
    id: str
    product_id: str
    product_name: str
    created_at: datetime
    status: str  # 'active', 'ended'

# Document Models
class MultimodalDocument(BaseModel):
    id: str
    content: str
    type: str  # 'text', 'image'
    page_number: int
    embedding: List[float]
    image_data: Optional[str] = None
    metadata: Dict[str, Any] = {}

class ProductData(BaseModel):
    id: str
    name: str
    category: str
    total_pages: int
    documents: List[MultimodalDocument]
    embeddings: Dict[str, Any]
    last_updated: datetime

# Feedback Models
class FeedbackEntry(BaseModel):
    id: str
    timestamp: datetime
    user_id: str
    product_id: str
    step_number: int
    original_image: Dict[str, Any]
    ai_analysis: ObjectDetectionResult
    user_feedback: Dict[str, Any]
    training_metadata: Dict[str, Any]

class FeedbackStats(BaseModel):
    total_submissions: int
    average_rating: float
    valid_for_training: int
    pending_review: int
    common_issues: List[str]
