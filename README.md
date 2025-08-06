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
- `GET /analytics/stats` - Get overall processing statistics
- `GET /analytics/pii-types` - Get PII type distribution
- `GET /analytics/processing-times` - Get processing time trends
- `GET /analytics/success-rate` - Get success/failure rates

### Health & Monitoring
- `GET /health` - Server health status
- `GET /health/database` - Database connection status
- `GET /metrics` - Prometheus-style metrics endpoint

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

- **Processing**: ~2.3s average per document
- **Database**: ClickHouse handles millions of records
- **UI**: Real-time analytics updates

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

## License

Apache License 2.0
