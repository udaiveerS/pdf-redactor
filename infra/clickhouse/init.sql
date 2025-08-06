-- Initialize ClickHouse database for PDF Redactor App
-- This script creates the main table for storing PDF processing results with redaction support

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS email_index;
DROP TABLE IF EXISTS ssn_index;
DROP TABLE IF EXISTS pdf_uploads;

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
    -- Redaction fields
    redaction_applied UInt8 DEFAULT 0,
    redacted_file_available UInt8 DEFAULT 0,
    total_redactions UInt32 DEFAULT 0,
    redacted_file_path Nullable(String)
) ENGINE = MergeTree()
ORDER BY (upload_id, upload_date);

-- Create materialized view for fast email lookups
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

-- Create materialized view for fast SSN lookups
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

-- Create materialized view for redaction statistics
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

-- Create materialized view for PII detection statistics
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

-- Create materialized view for performance metrics
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

-- Insert sample test records to verify the setup
INSERT INTO pdf_uploads VALUES 
(
    'test-upload-001',
    'sample-document.pdf',
    '/uploads/test-upload-001/sample-document.pdf',
    245760,
    now(),
    now(),
    'complete',
    3,
    15420,
    0.002,
    ['j***@example.com', 'a***@company.org'],
    ['123-**-4567'],
    NULL,
    1,  -- redaction_applied
    1,  -- redacted_file_available
    3,  -- total_redactions
    '/uploads/test-upload-001/sample-document_redacted.pdf'
),
(
    'test-upload-002',
    'clean-report.pdf',
    '/uploads/test-upload-002/clean-report.pdf',
    102400,
    now() - INTERVAL 1 HOUR,
    now() - INTERVAL 1 HOUR,
    'complete',
    1,
    5200,
    0.001,
    [],  -- no emails
    [],  -- no SSNs
    NULL,
    0,  -- redaction_applied
    0,  -- redacted_file_available
    0,  -- total_redactions
    NULL  -- no redacted file
),
(
    'test-upload-003',
    'complex-document.pdf',
    '/uploads/test-upload-003/complex-document.pdf',
    512000,
    now() - INTERVAL 2 HOUR,
    now() - INTERVAL 2 HOUR,
    'complete',
    5,
    25600,
    0.005,
    ['u***@test.net', 'v***@demo.com', 'w***@sample.org'],
    ['987-**-6543', '456-**-7890'],
    NULL,
    1,  -- redaction_applied
    1,  -- redacted_file_available
    5,  -- total_redactions
    '/uploads/test-upload-003/complex-document_redacted.pdf'
);

-- Create indexes for better query performance
-- Note: ClickHouse automatically creates indexes based on ORDER BY clause

-- Grant permissions to the app user
-- This is handled by the docker-compose setup, but documented here for reference
-- CREATE USER IF NOT EXISTS app IDENTIFIED WITH plaintext_password BY 'secret';
-- GRANT ALL ON pdf_scan.* TO app;

-- Show table structure for verification
SELECT 'Database initialized successfully' as status;
SELECT 'pdf_uploads' as table_name, count() as record_count FROM pdf_uploads
UNION ALL
SELECT 'email_index' as table_name, count() as record_count FROM email_index
UNION ALL
SELECT 'ssn_index' as table_name, count() as record_count FROM ssn_index
UNION ALL
SELECT 'redaction_stats' as table_name, count() as record_count FROM redaction_stats
UNION ALL
SELECT 'pii_stats' as table_name, count() as record_count FROM pii_stats
UNION ALL
SELECT 'performance_metrics' as table_name, count() as record_count FROM performance_metrics; 