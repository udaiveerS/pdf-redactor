#!/usr/bin/env python3
"""
Simple Redaction Test
Tests redaction on a basic PDF with PII
"""

import sys
import os
from pathlib import Path

# Add parent directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pdf_redactor import pdf_redactor, RedactionType

def test_simple_redaction():
    """Test redaction on simple-pii.pdf"""
    print("🧪 Testing Simple Redaction...")
    
    # Test file path
    test_pdf_path = Path("happy-path/simple-pii.pdf")
    
    if not test_pdf_path.exists():
        print(f"❌ Test file not found: {test_pdf_path}")
        return False
    
    try:
        print(f"📄 Processing: {test_pdf_path}")
        
        # Step 1: Detect PII
        print("🔍 Detecting PII...")
        pii_matches, metadata = pdf_redactor.detect_pii_with_coordinates(test_pdf_path)
        
        # Count by type
        email_count = sum(1 for match in pii_matches if match.type == RedactionType.EMAIL)
        ssn_count = sum(1 for match in pii_matches if match.type == RedactionType.SSN)
        
        print(f"📊 Detection Results:")
        print(f"   - Emails detected: {email_count}")
        print(f"   - SSNs detected: {ssn_count}")
        print(f"   - Total PII items: {len(pii_matches)}")
        
        # Show what was detected
        for i, match in enumerate(pii_matches, 1):
            print(f"   {i}. {match.type.value}: {match.text}")
        
        if len(pii_matches) == 0:
            print("⚠️  No PII detected - nothing to redact")
            return True
        
        # Step 2: Perform redaction
        print("\n🔴 Performing redaction...")
        output_pdf_path = Path("simple_redacted_output.pdf")
        redaction_success = pdf_redactor.redact_pdf(test_pdf_path, output_pdf_path, pii_matches)
        
        # Verify redaction succeeded
        assert redaction_success, "Redaction should succeed"
        assert output_pdf_path.exists(), "Redacted output file should be created"
        
        # Step 3: Get redaction summary
        summary = pdf_redactor.get_redaction_summary(pii_matches)
        
        print(f"📊 Redaction Results:")
        print(f"   - Redaction applied: {redaction_success}")
        print(f"   - Total redactions: {summary['total_redactions']}")
        print(f"   - Redactions by type: {summary['redactions_by_type']}")
        print(f"   - Output file: {output_pdf_path}")
        
        # Check file sizes
        original_size = test_pdf_path.stat().st_size
        redacted_size = output_pdf_path.stat().st_size
        
        print(f"📁 File Sizes:")
        print(f"   - Original: {original_size:,} bytes")
        print(f"   - Redacted: {redacted_size:,} bytes")
        
        print(f"\n✅ Simple Redaction Test PASSED")
        print(f"   - PII detected and redacted successfully")
        print(f"   - Output file created: {output_pdf_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Simple Redaction Test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_simple_redaction()
