# PDF Redactor - PII Detection & Analytics

A PDF processing application that detects Personally Identifiable Information (PII) and provides analytics using ClickHouse for high-performance data processing.

## Design Choices

### Why ClickHouse?
- **Analytics-focused**: ClickHouse is designed for analytical queries, perfect for processing large volumes of PDF scan data
- **Columnar storage**: Efficient for aggregating PII detection statistics and time-series data
- **Materialized views**: Fast lookups for specific PII types (emails, SSNs) without complex joins
- **Real-time ingestion**: Handles high-throughput PDF processing events efficiently

### Architecture Decisions
- **Python FastAPI backend**: High-performance async API for PDF processing
- **React frontend**: Modern UI with Material-UI for analytics visualization
- **Docker deployment**: Consistent environment across development and production
- **Integrated workflow**: PDF processing, analytics storage, and UI work together as a cohesive system

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
├── python_server/          # FastAPI backend (Port 8080)
├── infra/clickhouse/       # Database setup
├── docker-compose.yml      # Production deployment
└── setup-clickhouse.sh     # Database initialization
```

## API Endpoints

### PDF Processing
- `POST /upload` - Upload and process PDF file
- `GET /files` - List all processed files
- `GET /files/{file_id}` - Get specific file details and PII data
- `DELETE /files/{file_id}` - Delete processed file

### Analytics & Metrics
- `GET /api/findings` - Get comprehensive analytics and findings data
- `GET /api/statistics` - Get overall processing statistics
- `GET /api/upload-history` - Get list of processed files with PII data

### Health & Monitoring
- `GET /api/health` - Server health status
- `GET /api/python-server-status` - Server capabilities and endpoints

### Findings Endpoint Details

The `/api/findings` endpoint provides comprehensive analytics data for the metrics dashboard:

**Response Structure:**
```json
{
  "total_pdfs_processed": 150,
  "total_pii_items": 342,
  "success_rate": 98.5,
  "avg_processing_time": 0.003,
  "pii_types": {
    "emails": 245,
    "ssns": 97
  },
  "processing_trends": [
    {
      "date": "2024-01-15",
      "uploads": 12,
      "avg_time": 0.003
    }
  ],
  "recent_uploads": [
    {
      "filename": "document.pdf",
      "upload_date": "2024-01-15T10:30:00",
      "status": "complete",
      "email_count": 3,
      "ssn_count": 1,
      "processing_time": 0.002
    }
  ]
}
```

**Data Points:**
- **Total PDFs**: Count of all processed documents
- **PII Items**: Total number of detected emails and SSNs
- **Success Rate**: Percentage of successful processing attempts
- **Processing Time**: Average time to process PDFs (in seconds, typically 0.001-0.005s)
- **PII Distribution**: Breakdown by type (emails vs SSNs)
- **Trends**: Daily processing statistics for the last 7 days
- **Recent Uploads**: Latest 10 processed files with metadata

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
```

### Frontend Testing
```bash
# Run React component tests
npm test

# Run integration tests
npm run test:integration
```

### Test Coverage
- **Unit Tests**: PDF parsing, PII detection algorithms
- **Integration Tests**: API endpoints, database operations
- **End-to-End Tests**: Complete PDF upload and processing workflow
- **Performance Tests**: Processing time and database query performance

## Metrics Collection

### Processing Metrics
- **Total PDFs processed**: Count of all uploaded documents
- **Processing time**: Average and P99 processing durations
- **Success rate**: Percentage of successful processing attempts
- **File size distribution**: Statistics on uploaded file sizes

### PII Detection Metrics
- **Detection accuracy**: True positive/negative rates
- **PII type frequency**: Most common types of detected data
- **False positives**: Incorrect PII detections
- **Processing errors**: Failed detection attempts

### System Metrics
- **Database performance**: Query response times
- **API response times**: Endpoint latency statistics
- **Error rates**: Failed requests and exceptions
- **Resource utilization**: CPU, memory, and disk usage

## Key Features

