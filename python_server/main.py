from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks, Response
from fastapi.responses import FileResponse
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
from pdf_redactor import pdf_redactor, PIIMatch, RedactionType
from models import PDFProcessingResult, UploadHistoryItem, ProcessingStatus, PIILocation, RedactionResult
from clickhouse_service import clickhouse_service
from file_storage import file_storage

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def mask_pii_data(data: str) -> str:
    """Mask PII data by showing only the first character and replacing the rest with asterisks"""
    if not data or len(data) <= 1:
        return data
    return data[0] + '*' * (len(data) - 1)

def mask_pii_list(data_list: List[str]) -> List[str]:
    """Mask a list of PII data items"""
    return [mask_pii_data(item) for item in data_list]

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
    # Redaction fields
    redaction_applied: Optional[bool] = None
    redacted_file_available: Optional[bool] = None
    total_redactions: Optional[int] = None

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

class FindingsResponse(BaseModel):
    total_pdfs_processed: int
    total_pii_items: int
    success_rate: float
    avg_processing_time: float
    p95_processing_time: float
    pii_types: dict
    processing_trends: list
    recent_uploads: list

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
    """Background task to process PDF and store results with redaction"""
    logger.info(f"Starting background processing for {filename}")
    
    try:
        # Parse the PDF for basic PII detection
        start_time = time.time()
        parse_result = pdf_parser.parse_pdf(Path(file_path))
        processing_time = time.time() - start_time
        
        # Enhanced PII detection with coordinates for redaction
        redaction_start_time = time.time()
        pii_matches, detection_metadata = pdf_redactor.detect_pii_with_coordinates(Path(file_path))
        redaction_time = time.time() - redaction_start_time
        
        # Convert PII matches to PIILocation objects
        pii_locations = []
        for match in pii_matches:
            pii_locations.append(PIILocation(
                text=match.text,
                type=match.type,
                page_number=match.page_number,
                x0=match.bbox.x0,
                y0=match.bbox.y0,
                x1=match.bbox.x1,
                y1=match.bbox.y1,
                confidence=match.confidence,
                context=match.context
            ))
        
        # Create redacted PDF if PII is detected
        redaction_result = None
        if pii_matches:
            redacted_file_path = file_storage.get_redacted_file_path(upload_id, filename)
            redaction_success = pdf_redactor.redact_pdf(
                Path(file_path), 
                Path(redacted_file_path), 
                pii_matches
            )
            
            if redaction_success:
                redaction_summary = pdf_redactor.get_redaction_summary(pii_matches)
                redaction_result = RedactionResult(
                    upload_id=upload_id,
                    original_file_path=file_path,
                    redacted_file_path=redacted_file_path,
                    redaction_summary=redaction_summary,
                    pii_locations=pii_locations,
                    redaction_applied=True,
                    redaction_time=redaction_time
                )
        
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
            error_message=parse_result.get("error"),
            redaction_result=redaction_result,
            pii_locations=pii_locations
        )
        
        # Store in ClickHouse
        clickhouse_service.store_upload_result(processing_result)
        
        logger.info(f"Background processing complete for {filename} - {len(pii_matches)} PII items detected")
        
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
        emails=mask_pii_list(result.emails),
        ssns=mask_pii_list(result.ssns),
        text_length=result.text_length,
        pages_processed=result.pages_processed,
        processing_time=result.processing_time,
        error=result.error_message,
        redaction_applied=result.redaction_result is not None if result.redaction_result else None,
        redacted_file_available=result.redaction_result.redacted_file_path is not None if result.redaction_result else None,
        total_redactions=result.redaction_result.redaction_summary.get('total_redactions', 0) if result.redaction_result else None
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

@app.get("/api/findings", response_model=FindingsResponse)
async def get_findings():
    """Get findings and analytics data for metrics page"""
    logger.info("Findings requested")
    findings = clickhouse_service.get_findings()
    return FindingsResponse(**findings)

@app.get("/api/download-pdf/{upload_id}")
async def download_pdf(upload_id: str):
    """Download a processed PDF file"""
    logger.info(f"PDF download requested for upload_id: {upload_id}")
    
    try:
        # Get upload details from ClickHouse
        upload_result = clickhouse_service.get_upload_by_id(upload_id)
        if not upload_result:
            raise HTTPException(status_code=404, detail="Upload not found")
        
        # Check if file exists
        file_path = Path(upload_result.file_path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="PDF file not found")
        
        # Return the file
        return FileResponse(
            path=str(file_path),
            filename=upload_result.filename,
            media_type='application/pdf'
        )
        
    except Exception as e:
        logger.error(f"Download failed for upload_id {upload_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@app.get("/api/download-redacted-pdf/{upload_id}")
async def download_redacted_pdf(upload_id: str):
    """Download redacted PDF file"""
    logger.info(f"Redacted PDF download requested for upload_id: {upload_id}")
    
    try:
        # Get upload details from ClickHouse
        upload_result = clickhouse_service.get_upload_by_id(upload_id)
        if not upload_result:
            raise HTTPException(status_code=404, detail="Upload not found")
        
        # Check if redacted file exists
        redacted_file_path = file_storage.get_redacted_file_path(upload_id, upload_result.filename)
        if not Path(redacted_file_path).exists():
            raise HTTPException(status_code=404, detail="Redacted PDF file not found")
        
        # Create redacted filename
        name, ext = os.path.splitext(upload_result.filename)
        redacted_filename = f"{name}_redacted{ext}"
        
        # Return the redacted file
        return FileResponse(
            path=redacted_file_path,
            filename=redacted_filename,
            media_type='application/pdf'
        )
        
    except Exception as e:
        logger.error(f"Redacted download failed for upload_id {upload_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Redacted download failed: {str(e)}")

@app.get("/api/redaction-details/{upload_id}")
async def get_redaction_details(upload_id: str):
    """Get detailed redaction information for an upload"""
    logger.info(f"Redaction details requested for upload_id: {upload_id}")
    
    try:
        # Get upload details from ClickHouse
        upload_result = clickhouse_service.get_upload_by_id(upload_id)
        if not upload_result:
            raise HTTPException(status_code=404, detail="Upload not found")
        
        # Check if redaction was applied
        if not upload_result.redaction_result:
            return {
                "upload_id": upload_id,
                "redaction_applied": False,
                "message": "No redaction was applied to this file"
            }
        
        return {
            "upload_id": upload_id,
            "redaction_applied": True,
            "redaction_summary": upload_result.redaction_result.redaction_summary,
            "pii_locations": [loc.dict() for loc in upload_result.pii_locations],
            "redaction_time": upload_result.redaction_result.redaction_time,
            "total_redactions": len(upload_result.pii_locations)
        }
        
    except Exception as e:
        logger.error(f"Failed to get redaction details for upload_id {upload_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get redaction details: {str(e)}")

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