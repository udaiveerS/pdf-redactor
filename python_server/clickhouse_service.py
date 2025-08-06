import clickhouse_connect
import logging
from datetime import datetime
from typing import List, Optional
from models import PDFProcessingResult, UploadHistoryItem, ProcessingStatus
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
            # Create PDF uploads table
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
                    error_message Nullable(String)
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
                'error_message': result.error_message
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
                insert_data['error_message']
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
                    processing_time
                FROM pdf_uploads
                ORDER BY upload_date DESC
                LIMIT {limit}
            """
            
            result = self.client.query(query)
            
            history = []
            for row in result.result_rows:
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
                    is_clean=(row[6] == 0 and row[7] == 0)
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
                    processing_time, emails, ssns, error_message
                FROM pdf_uploads
                WHERE upload_id = '{upload_id}'
            """
            
            result = self.client.query(query)
            
            if result.result_rows:
                row = result.result_rows[0]
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
                    error_message=row[12]
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
            
            return {
                "total_uploads": row[0],
                "clean_pdfs": row[1],
                "pii_pdfs": row[2],
                "total_emails": row[3],
                "total_ssns": row[4],
                "avg_processing_time": float(row[5]) if row[5] else 0.0
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

# Global ClickHouse service instance
clickhouse_service = ClickHouseService() 