-- Initialize ClickHouse database for PDF Scanner App
-- This script creates the main table for storing scan results

CREATE TABLE IF NOT EXISTS scan_results (
    doc_id       String,
    scanned_at   DateTime,
    emails       Array(String),
    ssns         Array(String),
    source_path  String,
    file_size    UInt64,
    scan_duration Float32,
    status       String DEFAULT 'completed'
) ENGINE = MergeTree()
ORDER BY (doc_id, scanned_at);

-- Create a materialized view for quick email lookups
CREATE MATERIALIZED VIEW IF NOT EXISTS email_index
ENGINE = MergeTree()
ORDER BY (email, scanned_at)
AS SELECT
    doc_id,
    scanned_at,
    email,
    source_path
FROM scan_results
ARRAY JOIN emails AS email;

-- Create a materialized view for quick SSN lookups
CREATE MATERIALIZED VIEW IF NOT EXISTS ssn_index
ENGINE = MergeTree()
ORDER BY (ssn, scanned_at)
AS SELECT
    doc_id,
    scanned_at,
    ssn,
    source_path
FROM scan_results
ARRAY JOIN ssns AS ssn;

-- Insert a test record to verify the setup
INSERT INTO scan_results VALUES (
    'test-doc-001',
    now(),
    ['test@example.com', 'admin@company.com'],
    ['123-45-6789'],
    '/uploads/test-document.pdf',
    1024000,
    1.5,
    'completed'
); 