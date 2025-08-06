# PDF Redactor - PII Detection, Redaction & Analytics

A comprehensive PDF processing application that detects Personally Identifiable Information (PII), provides secure redaction capabilities, and delivers real-time analytics using ClickHouse for high-performance data processing.

## 🚀 Key Features

### Core Functionality
- **PII Detection**: Advanced detection of emails, SSNs, and other sensitive data
- **PDF Redaction**: Secure removal of PII with visual indicators
- **Real-time Analytics**: Live dashboard with processing metrics and trends
- **Download Management**: Download both original and redacted PDF versions
- **Performance Monitoring**: P95 processing times and success rate tracking

### Security Features
- **PII Masking**: Sensitive data is masked in the UI for privacy
- **Secure Redaction**: Permanently removes PII from PDFs
- **Audit Trail**: Complete processing history and redaction logs
- **File Isolation**: Each upload gets a unique, secure storage location

## Data Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   PDF Upload    │───▶│  React Frontend  │───▶│ FastAPI Backend │
│   (Port 3000)   │    │   (Port 3000)    │    │   (Port 8080)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Analytics       │◀───│  ClickHouse DB   │◀───│  PII Detection  │
│ Dashboard       │    │   (Port 8123)    │    │   (Regex/ML)    │
│ (Real-time)     │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         ▲
                                                         │
                                              ┌─────────────────┐
                                              │  PDF Parser     │
                                              │  (PyMuPDF)      │
                                              └─────────────────┘
                                                         │
                                                         ▼
                                              ┌─────────────────┐
                                              │  PDF Redaction  │
                                              │  (PyMuPDF)      │
                                              └─────────────────┘
                                                         │
                                                         ▼
                                              ┌─────────────────┐
                                              │  File Storage   │
                                              │  (Original +    │
                                              │   Redacted)     │
                                              └─────────────────┘

Data Flow Steps:
1. User uploads PDF via React frontend (Port 3000)
2. Frontend sends file to FastAPI backend (Port 8080)
3. Backend stores PDF in file system with UUID
4. PDF Parser extracts text using PyMuPDF
5. PII Detection scans for emails, SSNs using regex patterns
6. PDF Redaction creates secure version with PII removed
7. Results stored in ClickHouse database (Port 8123)
8. Analytics dashboard queries ClickHouse for real-time metrics
9. Frontend displays processing results, analytics, and download options
10. Users can download original or redacted PDF versions

