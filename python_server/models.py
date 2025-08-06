from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum

class ProcessingStatus(str, Enum):
    UPLOADING = "uploading"
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"

class RedactionType(str, Enum):
    EMAIL = "email"
    SSN = "ssn"
    PHONE = "phone"
    CREDIT_CARD = "credit_card"

class PIILocation(BaseModel):
    """Represents the location of PII in a PDF"""
    text: str
    type: RedactionType
    page_number: int
    x0: float
    y0: float
    x1: float
    y1: float
    confidence: float
    context: str

class RedactionResult(BaseModel):
    """Represents the result of a redaction operation"""
    upload_id: str
    original_file_path: str
    redacted_file_path: str
    redaction_summary: Dict
    pii_locations: List[PIILocation]
    redaction_applied: bool
    redaction_time: Optional[float] = None
    error_message: Optional[str] = None

class PDFUploadRequest(BaseModel):
    filename: str
    file_size: int
    upload_date: datetime

class PDFProcessingResult(BaseModel):
    upload_id: str
    filename: str
    file_path: str
    file_size: int
    upload_date: datetime
    processing_date: Optional[datetime] = None
    status: ProcessingStatus
    pages_processed: int
    text_length: int
    processing_time: float
    emails: List[str]
    ssns: List[str]
    error_message: Optional[str] = None
    # New fields for redaction
    redaction_result: Optional[RedactionResult] = None
    pii_locations: List[PIILocation] = []

class UploadHistoryItem(BaseModel):
    upload_id: str
    filename: str
    upload_date: datetime
    status: ProcessingStatus
    file_size: int
    pages_processed: int
    email_count: int
    ssn_count: int
    processing_time: float
    is_clean: bool  # True if no PII detected
    emails: List[str] = []  # Masked email addresses
    ssns: List[str] = []    # Masked SSNs
    # New fields for redaction
    redaction_applied: bool = False
    redacted_file_available: bool = False
    total_redactions: int = 0 