import os
import asyncio
import json
import base64
from typing import List, Dict, Optional, Any
from datetime import datetime
import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

from services.pdf_processor import PDFProcessor
from services.video_agent import VideoAgent
from services.product_manager import ProductManager
from services.embedding_service import EmbeddingService
from models.schemas import *

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="DEHN Interactive Manual AI Backend",
    description="Python backend for DEHN Interactive Manual with Video Agent and PDF Processing",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
pdf_processor = PDFProcessor()
video_agent = VideoAgent()
product_manager = ProductManager()
embedding_service = EmbeddingService()

# Global state
active_connections: Dict[str, WebSocket] = {}
product_embeddings: Dict[str, Any] = {}

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting DEHN Interactive Manual AI Backend...")

    # Configure Gemini API
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

    # Load existing product embeddings
    await product_manager.load_all_products()

    logger.info("Backend initialized successfully!")

@app.get("/")
async def root():
    return {"message": "DEHN Interactive Manual AI Backend", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "pdf_processor": "active",
            "video_agent": "active",
            "product_manager": "active",
            "embedding_service": "active"
        }
    }

# Product Management Endpoints
@app.get("/api/products", response_model=ProductListResponse)
async def get_products():
    """Get list of all available products"""
    try:
        products = await product_manager.get_all_products()
        return ProductListResponse(
            success=True,
            data={"products": products}
        )
    except Exception as e:
        logger.error(f"Error getting products: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/products/upload")
async def upload_product_pdf(
    product_id: str = Form(...),
    product_name: str = Form(...),
    pdf_file: UploadFile = File(...)
):
    """Upload and process a new product PDF"""
    try:
        # Save uploaded PDF
        pdf_path = f"data/pdfs/{product_id}.pdf"
        os.makedirs(os.path.dirname(pdf_path), exist_ok=True)

        with open(pdf_path, "wb") as buffer:
            content = await pdf_file.read()
            buffer.write(content)

        # Process PDF and generate embeddings
        result = await pdf_processor.process_pdf(pdf_path, product_id, product_name)

        # Store in product manager
        await product_manager.add_product(product_id, product_name, result)

        return {
            "success": True,
            "message": f"Product {product_name} uploaded and processed successfully",
            "data": {
                "product_id": product_id,
                "pages_processed": result["total_pages"],
                "embeddings_generated": len(result["embeddings"])
            }
        }
    except Exception as e:
        logger.error(f"Error uploading product PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/products/batch-upload")
async def batch_upload_pdfs(pdf_list: List[ProductUpload]):
    """Batch upload multiple PDFs"""
    results = []

    for product in pdf_list:
        try:
            # Process each PDF
            result = await pdf_processor.process_pdf(
                product.pdf_path,
                product.product_id,
                product.product_name
            )

            # Store in product manager
            await product_manager.add_product(
                product.product_id,
                product.product_name,
                result
            )

            results.append({
                "product_id": product.product_id,
                "status": "success",
                "pages_processed": result["total_pages"]
            })

        except Exception as e:
            logger.error(f"Error processing {product.product_id}: {e}")
            results.append({
                "product_id": product.product_id,
                "status": "error",
                "error": str(e)
            })

    return {
        "success": True,
        "message": f"Processed {len(pdf_list)} products",
        "results": results
    }

# AI Query Endpoints
@app.post("/api/ask", response_model=AIResponse)
async def ask_question(request: QueryRequest):
    """Ask a question about a specific product"""
    try:
        # Get product embeddings
        product_data = await product_manager.get_product(request.product_id)
        if not product_data:
            raise HTTPException(status_code=404, detail="Product not found")

        # Search for relevant content
        relevant_docs = await embedding_service.search_similar(
            request.query,
            product_data["embeddings"],
            top_k=5
        )

        # Generate response using Gemini
        response = await video_agent.generate_text_response(
            request.query,
            relevant_docs,
            request.product_id,
            request.language
        )

        return AIResponse(
            success=True,
            data={
                "answer": response["answer"],
                "sources": response["sources"],
                "confidence": response["confidence"],
                "safety_warnings": response["safety_warnings"]
            }
        )

    except Exception as e:
        logger.error(f"Error processing question: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/detect")
