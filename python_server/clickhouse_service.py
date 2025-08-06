import clickhouse_connect
import logging
from datetime import datetime
from typing import List, Optional
from models import PDFProcessingResult, UploadHistoryItem, ProcessingStatus, RedactionResult
import uuid

logger = logging.getLogger(__name__)

class ClickHouseService:
    def __init__(self):
        self.client = None
        self.connect()
        self.init_tables()
    
    def connect(self):
        """Connect to ClickHouse database"""
        try:
            self.client = clickhouse_connect.get_client(
                host='localhost',
                port=8123,
                username='app',
                password='secret',
                database='pdf_scan'
            )
            logger.info("Connected to ClickHouse database")
        except Exception as e:
            logger.error(f"Failed to connect to ClickHouse: {e}")
            # For now, we'll continue without ClickHouse
            self.client = None
    
    def init_tables(self):
        """Initialize ClickHouse tables if they don't exist"""
        if not self.client:
            return
            
        try:
            # Drop existing table if it exists (to update schema)
            try:
                self.client.command("DROP TABLE IF EXISTS pdf_uploads")
                self.client.command("DROP TABLE IF EXISTS email_index")
                self.client.command("DROP TABLE IF EXISTS ssn_index")
            except Exception as e:
                logger.warning(f"Could not drop existing tables: {e}")
            
            # Create PDF uploads table with redaction fields
            self.client.command("""
                CREATE TABLE IF NOT EXISTS pdf_uploads (
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
                ORDER BY (upload_id, upload_date)
            """)
            
            # Create materialized view for email index
            self.client.command("""
                CREATE MATERIALIZED VIEW IF NOT EXISTS email_index
                ENGINE = MergeTree()
                ORDER BY (email, upload_date)
                AS SELECT
                    upload_id,
                    upload_date,
                    email,
                    filename
                FROM pdf_uploads
                ARRAY JOIN emails AS email
            """)
            
            # Create materialized view for SSN index
            self.client.command("""
                CREATE MATERIALIZED VIEW IF NOT EXISTS ssn_index
                ENGINE = MergeTree()
                ORDER BY (ssn, upload_date)
                AS SELECT
                    upload_id,
                    upload_date,
                    ssn,
                    filename
                FROM pdf_uploads
                ARRAY JOIN ssns AS ssn
            """)
            
            logger.info("ClickHouse tables initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize ClickHouse tables: {e}")
    
    def store_upload_result(self, result: PDFProcessingResult) -> bool:
        """Store PDF processing result in ClickHouse"""
        if not self.client:
            logger.warning("ClickHouse not available, skipping storage")
            return False
            
        try:
            # Prepare redaction data
            redaction_applied = 0
            redacted_file_available = 0
            total_redactions = 0
            redacted_file_path = None
            
            if result.redaction_result:
                redaction_applied = 1
                redacted_file_available = 1 if result.redaction_result.redacted_file_path else 0
                total_redactions = result.redaction_result.redaction_summary.get('total_redactions', 0)
                redacted_file_path = result.redaction_result.redacted_file_path
            
            insert_data = {
                'upload_id': result.upload_id,
                'filename': result.filename,
                'file_path': result.file_path,
                'file_size': result.file_size,
                'upload_date': result.upload_date,
                'processing_date': result.processing_date,
                'status': result.status.value,
                'pages_processed': result.pages_processed,
                'text_length': result.text_length,
                'processing_time': result.processing_time,
                'emails': result.emails,
                'ssns': result.ssns,
                'error_message': result.error_message,
                'redaction_applied': redaction_applied,
                'redacted_file_available': redacted_file_available,
                'total_redactions': total_redactions,
                'redacted_file_path': redacted_file_path
            }
            
            logger.info(f"Attempting to insert data: {insert_data}")
            
            # Convert to list of values in the correct order
            values = [
                insert_data['upload_id'],
                insert_data['filename'],
                insert_data['file_path'],
                insert_data['file_size'],
                insert_data['upload_date'],
                insert_data['processing_date'],
                insert_data['status'],
                insert_data['pages_processed'],
                insert_data['text_length'],
                insert_data['processing_time'],
                insert_data['emails'],
                insert_data['ssns'],
                insert_data['error_message'],
                insert_data['redaction_applied'],
                insert_data['redacted_file_available'],
                insert_data['total_redactions'],
                insert_data['redacted_file_path']
            ]
            
            self.client.insert("pdf_uploads", [values])
            
            logger.info(f"Stored upload result for {result.filename}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store upload result: {e}")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error details: {str(e)}")
            return False
    
    def get_upload_history(self, limit: int = 50) -> List[UploadHistoryItem]:
        """Get upload history from ClickHouse"""
        if not self.client:
            logger.warning("ClickHouse not available, returning empty history")
            return []
            
        try:
            query = f"""
                SELECT 
                    upload_id,
                    filename,
                    upload_date,
                    status,
                    file_size,
                    pages_processed,
                    length(emails) as email_count,
                    length(ssns) as ssn_count,
                    processing_time,
                    emails,
                    ssns,
                    redaction_applied,
                    redacted_file_available,
                    total_redactions
                FROM pdf_uploads
                ORDER BY upload_date DESC
                LIMIT {limit}
            """
            
            result = self.client.query(query)
            
            history = []
            for row in result.result_rows:
                # Import masking functions
                from main import mask_pii_list
                
                history.append(UploadHistoryItem(
                    upload_id=row[0],
                    filename=row[1],
                    upload_date=row[2],
                    status=ProcessingStatus(row[3]),
                    file_size=row[4],
                    pages_processed=row[5],
                    email_count=row[6],
                    ssn_count=row[7],
                    processing_time=row[8],
                    is_clean=(row[6] == 0 and row[7] == 0),
                    emails=mask_pii_list(row[9] or []),
                    ssns=mask_pii_list(row[10] or []),
                    redaction_applied=bool(row[11]),
                    redacted_file_available=bool(row[12]),
                    total_redactions=row[13]
                ))
            
            return history
            
        except Exception as e:
            logger.error(f"Failed to get upload history: {e}")
            return []
    
    def get_upload_by_id(self, upload_id: str) -> Optional[PDFProcessingResult]:
        """Get specific upload by ID"""
        if not self.client:
            return None
            
        try:
            query = f"""
                SELECT 
                    upload_id, filename, file_path, file_size, upload_date,
                    processing_date, status, pages_processed, text_length,
                    processing_time, emails, ssns, error_message,
                    redaction_applied, redacted_file_available, total_redactions,
                    redacted_file_path
                FROM pdf_uploads
                WHERE upload_id = '{upload_id}'
            """
            
            result = self.client.query(query)
            
            if result.result_rows:
                row = result.result_rows[0]
                # Create redaction result if redaction was applied
                redaction_result = None
                if row[13]:  # redaction_applied
                    redaction_result = RedactionResult(
                        upload_id=row[0],
                        original_file_path=row[2],
                        redacted_file_path=row[16],  # redacted_file_path
                        redaction_summary={
                            'total_redactions': row[15] or 0,  # total_redactions
                            'redactions_by_type': {}  # We'll need to get this from the full data
                        },
                        pii_locations=[],  # We'll need to get this from the full data
                        redaction_applied=True,
                        redaction_time=None
                    )
                
                return PDFProcessingResult(
                    upload_id=row[0],
                    filename=row[1],
                    file_path=row[2],
                    file_size=row[3],
                    upload_date=row[4],
                    processing_date=row[5],
                    status=ProcessingStatus(row[6]),
                    pages_processed=row[7],
                    text_length=row[8],
                    processing_time=row[9],
                    emails=row[10],
                    ssns=row[11],
                    error_message=row[12],
                    redaction_result=redaction_result,
                    pii_locations=[]
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get upload by ID: {e}")
            return None
    
    def get_statistics(self) -> dict:
        """Get processing statistics"""
        if not self.client:
            return {
                "total_uploads": 0,
                "clean_pdfs": 0,
                "pii_pdfs": 0,
                "total_emails": 0,
                "total_ssns": 0,
                "avg_processing_time": 0.0
            }
            
        try:
            query = """
                SELECT 
                    count() as total_uploads,
                    countIf(length(emails) = 0 AND length(ssns) = 0) as clean_pdfs,
                    countIf(length(emails) > 0 OR length(ssns) > 0) as pii_pdfs,
                    sum(length(emails)) as total_emails,
                    sum(length(ssns)) as total_ssns,
                    avg(processing_time) as avg_processing_time
                FROM pdf_uploads
                WHERE status = 'complete'
            """
            
            result = self.client.query(query)
            row = result.result_rows[0]
            
            # Handle NaN values from ClickHouse aggregations
            avg_processing_time_raw = row[5]
            avg_processing_time = 0.0 if avg_processing_time_raw is None or str(avg_processing_time_raw) == 'nan' else float(avg_processing_time_raw)
            
            return {
                "total_uploads": row[0],
                "clean_pdfs": row[1],
                "pii_pdfs": row[2],
                "total_emails": row[3],
                "total_ssns": row[4],
                "avg_processing_time": avg_processing_time
            }
            
        except Exception as e:
            logger.error(f"Failed to get statistics: {e}")
            return {
                "total_uploads": 0,
                "clean_pdfs": 0,
                "pii_pdfs": 0,
                "total_emails": 0,
                "total_ssns": 0,
                "avg_processing_time": 0.0
            }

    def get_findings(self) -> dict:
        """Get findings and analytics data for metrics page"""
        if not self.client:
            return {
                "total_pdfs_processed": 0,
                "total_pii_items": 0,
                "success_rate": 0.0,
                "avg_processing_time": 0.0,
                "p95_processing_time": 0.0,
                "pii_types": {"emails": 0, "ssns": 0},
                "processing_trends": [],
                "recent_uploads": []
            }
            
        try:
            # Get basic metrics
            metrics_query = """
                SELECT 
                    COUNT(*) as total_pdfs,
                    SUM(length(emails) + length(ssns)) as total_pii_items,
                    COUNT(CASE WHEN status = 'complete' THEN 1 END) as successful_uploads,
                    AVG(processing_time) as avg_processing_time,
                    SUM(length(emails)) as total_emails,
                    SUM(length(ssns)) as total_ssns
                FROM pdf_uploads
            """
            
            # Get P95 processing time
            p95_query = """
                SELECT 
                    quantile(0.95)(processing_time) as p95_processing_time
                FROM pdf_uploads
                WHERE processing_time > 0
            """
            
            result = self.client.query(metrics_query)
            row = result.result_rows[0]
            
            total_pdfs = row[0] or 0
            total_pii_items = row[1] or 0
            successful_uploads = row[2] or 0
            # Handle NaN values from ClickHouse aggregations
            avg_processing_time_raw = row[3]
            avg_processing_time = 0.0 if avg_processing_time_raw is None or str(avg_processing_time_raw) == 'nan' else float(avg_processing_time_raw)
            
            total_emails = row[4] or 0
            total_ssns = row[5] or 0
            
            # Get P95 processing time
            p95_result = self.client.query(p95_query)
            p95_raw = p95_result.result_rows[0][0]
            p95_processing_time = 0.0 if p95_raw is None or str(p95_raw) == 'nan' else float(p95_raw)
            
            # Calculate success rate
            success_rate = (successful_uploads / total_pdfs * 100) if total_pdfs > 0 else 0
            
            # Get recent uploads (last 10)
            recent_query = """
                SELECT 
                    upload_id,
                    filename,
                    upload_date,
                    status,
                    length(emails) as email_count,
                    length(ssns) as ssn_count,
                    processing_time
                FROM pdf_uploads
                ORDER BY upload_date DESC
                LIMIT 10
            """
            
            recent_result = self.client.query(recent_query)
            recent_uploads = []
            for row in recent_result.result_rows:
                processing_time_raw = row[6]
                processing_time = 0.0 if processing_time_raw is None or str(processing_time_raw) == 'nan' else float(processing_time_raw)
                
                recent_uploads.append({
                    "upload_id": row[0],
                    "filename": row[1],
                    "upload_date": row[2].isoformat() if row[2] else None,
                    "status": row[3],
                    "email_count": row[4] or 0,
                    "ssn_count": row[5] or 0,
                    "processing_time": processing_time
                })
            
            # Get processing trends (last 7 days)
            trends_query = """
                SELECT 
                    toDate(upload_date) as date,
                    COUNT(*) as uploads,
                    AVG(processing_time) as avg_time
                FROM pdf_uploads
                WHERE upload_date >= now() - INTERVAL 7 DAY
                GROUP BY toDate(upload_date)
                ORDER BY date DESC
            """
            
            trends_result = self.client.query(trends_query)
            processing_trends = []
            for row in trends_result.result_rows:
                avg_time_raw = row[2]
                avg_time = 0.0 if avg_time_raw is None or str(avg_time_raw) == 'nan' else float(avg_time_raw)
                
                processing_trends.append({
                    "date": row[0].isoformat() if row[0] else None,
                    "uploads": row[1] or 0,
                    "avg_time": avg_time
                })
            
            return {
                "total_pdfs_processed": total_pdfs,
                "total_pii_items": total_pii_items,
                "success_rate": round(success_rate, 1),
                "avg_processing_time": round(avg_processing_time, 3),
                "p95_processing_time": round(p95_processing_time, 3),
                "pii_types": {
                    "emails": total_emails,
                    "ssns": total_ssns
                },
                "processing_trends": processing_trends,
                "recent_uploads": recent_uploads
            }
            
        except Exception as e:
            logger.error(f"Failed to get findings: {e}")
            return {
                "total_pdfs_processed": 0,
                "total_pii_items": 0,
                "success_rate": 0.0,
                "avg_processing_time": 0.0,
                "p95_processing_time": 0.0,
                "pii_types": {"emails": 0, "ssns": 0},
                "processing_trends": [],
                "recent_uploads": []
            }

# Global ClickHouse service instance
clickhouse_service = ClickHouseService() 