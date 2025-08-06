# ClickHouse Database Schema Documentation

## Overview

The PDF Redactor application uses ClickHouse as its analytics database to store PDF processing results, PII detection data, redaction information, and performance metrics. The schema is optimized for analytical queries and real-time data processing.

## Database Tables

### 1. Main Table: `pdf_uploads`

The primary table storing all PDF processing results and metadata.

```sql
CREATE TABLE pdf_uploads (
    upload_id String,                    -- Unique identifier for each upload
    filename String,                     -- Original filename
    file_path String,                    -- Path to original PDF file
    file_size UInt64,                    -- File size in bytes
    upload_date DateTime,                -- When the file was uploaded
    processing_date Nullable(DateTime),  -- When processing completed
    status String,                       -- Processing status (uploading, processing, complete, failed)
    pages_processed UInt32,              -- Number of pages in the PDF
    text_length UInt32,                  -- Length of extracted text
    processing_time Float32,             -- Processing time in seconds
    emails Array(String),                -- Array of detected emails (masked)
    ssns Array(String),                  -- Array of detected SSNs (masked)
    error_message Nullable(String),      -- Any processing errors
    -- Redaction fields
    redaction_applied UInt8 DEFAULT 0,   -- Boolean: whether redaction was performed
    redacted_file_available UInt8 DEFAULT 0, -- Boolean: whether redacted file exists
    total_redactions UInt32 DEFAULT 0,   -- Number of PII items redacted
    redacted_file_path Nullable(String)  -- Path to redacted PDF file
) ENGINE = MergeTree()
ORDER BY (upload_id, upload_date);
```

#### Field Descriptions

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `upload_id` | String | Unique UUID for each upload | `"195fe7a3-b850-4d4b-a54c-85e229837ba8"` |
| `filename` | String | Original PDF filename | `"document.pdf"` |
| `file_path` | String | Full path to original file | `"/uploads/uuid/document.pdf"` |
| `file_size` | UInt64 | File size in bytes | `245760` |
| `upload_date` | DateTime | Upload timestamp | `2024-01-15 10:30:00` |
| `processing_date` | DateTime | Processing completion time | `2024-01-15 10:30:02` |
| `status` | String | Processing status | `"complete"`, `"failed"`, `"processing"` |
| `pages_processed` | UInt32 | Number of PDF pages | `3` |
| `text_length` | UInt32 | Characters in extracted text | `15420` |
| `processing_time` | Float32 | Processing time in seconds | `0.002` |
| `emails` | Array(String) | Detected emails (masked) | `["j***@example.com"]` |
| `ssns` | Array(String) | Detected SSNs (masked) | `["123-**-4567"]` |
| `error_message` | String | Processing error details | `"PDF is encrypted"` |
| `redaction_applied` | UInt8 | Redaction performed flag | `1` (true) or `0` (false) |
| `redacted_file_available` | UInt8 | Redacted file exists flag | `1` (true) or `0` (false) |
| `total_redactions` | UInt32 | Number of items redacted | `4` |
| `redacted_file_path` | String | Path to redacted file | `"/uploads/uuid/document_redacted.pdf"` |

### 2. Materialized Views

#### `email_index`
Fast lookup view for email addresses across all uploads.

```sql
CREATE MATERIALIZED VIEW email_index
ENGINE = MergeTree()
ORDER BY (email, upload_date)
AS SELECT
    upload_id,
    upload_date,
    email,
    filename
FROM pdf_uploads
ARRAY JOIN emails AS email;
```

#### `ssn_index`
Fast lookup view for SSNs across all uploads.

```sql
CREATE MATERIALIZED VIEW ssn_index
ENGINE = MergeTree()
ORDER BY (ssn, upload_date)
AS SELECT
    upload_id,
    upload_date,
    ssn,
    filename
FROM pdf_uploads
ARRAY JOIN ssns AS ssn;
```

#### `redaction_stats`
Daily redaction statistics and performance metrics.

```sql
CREATE MATERIALIZED VIEW redaction_stats
ENGINE = MergeTree()
ORDER BY (upload_date)
AS SELECT
    toDate(upload_date) as date,
    COUNT(*) as total_uploads,
    SUM(redaction_applied) as files_redacted,
    SUM(total_redactions) as total_items_redacted,
    AVG(processing_time) as avg_processing_time,
    quantile(0.95)(processing_time) as p95_processing_time
FROM pdf_uploads
WHERE processing_time > 0
GROUP BY toDate(upload_date);
```

#### `pii_stats`
Daily PII detection statistics.

```sql
CREATE MATERIALIZED VIEW pii_stats
ENGINE = MergeTree()
ORDER BY (upload_date)
AS SELECT
    toDate(upload_date) as date,
    COUNT(*) as total_uploads,
    SUM(length(emails)) as total_emails,
    SUM(length(ssns)) as total_ssns,
    SUM(length(emails) + length(ssns)) as total_pii_items,
    COUNT(CASE WHEN length(emails) = 0 AND length(ssns) = 0 THEN 1 END) as clean_files,
    COUNT(CASE WHEN length(emails) > 0 OR length(ssns) > 0 THEN 1 END) as pii_files
FROM pdf_uploads
GROUP BY toDate(upload_date);
```

#### `performance_metrics`
Daily performance metrics including P95 and P99 processing times.