async def detect_objects(
    product_id: str = Form(...),
    step_number: int = Form(...),
    image: UploadFile = File(...)
):
    """Detect objects in installation image"""
    try:
        # Read and encode image
        image_content = await image.read()
        image_base64 = base64.b64encode(image_content).decode()

        # Get product context
        product_data = await product_manager.get_product(product_id)
        if not product_data:
            raise HTTPException(status_code=404, detail="Product not found")

        # Perform object detection
        result = await video_agent.detect_objects_in_image(
            image_base64,
            product_id,
            step_number,
            product_data
        )

        return {
            "success": True,
            "data": result
        }

    except Exception as e:
        logger.error(f"Error detecting objects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Video Agent WebSocket Endpoint
@app.websocket("/ws/video-agent/{product_id}")
async def video_agent_websocket(websocket: WebSocket, product_id: str):
    """WebSocket endpoint for real-time video agent interaction"""
    await websocket.accept()
    connection_id = f"{product_id}_{datetime.now().timestamp()}"
    active_connections[connection_id] = websocket

    try:
        # Get product context
        product_data = await product_manager.get_product(product_id)
        if not product_data:
            await websocket.send_json({
                "type": "error",
                "message": "Product not found"
            })
            return

        # Initialize video agent session
        session = await video_agent.create_session(product_id, product_data)

        await websocket.send_json({
            "type": "session_ready",
            "session_id": session["id"],
            "product_name": product_data["name"]
        })

        while True:
            # Receive data from client
            data = await websocket.receive_json()

            if data["type"] == "video_frame":
                # Process video frame
                result = await video_agent.process_video_frame(
                    session["id"],
                    data["frame"],
                    data.get("audio", None)
                )

                await websocket.send_json({
                    "type": "analysis_result",
                    "data": result
                })

            elif data["type"] == "audio_only":
                # Process audio only
                result = await video_agent.process_audio(
                    session["id"],
                    data["audio"]
                )

                await websocket.send_json({
                    "type": "audio_response",
                    "data": result
                })

            elif data["type"] == "end_session":
                # End session
                await video_agent.end_session(session["id"])
                break

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {connection_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })
    finally:
        if connection_id in active_connections:
            del active_connections[connection_id]

# Feedback System Endpoints
@app.post("/api/feedback")
async def submit_feedback(
    product_id: str = Form(...),
    step_number: int = Form(...),
    user_rating: int = Form(...),
    comments: str = Form(""),
    reported_issues: str = Form("[]"),
    installation_image: UploadFile = File(...)
):
    """Submit user feedback for training"""
    try:
        # Read and encode image
        image_content = await installation_image.read()
        image_base64 = base64.b64encode(image_content).decode()

        # Process feedback
        feedback_entry = {
            "id": f"feedback_{datetime.now().timestamp()}",
            "timestamp": datetime.now().isoformat(),
            "product_id": product_id,
            "step_number": step_number,
            "user_rating": user_rating,
            "comments": comments,
            "reported_issues": json.loads(reported_issues),
            "image_data": image_base64
        }

        # Store feedback (in production, use proper database)
        feedback_path = f"data/feedback/{feedback_entry['id']}.json"
        os.makedirs(os.path.dirname(feedback_path), exist_ok=True)

        with open(feedback_path, "w") as f:
            json.dump(feedback_entry, f)

        return {
            "success": True,
            "message": "Feedback submitted successfully",
            "data": {
                "feedback_id": feedback_entry["id"],
                "quality_score": 0.85  # Mock quality score
            }
        }

    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/feedback/stats")
async def get_feedback_stats():
    """Get feedback statistics"""
    try:
        # In production, query from database
        return {
            "success": True,
            "data": {
                "total_submissions": 42,
                "average_rating": 4.2,
                "valid_for_training": 38,
                "pending_review": 5
            }
        }
    except Exception as e:
        logger.error(f"Error getting feedback stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