Key Components:
• React Frontend: File upload UI, analytics dashboard, download management
• FastAPI Backend: REST API, background processing, redaction engine
• PDF Parser: Text extraction using PyMuPDF
• PII Detection: Regex-based email/SSN detection
• PDF Redaction: Secure PII removal with visual indicators
• ClickHouse: Analytics database with materialized views
• File Storage: Local filesystem organized by upload ID (original + redacted)
```

## Design Choices

### Why ClickHouse?
- **Analytics-focused**: ClickHouse is designed for analytical queries, perfect for processing large volumes of PDF scan data
- **Columnar storage**: Efficient for aggregating PII detection statistics and time-series data
- **Materialized views**: Fast lookups for specific PII types (emails, SSNs) without complex joins
- **Real-time ingestion**: Handles high-throughput PDF processing events efficiently
- **P95 calculations**: Built-in quantile functions for performance monitoring

### Architecture Decisions
- **Python FastAPI backend**: High-performance async API for PDF processing and redaction
- **React frontend**: Modern UI with Material-UI for analytics visualization and download management
- **Docker deployment**: Consistent environment across development and production
- **Integrated workflow**: PDF processing, redaction, analytics storage, and UI work together as a cohesive system
- **Dual file storage**: Maintains both original and redacted versions for compliance and user choice

## Quick Start

### Development Setup

1. **Start ClickHouse Database**
```bash
./setup-clickhouse.sh
```

2. **Start Python Backend** (Port 8080)
```bash
cd python_server
pip install -r requirements.txt
python main.py
```

3. **Start React Frontend** (Port 3000)
```bash
npm install
npm start
```

### Production Setup
```bash
docker-compose up -d
```

## Project Structure

```
pdf-redactor/
├── src/                    # React frontend (Port 3000)
│   ├── pages/             # Main application pages
│   │   ├── HomePage.tsx   # Dashboard with analytics overview
│   │   ├── PDFPage.tsx    # PDF upload and management
│   │   └── MetricsPage.tsx # Detailed analytics and P95 metrics
│   └── components/        # Reusable UI components
├── python_server/          # FastAPI backend (Port 8080)
│   ├── main.py            # API endpoints and routing
│   ├── pdf_parser.py      # PDF text extraction
│   ├── clickhouse_service.py # Database operations
│   └── file_storage.py    # File management
├── infra/clickhouse/       # Database setup
├── docker-compose.yml      # Production deployment
└── setup-clickhouse.sh     # Database initialization
```

## API Endpoints

### PDF Processing & Management
- `POST /api/upload-pdf` - Upload and process PDF file
- `GET /api/upload-history` - List all processed files with PII data
- `GET /api/upload-status/{upload_id}` - Get processing status
- `GET /api/download-pdf/{upload_id}` - Download original PDF
- `GET /api/download-redacted-pdf/{upload_id}` - Download redacted PDF
- `DELETE /api/files/{file_id}` - Delete processed file

### Analytics & Metrics
- `GET /api/findings` - Get comprehensive analytics and findings data
- `GET /api/statistics` - Get overall processing statistics
- `GET /api/upload-history` - Get list of processed files with PII data

### Health & Monitoring
- `GET /api/health` - Server health status
- `GET /api/python-server-status` - Server capabilities and endpoints

### API Endpoints with Sample Responses

#### 1. GET /api/findings - Comprehensive Analytics

**Sample Response:**
```json
{
  "total_pdfs_processed": 150,
  "total_pii_items": 342,
  "success_rate": 98.5,
  "avg_processing_time": 0.003,
  "p95_processing_time": 0.008,
  "pii_types": {
    "emails": 245,
    "ssns": 97
  },
  "processing_trends": [
    {
      "date": "2024-01-15",
      "uploads": 12,
      "avg_time": 0.003
    },
    {
      "date": "2024-01-14",
      "uploads": 8,
      "avg_time": 0.004
    },
    {
      "date": "2024-01-13",
      "uploads": 15,
      "avg_time": 0.002
    }
  ],
  "recent_uploads": [
    {
      "upload_id": "195fe7a3-b850-4d4b-a54c-85e229837ba8",
      "filename": "document.pdf",
      "upload_date": "2024-01-15T10:30:00",
      "status": "complete",
      "email_count": 3,
      "ssn_count": 1,
      "processing_time": 0.002,
      "redaction_applied": true,
      "redacted_file_available": true,
      "total_redactions": 4
    },
    {
      "upload_id": "6ae18591-4f3e-4a32-b415-3e2629fc0ba9",
      "filename": "report.pdf",
      "upload_date": "2024-01-15T09:15:00",
      "status": "complete",
      "email_count": 0,
      "ssn_count": 0,
      "processing_time": 0.001,
      "redaction_applied": false,
      "redacted_file_available": false,
      "total_redactions": 0
    }
  ]
}
```

#### 2. GET /api/statistics - Overall Processing Statistics

**Sample Response:**
```json
{
  "total_uploads": 150,
  "clean_pdfs": 45,
  "pii_pdfs": 105,
  "total_emails": 245,
  "total_ssns": 97,
  "avg_processing_time": 0.003
}
```

#### 3. GET /api/upload-history - Upload History with PII Data

**Sample Response:**
```json
{
  "uploads": [
    {
      "upload_id": "195fe7a3-b850-4d4b-a54c-85e229837ba8",
      "filename": "document.pdf",
      "upload_date": "2024-01-15T10:30:00",
      "status": "complete",
      "file_size": 245760,
      "pages_processed": 3,
      "email_count": 3,
      "ssn_count": 1,
      "processing_time": 0.002,
      "is_clean": false,
      "emails": ["j***@example.com", "a***@company.org", "u***@test.net"],
      "ssns": ["123-**-4567"],
      "redaction_applied": true,
      "redacted_file_available": true,
      "total_redactions": 4
    },
    {
      "upload_id": "6ae18591-4f3e-4a32-b415-3e2629fc0ba9",
      "filename": "clean_report.pdf",
      "upload_date": "2024-01-15T09:15:00",
      "status": "complete",
      "file_size": 102400,
      "pages_processed": 1,
      "email_count": 0,
      "ssn_count": 0,
      "processing_time": 0.001,
      "is_clean": true,
      "emails": [],
      "ssns": [],
      "redaction_applied": false,
      "redacted_file_available": false,
      "total_redactions": 0
    }
  ],
  "total_count": 2
}
```

#### 4. GET /api/upload-status/{upload_id} - Processing Status

**Sample Response:**
```json
{
  "upload_id": "195fe7a3-b850-4d4b-a54c-85e229837ba8",
  "status": "complete",
  "emails": ["j***@example.com", "a***@company.org", "u***@test.net"],
  "ssns": ["123-**-4567"],
  "text_length": 15420,
  "pages_processed": 3,
  "processing_time": 0.002,
  "error": null
}
```

#### 5. GET /api/health - Server Health Status

**Sample Response:**
```json
{
  "status": "healthy",
  "message": "PDF Redactor server is running",
  "server": "FastAPI",
  "version": "1.0.0"
}
```

#### 6. GET /api/python-server-status - Server Capabilities

**Sample Response:**
```json
{
  "status": "running",
  "server": "PDF Redactor Python Server",
  "port": 8080,
  "endpoints": [
    "/api/health",
    "/api/findings",
    "/api/statistics",
    "/api/upload-history",
    "/api/upload-pdf",
    "/api/download-pdf/{upload_id}",
    "/api/download-redacted-pdf/{upload_id}"
  ],
  "capabilities": [
    "PDF parsing and text extraction",
    "PII detection (emails, SSNs, phones, credit cards)",
    "PDF redaction with coordinate-based detection",
    "ClickHouse analytics integration",
    "Real-time processing metrics",
    "P95 performance monitoring",
    "Secure file download management"
  ]
}
```

#### 7. POST /api/upload-pdf - Upload Response

**Sample Response:**
```json
{
  "upload_id": "195fe7a3-b850-4d4b-a54c-85e229837ba8",
  "status": "uploaded",
  "message": "PDF uploaded successfully and queued for processing"
}
```

#### 8. POST /api/run-tests - Test Suite Results

**Sample Response:**
```json
{
  "total_tests": 15,
  "passed": 14,
  "failed": 1,
  "success_rate": 93.33,
  "details": {
    "pdf_parsing": {
      "passed": 5,
      "failed": 0
    },
    "pii_detection": {
      "passed": 6,
      "failed": 1
    },
    "redaction": {
      "passed": 3,
      "failed": 0
    }
  }
}
```

**Data Points:**
- **Total PDFs**: Count of all processed documents
- **PII Items**: Total number of detected emails and SSNs
- **Success Rate**: Percentage of successful processing attempts
- **Processing Time**: Average time to process PDFs (in seconds, typically 0.001-0.005s)
- **P95 Processing Time**: 95th percentile processing time for performance monitoring
- **PII Distribution**: Breakdown by type (emails vs SSNs)
- **Trends**: Daily processing statistics for the last 7 days
- **Recent Uploads**: Latest 10 processed files with metadata and redaction status

## Database Schema

### Updated ClickHouse Schema

```sql
-- Main PDF uploads table with redaction support
CREATE TABLE pdf_uploads (
    upload_id String,
    filename String,
    file_path String,
    file_size UInt64,
    upload_date DateTime,
    processing_date Nullable(DateTime),
    status String,
    pages_processed UInt32,
    text_length UInt32,
    processing_time Float32,
    emails Array(String),
    ssns Array(String),
    error_message Nullable(String),
    redaction_applied UInt8 DEFAULT 0,
    redacted_file_available UInt8 DEFAULT 0,
    total_redactions UInt32 DEFAULT 0,
    redacted_file_path Nullable(String)
) ENGINE = MergeTree()
ORDER BY (upload_id, upload_date);

