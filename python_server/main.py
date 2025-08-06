from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import logging
import tempfile
import os
from pathlib import Path
from typing import List, Optional
from pdf_parser import pdf_parser

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

class PDFParseResponse(BaseModel):
    status: str
    emails: List[str]
    ssns: List[str]
    text_length: int
    pages_processed: int
    processing_time: float
    error: Optional[str] = None

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
            "/api/parse-pdf",
            "/api/run-tests"
        ],
        "capabilities": [
            "PDF generation (PyMuPDF)",
            "PDF parsing (PyMuPDF)",
            "PDF redacting (PyMuPDF)", 
            "ClickHouse database integration",
            "PII detection (emails, SSNs)",
            "Test suite execution"
        ]
    }

@app.post("/api/parse-pdf", response_model=PDFParseResponse)
async def parse_pdf(file: UploadFile = File(...)):
    """Parse uploaded PDF and detect PII"""
    logger.info(f"PDF upload requested: {file.filename}")
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = Path(temp_file.name)
    
    try:
        # Parse the PDF
        import time
        start_time = time.time()
        result = pdf_parser.parse_pdf(temp_file_path)
        processing_time = time.time() - start_time
        
        # Add processing time to result
        result["processing_time"] = processing_time
        
        logger.info(f"PDF parsing complete: {len(result['emails'])} emails, {len(result['ssns'])} SSNs found")
        
        return PDFParseResponse(**result)
        
    except Exception as e:
        logger.error(f"PDF parsing failed: {e}")
        raise HTTPException(status_code=500, detail=f"PDF parsing failed: {str(e)}")
    
    finally:
        # Clean up temporary file
        if temp_file_path.exists():
            os.unlink(temp_file_path)

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