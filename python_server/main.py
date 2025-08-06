from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import logging
import tempfile
import os
from pathlib import Path
from typing import List, Optional
from datetime import datetime
import time
from pdf_parser import pdf_parser
from models import PDFProcessingResult, UploadHistoryItem, ProcessingStatus
from clickhouse_service import clickhouse_service
from file_storage import file_storage

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="PDF Scanner Python Server",
    description="Python server for PDF processing and analysis",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response models
class HealthResponse(BaseModel):
    status: str
    message: str
    server: str
    version: str

class PDFUploadResponse(BaseModel):
    upload_id: str
    status: str
    message: str

class PDFProcessingResponse(BaseModel):
    upload_id: str
    status: str
    emails: List[str]
    ssns: List[str]
    text_length: int
    pages_processed: int
    processing_time: float
    error: Optional[str] = None

class UploadHistoryResponse(BaseModel):
    uploads: List[UploadHistoryItem]
    total_count: int

class StatisticsResponse(BaseModel):
    total_uploads: int
    clean_pdfs: int
    pii_pdfs: int
    total_emails: int
    total_ssns: int
    avg_processing_time: float

class TestResultResponse(BaseModel):
    total_tests: int
    passed: int
    failed: int
    success_rate: float
    details: dict

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint to verify server is running"""
    logger.info("Health check requested")
    return HealthResponse(
        status="healthy",
        message="Python server is running successfully",
        server="pdf-scanner-python-server",
        version="1.0.0"
    )

@app.get("/api/python-server-status")
async def server_status():
    """Additional status endpoint for testing"""
    logger.info("Server status requested")
    return {
        "status": "running",
        "server": "Python FastAPI Server",
        "port": 8080,
        "endpoints": [
            "/api/health",
            "/api/python-server-status",
            "/api/upload-pdf",
            "/api/upload-status/{upload_id}",
            "/api/upload-history",
            "/api/statistics",
            "/api/run-tests"
        ],
        "capabilities": [
            "PDF parsing & analysis",
            "PII detection (emails, SSNs)",
            "File upload & storage",
            "Processing status tracking"
        ]
    }

async def process_pdf_background(upload_id: str, file_path: str, filename: str, file_size: int):
    """Background task to process PDF and store results"""
    logger.info(f"Starting background processing for {filename}")
    
    try:
        # Update status to processing
        # (In a real implementation, you'd update this in ClickHouse)
        
        # Parse the PDF
        start_time = time.time()
        parse_result = pdf_parser.parse_pdf(Path(file_path))
        processing_time = time.time() - start_time
        
        # Create processing result
        processing_result = PDFProcessingResult(
            upload_id=upload_id,
            filename=filename,
            file_path=file_path,
            file_size=file_size,
            upload_date=datetime.now(),
            processing_date=datetime.now(),
            status=ProcessingStatus.COMPLETE if parse_result["status"] == "SUCCESS" else ProcessingStatus.FAILED,
            pages_processed=parse_result.get("pages_processed", 0),
            text_length=parse_result.get("text_length", 0),
            processing_time=processing_time,
            emails=parse_result.get("emails", []),
            ssns=parse_result.get("ssns", []),
            error_message=parse_result.get("error")
        )
        
        # Store in ClickHouse
        clickhouse_service.store_upload_result(processing_result)
        
        logger.info(f"Background processing complete for {filename}")
        
    except Exception as e:
        logger.error(f"Background processing failed for {filename}: {e}")
        # Store error result
        error_result = PDFProcessingResult(
            upload_id=upload_id,
            filename=filename,
            file_path=file_path,
            file_size=file_size,
            upload_date=datetime.now(),
            processing_date=datetime.now(),
            status=ProcessingStatus.FAILED,
            pages_processed=0,
            text_length=0,
            processing_time=0,
            emails=[],
            ssns=[],
            error_message=str(e)
        )
        clickhouse_service.store_upload_result(error_result)

@app.post("/api/upload-pdf", response_model=PDFUploadResponse)
async def upload_pdf(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    """Upload PDF file and start processing"""
    logger.info(f"PDF upload requested: {file.filename}")
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Save file to storage
        upload_id, file_path = file_storage.save_uploaded_file(content, file.filename)
        
        # Start background processing
        if background_tasks:
            background_tasks.add_task(
                process_pdf_background, 
                upload_id, 
                file_path, 
                file.filename, 
                file_size
            )
        
        logger.info(f"PDF upload successful: {upload_id}")
        
        return PDFUploadResponse(
            upload_id=upload_id,
            status="uploaded",
            message="PDF uploaded successfully and processing started"
        )
        
    except Exception as e:
        logger.error(f"PDF upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"PDF upload failed: {str(e)}")

@app.get("/api/upload-status/{upload_id}", response_model=PDFProcessingResponse)
async def get_upload_status(upload_id: str):
    """Get processing status for a specific upload"""
    result = clickhouse_service.get_upload_by_id(upload_id)
    
    if not result:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    return PDFProcessingResponse(
        upload_id=result.upload_id,
        status=result.status.value,
        emails=result.emails,
        ssns=result.ssns,
        text_length=result.text_length,
        pages_processed=result.pages_processed,
        processing_time=result.processing_time,
        error=result.error_message
    )

@app.get("/api/upload-history", response_model=UploadHistoryResponse)
async def get_upload_history(limit: int = 50):
    """Get upload history from ClickHouse"""
    uploads = clickhouse_service.get_upload_history(limit)
    
    return UploadHistoryResponse(
        uploads=uploads,
        total_count=len(uploads)
    )

@app.get("/api/statistics", response_model=StatisticsResponse)
async def get_statistics():
    """Get processing statistics from ClickHouse"""
    stats = clickhouse_service.get_statistics()
    
    return StatisticsResponse(**stats)

@app.post("/api/run-tests", response_model=TestResultResponse)
async def run_tests():
    """Run the PDF parsing test suite"""
    logger.info("Test suite execution requested")
    
    try:
        from test_runner import TestRunner
        
        runner = TestRunner()
        results = runner.run_all_tests()
        comparison = runner.compare_results()
        
        # Calculate success rate
        success_rate = (comparison["passed"] / comparison["total_tests"] * 100) if comparison["total_tests"] > 0 else 0
        
        logger.info(f"Test suite complete: {comparison['passed']}/{comparison['total_tests']} passed")
        
        return TestResultResponse(
            total_tests=comparison["total_tests"],
            passed=comparison["passed"],
            failed=comparison["failed"],
            success_rate=success_rate,
            details=comparison["details"]
        )
        
    except Exception as e:
        logger.error(f"Test suite execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Test execution failed: {str(e)}")

if __name__ == "__main__":
    logger.info("Starting Python server on port 8080...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8080,
        reload=True,
        log_level="info"
    ) 