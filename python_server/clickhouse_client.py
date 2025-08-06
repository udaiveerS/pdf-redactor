"""
ClickHouse client utility for PDF Scanner App
"""
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from clickhouse_connect import get_client


class ClickHouseClient:
    """ClickHouse client wrapper for PDF scanner operations"""
    
    def __init__(self):
        self.client = None
        self._connect()
    
    def _connect(self):
        """Initialize ClickHouse connection"""
        try:
            # Use HTTP protocol on port 8123 for clickhouse-connect
            self.client = get_client(
                host=os.getenv('CLICKHOUSE_HOST', 'localhost'),
                port=int(os.getenv('CLICKHOUSE_PORT', 8123)),
                username=os.getenv('CLICKHOUSE_USER', 'app'),
                password=os.getenv('CLICKHOUSE_PASSWORD', 'secret'),
                database=os.getenv('CLICKHOUSE_DATABASE', 'pdf_scan')
            )
            print("✅ Connected to ClickHouse successfully")
        except Exception as e:
            print(f"❌ Failed to connect to ClickHouse: {e}")
            raise
    
    def insert_scan_result(self, 
                          doc_id: str,
                          emails: List[str],
                          ssns: List[str],
                          source_path: str,
                          file_size: int = 0,
                          scan_duration: float = 0.0,
                          status: str = 'completed') -> bool:
        """
        Insert a scan result into ClickHouse
        
        Args:
            doc_id: Unique document identifier
            emails: List of email addresses found
            ssns: List of SSNs found
            source_path: Path to the source file
            file_size: Size of the file in bytes
            scan_duration: Time taken to scan in seconds
            status: Scan status (completed, failed, etc.)
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Use raw SQL command for insertion
            query = f"""
            INSERT INTO scan_results VALUES (
                '{doc_id}',
                now(),
                {emails},
                {ssns},
                '{source_path}',
                {file_size},
                {scan_duration},
                '{status}'
            )
            """
            
            self.client.command(query)
            print(f"✅ Inserted scan result for {doc_id}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to insert scan result: {e}")
            return False
    
    def get_scan_results(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get recent scan results
        
        Args:
            limit: Maximum number of results to return
            
        Returns:
            List of scan result dictionaries
        """
        try:
            query = f"SELECT * FROM scan_results ORDER BY scanned_at DESC LIMIT {limit}"
            result = self.client.query(query)
            
            # Convert result rows to dictionaries
            columns = result.column_names
            results = []
            for row in result.result_rows:
                results.append(dict(zip(columns, row)))
            
            return results
        except Exception as e:
            print(f"❌ Failed to get scan results: {e}")
            return []
    
    def search_by_email(self, email: str) -> List[Dict[str, Any]]:
        """
        Search for documents containing a specific email
        
        Args:
            email: Email address to search for
            
        Returns:
            List of matching documents
        """
        try:
            query = f"SELECT * FROM email_index WHERE email = '{email}' ORDER BY scanned_at DESC"
            result = self.client.query(query)
            
            # Convert result rows to dictionaries
            columns = result.column_names
            results = []
            for row in result.result_rows:
                results.append(dict(zip(columns, row)))
            
            return results
        except Exception as e:
            print(f"❌ Failed to search by email: {e}")
            return []
    
    def search_by_ssn(self, ssn: str) -> List[Dict[str, Any]]:
        """
        Search for documents containing a specific SSN
        
        Args:
            ssn: SSN to search for
            
        Returns:
            List of matching documents
        """
        try:
            query = f"SELECT * FROM ssn_index WHERE ssn = '{ssn}' ORDER BY scanned_at DESC"
            result = self.client.query(query)
            
            # Convert result rows to dictionaries
            columns = result.column_names
            results = []
            for row in result.result_rows:
                results.append(dict(zip(columns, row)))
            
            return results
        except Exception as e:
            print(f"❌ Failed to search by SSN: {e}")
            return []
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get scanning statistics
        
        Returns:
            Dictionary with various statistics
        """
        try:
            stats = {}
            
            # Total documents scanned
            result = self.client.query("SELECT count() as total FROM scan_results")
            stats['total_documents'] = result.result_rows[0][0]
            
            # Total emails found
            result = self.client.query("SELECT count() as total FROM email_index")
            stats['total_emails'] = result.result_rows[0][0]
            
            # Total SSNs found
            result = self.client.query("SELECT count() as total FROM ssn_index")
            stats['total_ssns'] = result.result_rows[0][0]
            
            # Average scan duration
            result = self.client.query("SELECT avg(scan_duration) as avg_duration FROM scan_results")
            stats['avg_scan_duration'] = result.result_rows[0][0] or 0
            
            return stats
            
        except Exception as e:
            print(f"❌ Failed to get stats: {e}")
            return {}
    
    def test_connection(self) -> bool:
        """
        Test ClickHouse connection
        
        Returns:
            bool: True if connection is working
        """
        try:
            result = self.client.query("SELECT 'OK' as status")
            return result.result_rows[0][0] == 'OK'
        except Exception as e:
            print(f"❌ Connection test failed: {e}")
            return False


# Global client instance
clickhouse_client = ClickHouseClient()


def get_clickhouse_client() -> ClickHouseClient:
    """Get the global ClickHouse client instance"""
    return clickhouse_client 