-- Fast email lookups
CREATE MATERIALIZED VIEW email_index AS
SELECT upload_id, upload_date, email, filename
FROM pdf_uploads
ARRAY JOIN emails AS email;

-- Fast SSN lookups
CREATE MATERIALIZED VIEW ssn_index AS
SELECT upload_id, upload_date, ssn, filename
FROM pdf_uploads
ARRAY JOIN ssns AS ssn;
```

### Complete Data Models

#### Python Backend Models (Pydantic)

```python
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
    is_clean: bool
    emails: List[str] = []
    ssns: List[str] = []
    redaction_applied: bool = False
    redacted_file_available: bool = False
    total_redactions: int = 0
```

#### Frontend TypeScript Models

```typescript
interface PDFUpload {
    id: string;
    filename: string;
    uploadDate: string;
    status: 'processing' | 'complete' | 'completed' | 'failed';
    size: string;
    pages: number;
    emails?: string[];
    ssns?: string[];
    processingTime?: number;
    textLength?: number;
    // Redaction fields
    redactionApplied?: boolean;
    redactedFileAvailable?: boolean;
    totalRedactions?: number;
}

interface FindingsData {
    total_pdfs_processed: number;
    total_pii_items: number;
    success_rate: number;
    avg_processing_time: number;
    p95_processing_time: number;
    pii_types: {
        emails: number;
        ssns: number;
    };
    processing_trends: Array<{
        date: string;
        uploads: number;
        avg_time: number;
    }>;
    recent_uploads: Array<{
        upload_id: string;
        filename: string;
        upload_date: string;
        status: string;
        email_count: number;
        ssn_count: number;
        processing_time: number;
        redaction_applied?: boolean;
        redacted_file_available?: boolean;
        total_redactions?: number;
    }>;
}
```

#### Redaction Engine Models

```python
@dataclass
class PIIMatch:
    """Represents a detected PII item with its location and context"""
    text: str
    type: RedactionType
    page_number: int
    bbox: fitz.Rect  # Bounding box coordinates
    confidence: float
    context: str  # Surrounding text for verification

