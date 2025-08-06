from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

class ProcessingStatus(str, Enum):
    UPLOADING = "uploading"
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"

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