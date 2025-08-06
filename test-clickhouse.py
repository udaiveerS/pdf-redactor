#!/usr/bin/env python3
"""
Test script for ClickHouse setup
"""
import sys
import os

# Add python_server to path
sys.path.append('python_server')

from clickhouse_client import get_clickhouse_client
import time


def test_clickhouse_setup():
    """Test ClickHouse setup and basic operations"""
    print("🧪 Testing ClickHouse Setup...")
    
    try:
        # Get client
        client = get_clickhouse_client()
        
        # Test connection
        print("1. Testing connection...")
        if client.test_connection():
            print("   ✅ Connection successful")
        else:
            print("   ❌ Connection failed")
            return False
        
        # Test inserting data
        print("2. Testing data insertion...")
        success = client.insert_scan_result(
            doc_id="test-doc-002",
            emails=["test@example.com", "user@company.org"],
            ssns=["987-65-4321"],
            source_path="/uploads/test-file.pdf",
            file_size=2048000,
            scan_duration=2.1,
            status="completed"
        )
        
        if success:
            print("   ✅ Data insertion successful")
        else:
            print("   ❌ Data insertion failed")
            return False
        
        # Test retrieving data
        print("3. Testing data retrieval...")
        results = client.get_scan_results(limit=5)
        if results:
            print(f"   ✅ Retrieved {len(results)} scan results")
            for result in results[:2]:  # Show first 2 results
                print(f"      - {result['doc_id']}: {len(result['emails'])} emails, {len(result['ssns'])} SSNs")
        else:
            print("   ❌ Data retrieval failed")
            return False
        
        # Test search functionality
        print("4. Testing search functionality...")
        email_results = client.search_by_email("test@example.com")
        if email_results:
            print(f"   ✅ Email search found {len(email_results)} documents")
        else:
            print("   ❌ Email search failed")
        
        ssn_results = client.search_by_ssn("987-65-4321")
        if ssn_results:
            print(f"   ✅ SSN search found {len(ssn_results)} documents")
        else:
            print("   ❌ SSN search failed")
        
        # Test statistics
        print("5. Testing statistics...")
        stats = client.get_stats()
        if stats:
            print(f"   ✅ Statistics retrieved:")
            print(f"      - Total documents: {stats.get('total_documents', 0)}")
            print(f"      - Total emails: {stats.get('total_emails', 0)}")
            print(f"      - Total SSNs: {stats.get('total_ssns', 0)}")
            print(f"      - Avg scan duration: {stats.get('avg_scan_duration', 0):.2f}s")
        else:
            print("   ❌ Statistics retrieval failed")
        
        print("\n🎉 All tests passed! ClickHouse is working correctly.")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False


if __name__ == "__main__":
    success = test_clickhouse_setup()
    sys.exit(0 if success else 1) 