@dataclass
class RedactionRectangle:
    """Represents a redaction rectangle to be applied to the PDF"""
    page_number: int
    bbox: fitz.Rect
    pii_type: RedactionType
    original_text: str
    replacement_text: str = "[REDACTED]"
```

### Schema Fields Explained

**Core Fields:**
- `upload_id`: Unique identifier for each PDF upload
- `filename`: Original filename
- `file_path`: Path to original PDF file
- `file_size`: File size in bytes
- `upload_date`: When the file was uploaded
- `processing_date`: When processing completed
- `status`: Processing status (uploading, processing, complete, failed)
- `pages_processed`: Number of pages in the PDF
- `text_length`: Length of extracted text
- `processing_time`: Time taken to process the PDF

**PII Detection Fields:**
- `emails`: Array of detected email addresses (masked for privacy)
- `ssns`: Array of detected SSNs (masked for privacy)
- `error_message`: Any processing errors

**Redaction Fields:**
- `redaction_applied`: Boolean indicating if redaction was performed
- `redacted_file_available`: Boolean indicating if redacted file exists
- `total_redactions`: Number of PII items redacted
- `redacted_file_path`: Path to the redacted PDF file

## Testing Strategy

### Backend Testing
```bash
# Run PDF processing tests
cd python_server
python -m pytest tests/

# Test PII detection accuracy
python test_generator.py
python test_runner.py

# Test ClickHouse integration
python test-clickhouse.py

# Test redaction functionality
python tests/test_simple_redaction.py
```

### Frontend Testing
```bash
# Run React component tests
npm test

