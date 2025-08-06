# ClickHouse Setup for PDF Scanner App

This directory contains the ClickHouse database setup for the PDF Scanner application.

## Quick Start

### 1. Start ClickHouse
```bash
# From the project root
./setup-clickhouse.sh
```

### 2. Test the Setup
```bash
# Test ClickHouse functionality
python test-clickhouse.py
```

## Manual Setup

### Option 1: Using Docker Compose (Recommended)
```bash
cd infra/clickhouse
docker-compose up -d
```

### Option 2: Using Docker Run
```bash
docker run -d --name clickhouse \
  -p 8123:8123 \
  -p 9000:9000 \
  --ulimit nofile=262144:262144 \
  -v "$PWD/infra/clickhouse/data:/var/lib/clickhouse" \
  -v "$PWD/infra/clickhouse/logs:/var/log/clickhouse-server" \
  -e CLICKHOUSE_DB=pdf_scan \
  -e CLICKHOUSE_USER=app \
  -e CLICKHOUSE_PASSWORD=secret \
  -e CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT=1 \
  clickhouse/clickhouse-server:latest
```

## Database Schema

### Main Table: `scan_results`
- `doc_id`: Unique document identifier
- `scanned_at`: Timestamp when scan was performed
- `emails`: Array of email addresses found
- `ssns`: Array of SSNs found
- `source_path`: Path to the source file
- `file_size`: Size of the file in bytes
- `scan_duration`: Time taken to scan in seconds
- `status`: Scan status (completed, failed, etc.)

### Materialized Views
- `email_index`: For quick email lookups
- `ssn_index`: For quick SSN lookups

## Connection Details

- **HTTP API**: http://localhost:8123
- **Native TCP**: localhost:9000
- **Database**: pdf_scan
- **Username**: app
- **Password**: secret

## Testing Commands

### Test Connection
```bash
# Native client
docker exec -it clickhouse \
  clickhouse-client -u app --password secret --database pdf_scan \
  -q "SELECT '🎉 ClickHouse is alive!'"

# HTTP interface
curl -s -u app:secret \
  'http://localhost:8123/?query=SELECT%20version()'
```

### View Data
```bash
# View all scan results
docker exec -it clickhouse \
  clickhouse-client -u app --password secret -d pdf_scan \
  -q "SELECT * FROM scan_results ORDER BY scanned_at DESC LIMIT 10"

# View email index
docker exec -it clickhouse \
  clickhouse-client -u app --password secret -d pdf_scan \
  -q "SELECT * FROM email_index LIMIT 10"

# View SSN index
docker exec -it clickhouse \
  clickhouse-client -u app --password secret -d pdf_scan \
  -q "SELECT * FROM ssn_index LIMIT 10"
```

## Python Integration

The Python server includes a ClickHouse client utility (`python_server/clickhouse_client.py`) that provides:

- Connection management
- Data insertion
- Search functionality
- Statistics retrieval

### Usage Example
```python
from clickhouse_client import get_clickhouse_client

client = get_clickhouse_client()

# Insert scan result
client.insert_scan_result(
    doc_id="doc-123",
    emails=["user@example.com"],
    ssns=["123-45-6789"],
    source_path="/uploads/document.pdf"
)

# Search by email
results = client.search_by_email("user@example.com")

# Get statistics
stats = client.get_stats()
```

## Environment Variables

The following environment variables can be set to configure the ClickHouse connection:

- `CLICKHOUSE_HOST`: ClickHouse host (default: localhost)
- `CLICKHOUSE_PORT`: ClickHouse port (default: 9000)
- `CLICKHOUSE_USER`: Username (default: app)
- `CLICKHOUSE_PASSWORD`: Password (default: secret)
- `CLICKHOUSE_DATABASE`: Database name (default: pdf_scan)

## Troubleshooting

### Connection Issues
1. Ensure ClickHouse container is running: `docker ps | grep clickhouse`
2. Check logs: `docker logs clickhouse`
3. Verify ports are accessible: `netstat -an | grep 8123`

### Data Persistence
Data is stored in `./data` and logs in `./logs` directories. These are mounted as volumes to persist data across container restarts.

### Performance
- ClickHouse is optimized for analytical queries
- Materialized views provide fast lookups for emails and SSNs
- Consider adding indexes for specific query patterns if needed

## Security Notes

⚠️ **Important**: The default password is "secret" - change this in production!

To change the password:
1. Stop the container: `docker stop clickhouse`
2. Update the password in docker-compose.yml or environment variables
3. Restart the container: `docker start clickhouse`
4. Update your application configuration 