### PII Detection
- Email addresses, SSNs, credit cards, phone numbers
- Configurable detection patterns
- Processing time tracking

### Analytics Dashboard
- Total PDFs processed
- PII detection statistics
- Processing time trends
- Success rate monitoring

### Database Schema
```sql
-- Main results table
CREATE TABLE scan_results (
    doc_id String,
    scanned_at DateTime,
    emails Array(String),
    ssns Array(String),
    source_path String,
    file_size UInt64,
    scan_duration Float32,
    status String
) ENGINE = MergeTree()
ORDER BY (doc_id, scanned_at);

-- Fast email lookups
CREATE MATERIALIZED VIEW email_index AS
SELECT doc_id, scanned_at, email, source_path
FROM scan_results
ARRAY JOIN emails AS email;
```

## Performance

- **Processing**: ~1-5ms average per document (sub-second processing)
- **Database**: ClickHouse handles millions of records with sub-millisecond queries
- **UI**: Real-time analytics updates with instant feedback
- **Throughput**: Can process hundreds of PDFs per minute

## Development

### Testing
```bash
# Test ClickHouse connection
python test-clickhouse.py

# Frontend tests
npm test
```

### Database Queries
```bash
# View scan results
docker exec -it clickhouse clickhouse-client -u app --password secret -d pdf_scan -q "SELECT * FROM scan_results"
```

## Glossary

### Technical Terms

**API (Application Programming Interface)**
- RESTful endpoints that allow the frontend to communicate with the backend
- Handles PDF uploads, status checks, and data retrieval

**Async Processing**
- Background task execution that doesn't block the main application
- Allows users to upload PDFs and continue using the app while processing occurs

**ClickHouse**
- Column-oriented database management system
- Optimized for analytical queries and real-time data processing
- Stores PDF processing results and analytics data

**CORS (Cross-Origin Resource Sharing)**
- Security feature that controls which domains can access the API
- Configured to allow React frontend (port 3000) to communicate with Python backend (port 8080)

**FastAPI**
- Modern Python web framework for building APIs
- Provides automatic API documentation and high performance
- Handles PDF uploads, processing, and data storage

**Materialized Views**
- Pre-computed database views for faster query performance
- Used for PII statistics and analytics aggregations

**PII (Personally Identifiable Information)**
- Data that can identify a specific individual
- Examples: email addresses, Social Security Numbers (SSNs), phone numbers

**PyMuPDF (fitz)**
- Python library for PDF processing
- Handles text extraction, page counting, and PDF parsing
- Core component of the PDF analysis engine

**React**
- JavaScript library for building user interfaces
- Provides the frontend components for file upload and analytics display

**Regex (Regular Expressions)**
- Pattern matching syntax for text analysis
- Used to detect email addresses and SSNs in PDF content

**UUID (Universally Unique Identifier)**
- Unique identifier for each PDF upload
- Ensures no conflicts in file storage and database records

### Application Terms

**Analytics Dashboard**
- Real-time display of PDF processing statistics
- Shows total uploads, PII detection rates, and processing times

**Background Processing**
- PDF analysis that occurs after file upload
- Users can continue using the app while processing runs

**File Storage**
- Organized system for storing uploaded PDF files
- Each file gets a unique directory based on upload ID

**Processing Pipeline**
- Sequence of operations: upload → parse → detect PII → store results
- Ensures consistent and reliable PDF analysis

**Status Polling**
- Frontend mechanism to check processing progress
- Updates UI in real-time as PDF analysis completes

**Upload History**
- Record of all processed PDF files
- Includes metadata, processing results, and PII findings

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

### System Components

**Frontend (React)**
- User interface for PDF upload and analytics
- Runs on port 3000 in development

**Backend (FastAPI)**
- API server for PDF processing and data management
- Runs on port 8080 in development

**Database (ClickHouse)**
- Analytics database for storing processing results
- Runs on port 8123 (HTTP) and 9000 (Native)

**File Storage**
- Local file system for uploaded PDFs
- Organized by upload ID for easy management

## License

Apache License 2.0