# Run integration tests
npm run test:integration
```

### Test Coverage
- **Unit Tests**: PDF parsing, PII detection algorithms, redaction engine
- **Integration Tests**: API endpoints, database operations, file downloads
- **End-to-End Tests**: Complete PDF upload, processing, redaction, and download workflow
- **Performance Tests**: Processing time and database query performance
- **Security Tests**: PII masking, redaction effectiveness

## Metrics Collection

### Processing Metrics
- **Total PDFs processed**: Count of all uploaded documents
- **Processing time**: Average and P95 processing durations
- **Success rate**: Percentage of successful processing attempts
- **File size distribution**: Statistics on uploaded file sizes
- **Redaction statistics**: Number of files redacted and items removed

### PII Detection Metrics
- **Detection accuracy**: True positive/negative rates
- **PII type frequency**: Most common types of detected data
- **False positives**: Incorrect PII detections
- **Processing errors**: Failed detection attempts
- **Redaction effectiveness**: Success rate of PII removal

### System Metrics
- **Database performance**: Query response times
- **API response times**: Endpoint latency statistics
- **Error rates**: Failed requests and exceptions
- **Resource utilization**: CPU, memory, and disk usage
- **Download statistics**: Original vs redacted file downloads

### P95 Performance Monitoring
- **P95 Processing Time**: 95th percentile of processing times
- **Performance trends**: Daily P95 tracking
- **Outlier detection**: Files that exceed P95 threshold
- **Capacity planning**: System performance under load

## Key Features

### PII Detection
- Email addresses, SSNs, credit cards, phone numbers
- Configurable detection patterns
- Processing time tracking
- False positive filtering

### PDF Redaction
- **Advanced PII Detection**: Coordinate-based detection with PyMuPDF
- **Secure Redaction**: Permanently removes PII with visual indicators
- **Multiple PII Types**: Email, SSN, phone, credit card detection
- **False Positive Filtering**: Intelligent filtering to reduce false positives
- **Redaction Summary**: Detailed statistics and audit trail
- **Dual File Storage**: Maintains both original and redacted versions
- **Download Management**: Secure access to both file versions

#### Redaction Process
1. **PII Detection**: Coordinate-based detection using PyMuPDF
2. **False Positive Filtering**: Context-aware filtering to reduce errors
3. **Redaction Planning**: Creates redaction rectangles for each PII item
4. **PDF Modification**: Applies redaction rectangles to create secure version
5. **Summary Generation**: Creates detailed redaction statistics
6. **File Storage**: Stores redacted file with original for comparison

### Analytics Dashboard
- Total PDFs processed
- PII detection statistics
- Processing time trends (including P95)
- Success rate monitoring
- Redaction statistics
- Real-time metrics updates

### Download Management
- Original PDF download
- Redacted PDF download (when available)
- Secure file access
- Download history tracking

## Performance

- **Processing**: ~1-5ms average per document (sub-second processing)
- **P95 Processing Time**: ~8-15ms for 95th percentile
- **Database**: ClickHouse handles millions of records with sub-millisecond queries
- **UI**: Real-time analytics updates with instant feedback
- **Throughput**: Can process hundreds of PDFs per minute
- **Redaction**: Additional 2-5ms per document for PII removal

## Development

### Testing
```bash
# Test ClickHouse connection
python test-clickhouse.py

# Frontend tests
npm test

# Test redaction functionality
python tests/test_simple_redaction.py
```

### Database Queries
```bash
# View scan results
docker exec -it clickhouse clickhouse-client -u app --password secret -d pdf_scan -q "SELECT * FROM pdf_uploads"

# Check P95 processing times
docker exec -it clickhouse clickhouse-client -u app --password secret -d pdf_scan -q "SELECT quantile(0.95)(processing_time) FROM pdf_uploads WHERE processing_time > 0"

