# PDF Scanner Python Server

A FastAPI-based Python server for PDF processing, PII detection, redaction, and analytics with ClickHouse integration.

## 🚀 Features

### Core Functionality
- **PDF Parsing**: Text extraction using PyMuPDF
- **PII Detection**: Advanced detection of emails, SSNs, and sensitive data
- **PDF Redaction**: Secure removal of PII with visual indicators
- **Analytics Engine**: Real-time metrics and P95 performance monitoring
- **File Management**: Download both original and redacted PDF versions

### Technical Features
- **ClickHouse Integration**: High-performance analytics database
- **RESTful API**: Comprehensive endpoints for all operations
- **CORS Support**: Configured for React frontend integration
- **Background Processing**: Async PDF processing and redaction
- **File Storage**: Organized storage with UUID-based directories

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Ensure ClickHouse is running:
```bash
# From project root
./setup-clickhouse.sh
```

## Running the Server

### Development Mode
```bash
python main.py
```

### Using Uvicorn directly
```bash
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

The server will start on `http://localhost:8080`

## API Endpoints with Sample Responses

### Health & Status

#### GET /api/health
**Sample Response:**
```json
{
  "status": "healthy",
  "message": "PDF Redactor server is running",
  "server": "FastAPI",
  "version": "1.0.0"
}
```

#### GET /api/python-server-status
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

### PDF Processing & Management

#### POST /api/upload-pdf
**Request:** Multipart form data with PDF file
**Sample Response:**
```json
{
  "upload_id": "195fe7a3-b850-4d4b-a54c-85e229837ba8",
  "status": "uploaded",
  "message": "PDF uploaded successfully and queued for processing"
}
```

#### GET /api/upload-history
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
    }
  ],
  "total_count": 1
}
```

#### GET /api/upload-status/{upload_id}
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

#### GET /api/download-pdf/{upload_id}
**Response:** Binary PDF file with appropriate headers

#### GET /api/download-redacted-pdf/{upload_id}
**Response:** Binary redacted PDF file with appropriate headers

### Analytics & Metrics

#### GET /api/findings
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
    }
  ]
}
```

#### GET /api/statistics
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

### Testing

#### POST /api/run-tests
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

## Database Schema

### ClickHouse Tables

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

-- Materialized views for fast lookups
CREATE MATERIALIZED VIEW email_index AS
SELECT upload_id, upload_date, email, filename
FROM pdf_uploads
ARRAY JOIN emails AS email;

CREATE MATERIALIZED VIEW ssn_index AS
SELECT upload_id, upload_date, ssn, filename
FROM pdf_uploads
ARRAY JOIN ssns AS ssn;
```

## Data Models

### PDFProcessingResult
```python
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
```

### RedactionResult
```python
class RedactionResult(BaseModel):
    redacted_file_path: str
    redaction_summary: dict
    total_redactions: int
    redaction_time: float
```

## Processing Pipeline

1. **File Upload**: PDF received and stored with UUID
2. **Text Extraction**: PyMuPDF extracts text content
3. **PII Detection**: Regex patterns detect emails and SSNs
4. **PDF Redaction**: PII removed and redacted file created
5. **Data Storage**: Results stored in ClickHouse
6. **Analytics**: P95 calculations and metrics computed

## Performance Metrics

### Processing Times
- **Average**: ~1-5ms per document
- **P95**: ~8-15ms for 95th percentile
- **Redaction**: Additional 2-5ms per document

### Analytics Data
- **Total PDFs processed**: Count of all documents
- **Success rate**: Percentage of successful processing
- **PII detection**: Emails and SSNs found
- **Redaction statistics**: Files redacted and items removed

## Testing

### Run Test Suite
```bash
# Run all tests
python run_tests.py

# Run specific test
python tests/test_simple_redaction.py

# Test ClickHouse connection
python test-clickhouse.py
```

### Test Coverage
- **Unit Tests**: PDF parsing, PII detection, redaction
- **Integration Tests**: API endpoints, database operations
- **Performance Tests**: Processing time and database queries
- **Security Tests**: PII masking and redaction effectiveness

## File Structure

```
python_server/
├── main.py                 # FastAPI application and endpoints
├── pdf_parser.py           # PDF text extraction
├── clickhouse_service.py   # Database operations
├── file_storage.py         # File management
├── models.py               # Data models and schemas
├── requirements.txt        # Python dependencies
├── tests/                  # Test files
│   ├── test_simple_redaction.py
│   └── ...
├── uploads/                # Uploaded PDF storage
└── redacted/               # Redacted PDF storage
```

## Integration with React App

The server is configured to work with the React app running on `http://localhost:3000`. The React app's proxy configuration in `src/setupProxy.js` forwards all `/api` requests to this Python server.

### CORS Configuration
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Error Handling

### Common Error Scenarios
- **File not found**: 404 errors for missing uploads
- **Processing failures**: 500 errors with detailed messages
- **Invalid files**: 400 errors for non-PDF uploads
- **Database errors**: Graceful fallbacks with logging

### Logging
- **Processing logs**: Upload and processing events
- **Error logs**: Detailed error information
- **Performance logs**: Processing time tracking
- **Security logs**: PII detection and redaction events

## Security Features

### PII Protection
- **Data masking**: Sensitive data masked in API responses
- **Secure redaction**: Permanently removes PII from PDFs
- **File isolation**: Each upload in separate directory
- **Audit trail**: Complete processing history

### API Security
- **Input validation**: All inputs validated and sanitized
- **Error handling**: No sensitive data in error messages
- **File type validation**: Only PDF files accepted
- **Size limits**: Configurable file size restrictions

## Monitoring & Analytics

### Real-time Metrics
- **Processing queue**: Number of files being processed
- **Success rates**: Processing success percentages
- **Performance trends**: P95 processing times
- **Error rates**: Failed processing attempts

### Database Queries
```bash
# Check P95 processing times
SELECT quantile(0.95)(processing_time) FROM pdf_uploads WHERE processing_time > 0;

# View redaction statistics
SELECT COUNT(*) as total_redacted, SUM(total_redactions) as total_items_redacted 
FROM pdf_uploads WHERE redaction_applied = 1;

# Get recent uploads
SELECT filename, status, processing_time, total_redactions 
FROM pdf_uploads ORDER BY upload_date DESC LIMIT 10;
```

## Future Enhancements

### Planned Features
- **Advanced PII detection**: Machine learning-based detection
- **Batch processing**: Multiple file uploads
- **Cloud storage**: S3/Google Cloud integration
- **Advanced analytics**: Custom reporting and dashboards
- **API rate limiting**: Request throttling and quotas
- **Webhook support**: Real-time notifications
- **Multi-format support**: DOC, DOCX, TXT processing 