```sql
CREATE MATERIALIZED VIEW performance_metrics
ENGINE = MergeTree()
ORDER BY (upload_date)
AS SELECT
    toDate(upload_date) as date,
    COUNT(*) as uploads_count,
    AVG(processing_time) as avg_processing_time,
    quantile(0.95)(processing_time) as p95_processing_time,
    quantile(0.99)(processing_time) as p99_processing_time,
    MIN(processing_time) as min_processing_time,
    MAX(processing_time) as max_processing_time,
    COUNT(CASE WHEN status = 'complete' THEN 1 END) as successful_uploads,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_uploads
FROM pdf_uploads
WHERE processing_time > 0
GROUP BY toDate(upload_date);
```

## Common Queries

### Analytics Queries

#### Get P95 Processing Time
```sql
SELECT quantile(0.95)(processing_time) as p95_processing_time
FROM pdf_uploads
WHERE processing_time > 0;
```

#### Get Redaction Statistics
```sql
SELECT 
    COUNT(*) as total_uploads,
    SUM(redaction_applied) as files_redacted,
    SUM(total_redactions) as total_items_redacted,
    AVG(processing_time) as avg_processing_time
FROM pdf_uploads
WHERE processing_time > 0;
```

#### Get Recent Uploads with Redaction Info
```sql
SELECT 
    upload_id,
    filename,
    upload_date,
    status,
    length(emails) as email_count,
    length(ssns) as ssn_count,
    processing_time,
    redaction_applied,
    redacted_file_available,
    total_redactions
FROM pdf_uploads
ORDER BY upload_date DESC
LIMIT 10;
```

#### Get Daily Processing Trends
```sql
SELECT 
    toDate(upload_date) as date,
    COUNT(*) as uploads,
    AVG(processing_time) as avg_time,
    quantile(0.95)(processing_time) as p95_time
FROM pdf_uploads
WHERE upload_date >= now() - INTERVAL 7 DAY
GROUP BY toDate(upload_date)
ORDER BY date DESC;
```

### PII Detection Queries

#### Find All Files with Specific Email
```sql
SELECT upload_id, filename, upload_date
FROM email_index
WHERE email = 'j***@example.com'
ORDER BY upload_date DESC;
```

#### Find All Files with SSNs
```sql
SELECT upload_id, filename, upload_date, ssn
FROM ssn_index
ORDER BY upload_date DESC;
```

#### Get PII Distribution
```sql
SELECT 
    COUNT(*) as total_files,
    SUM(length(emails)) as total_emails,
    SUM(length(ssns)) as total_ssns,
    COUNT(CASE WHEN length(emails) > 0 THEN 1 END) as files_with_emails,
    COUNT(CASE WHEN length(ssns) > 0 THEN 1 END) as files_with_ssns
FROM pdf_uploads;
```

### Performance Monitoring Queries

#### Get Performance Metrics for Last 30 Days
```sql
SELECT 
    toDate(upload_date) as date,
    COUNT(*) as uploads,
    AVG(processing_time) as avg_time,
    quantile(0.95)(processing_time) as p95_time,
    quantile(0.99)(processing_time) as p99_time,
    COUNT(CASE WHEN status = 'complete' THEN 1 END) as successful,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM pdf_uploads
WHERE upload_date >= now() - INTERVAL 30 DAY
GROUP BY toDate(upload_date)
ORDER BY date DESC;
```

#### Find Slow Processing Files
```sql
SELECT 
    upload_id,
    filename,
    processing_time,
    pages_processed,
    text_length
FROM pdf_uploads
WHERE processing_time > 0.01  -- Files taking more than 10ms
ORDER BY processing_time DESC
LIMIT 20;
```

## Data Types and Constraints

### String Fields
- `upload_id`: UUID format (36 characters)
- `filename`: Original PDF filename
- `file_path`: Full file system path
- `status`: Enum values: 'uploading', 'processing', 'complete', 'failed'
- `emails`, `ssns`: Arrays of masked PII data

### Numeric Fields
- `file_size`: File size in bytes (UInt64)
- `pages_processed`: Number of PDF pages (UInt32)
- `text_length`: Characters in extracted text (UInt32)
- `processing_time`: Processing time in seconds (Float32)
- `redaction_applied`, `redacted_file_available`: Boolean flags (UInt8)
- `total_redactions`: Count of redacted items (UInt32)

### DateTime Fields
- `upload_date`: When file was uploaded
- `processing_date`: When processing completed (nullable)

## Security and Privacy

### PII Masking
- Email addresses are masked: `j***@example.com`
- SSNs are masked: `123-**-4567`
- Raw PII data is never stored in the database

### Data Retention
- All data is retained for analytics purposes
- Original files are stored separately in the file system
- Redacted files are stored with clear naming conventions

### Access Control
- Database access is restricted to the application user
- All queries go through the application layer
- No direct database access for end users

## Performance Optimizations

### Indexing Strategy
- Primary key: `(upload_id, upload_date)`
- Materialized views for fast lookups
- Partitioning by date for efficient queries

### Query Optimization
- Use materialized views for common queries
- Leverage ClickHouse's columnar storage
- Use appropriate data types for optimal performance

### Storage Optimization
- Compressed storage with MergeTree engine
- Efficient array storage for PII data
- Optimized for analytical workloads

## Migration and Maintenance

### Schema Updates
- Add new fields with DEFAULT values
- Use ALTER TABLE for non-breaking changes
- Test migrations on staging environment

### Data Maintenance
- Regular cleanup of old test data
- Monitor table sizes and performance
- Archive old data if needed

### Backup Strategy
- Regular backups of ClickHouse data
- Backup file storage separately
- Test restore procedures regularly 