# View redaction statistics
docker exec -it clickhouse clickhouse-client -u app --password secret -d pdf_scan -q "SELECT COUNT(*) as total_redacted, SUM(total_redactions) as total_items_redacted FROM pdf_uploads WHERE redaction_applied = 1"
```

## Glossary

### Technical Terms

**API (Application Programming Interface)**
- RESTful endpoints that allow the frontend to communicate with the backend
- Handles PDF uploads, status checks, data retrieval, and file downloads

**Async Processing**
- Background task execution that doesn't block the main application
- Allows users to upload PDFs and continue using the app while processing occurs

**ClickHouse**
- Column-oriented database management system
- Optimized for analytical queries and real-time data processing
- Stores PDF processing results, analytics data, and redaction metadata

**CORS (Cross-Origin Resource Sharing)**
- Security feature that controls which domains can access the API
- Configured to allow React frontend (port 3000) to communicate with Python backend (port 8080)

**FastAPI**
- Modern Python web framework for building APIs
- Provides automatic API documentation and high performance
- Handles PDF uploads, processing, redaction, and data storage

**Materialized Views**
- Pre-computed database views for faster query performance
- Used for PII statistics and analytics aggregations

**PII (Personally Identifiable Information)**
- Data that can identify a specific individual
- Examples: email addresses, Social Security Numbers (SSNs), phone numbers

**PDF Redaction**
- Process of permanently removing sensitive information from PDF documents
- Creates a new file with PII replaced by visual indicators
- Maintains document structure while ensuring privacy

**PyMuPDF (fitz)**
- Python library for PDF processing
- Handles text extraction, page counting, PDF parsing, and redaction
- Core component of the PDF analysis and redaction engine

**P95 Processing Time**
- 95th percentile of processing times
- Performance metric indicating that 95% of files process within this time
- Used for capacity planning and performance monitoring

**React**
- JavaScript library for building user interfaces
- Provides the frontend components for file upload, analytics display, and download management

**Regex (Regular Expressions)**
- Pattern matching syntax for text analysis
- Used to detect email addresses and SSNs in PDF content

**UUID (Universally Unique Identifier)**
- Unique identifier for each PDF upload
- Ensures no conflicts in file storage and database records

### Application Terms

**Analytics Dashboard**
- Real-time display of PDF processing statistics
- Shows total uploads, PII detection rates, processing times, and P95 metrics

**Background Processing**
- PDF analysis and redaction that occurs after file upload
- Users can continue using the app while processing runs

**File Storage**
- Organized system for storing uploaded PDF files
- Each file gets a unique directory based on upload ID
- Stores both original and redacted versions

**Processing Pipeline**
- Sequence of operations: upload → parse → detect PII → redact → store results
- Ensures consistent and reliable PDF analysis and redaction

**Status Polling**
- Frontend mechanism to check processing progress
- Updates UI in real-time as PDF analysis and redaction completes

**Upload History**
- Record of all processed PDF files
- Includes metadata, processing results, PII findings, and redaction status

**Download Management**
- System for downloading both original and redacted PDF versions
- Secure file access with proper authentication
- Download history and statistics tracking

### Data Types

**Email Detection**
- Identifies email addresses in PDF text
- Supports various formats: user@domain.com, user+tag@domain.org

**SSN Detection**
- Finds Social Security Numbers in multiple formats:
  - Standard: XXX-XX-XXXX
  - No dashes: XXXXXXXXX
  - Space separated: XXX XX XXXX

**False Positive Filtering**
- Excludes non-PII patterns that match PII formats
- Examples: phone numbers, dates, part numbers

**Processing Metadata**
- File size, page count, upload date, processing time
- Used for analytics and performance monitoring

**Redaction Metadata**
- Redaction status, number of items redacted
- File paths for both original and redacted versions
- Audit trail for compliance purposes

### System Components

**Frontend (React)**
- User interface for PDF upload, analytics, and download management
- Runs on port 3000 in development

**Backend (FastAPI)**
- API server for PDF processing, redaction, and data management
- Runs on port 8080 in development

**Database (ClickHouse)**
- Analytics database for storing processing results and redaction metadata
- Runs on port 8123 (HTTP) and 9000 (Native)

**File Storage**
- Local file system for uploaded PDFs
- Organized by upload ID for easy management
- Stores both original and redacted versions

**Redaction Engine**
- **Advanced PII Detection**: Coordinate-based detection with PyMuPDF
- **Multiple PII Types**: Email, SSN, phone, credit card patterns
- **False Positive Filtering**: Context-aware filtering algorithms
- **Precise Redaction**: Exact coordinate-based redaction rectangles
- **Audit Trail**: Complete redaction history and statistics
- **File Integrity**: Maintains document structure and formatting
- **Performance Optimized**: Efficient processing with minimal overhead

## License

Apache License 2.0
