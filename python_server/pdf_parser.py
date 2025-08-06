import re
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import fitz  # PyMuPDF

logger = logging.getLogger(__name__)

class PDFParser:
    """PDF parser with PII detection capabilities using PyMuPDF"""
    
    def __init__(self):
        # Email regex pattern - supports various email formats
        self.email_pattern = re.compile(
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        )
        
        # SSN regex patterns - supports various formats
        self.ssn_patterns = [
            # Standard format: XXX-XX-XXXX
            re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
            # No dashes: XXXXXXXXX
            re.compile(r'\b\d{9}\b'),
            # Space separated: XXX XX XXXX
            re.compile(r'\b\d{3}\s\d{2}\s\d{4}\b'),
        ]
        
        # False positive patterns to exclude
        self.false_positive_patterns = [
            # Part numbers like 123-45-678 (not 9 digits)
            re.compile(r'\b\d{3}-\d{2}-\d{3}\b'),
            # Phone numbers
            re.compile(r'\b\d{3}-\d{3}-\d{4}\b'),
            # Dates
            re.compile(r'\b\d{1,2}-\d{1,2}-\d{4}\b'),
        ]
    
    def extract_text_from_pdf(self, pdf_path: Path) -> Tuple[bool, str, Optional[str]]:
        """
        Extract text from PDF file using PyMuPDF
        
        Returns:
            Tuple of (success, text, error_message)
        """
        try:
            # Open PDF with PyMuPDF
            doc = fitz.open(str(pdf_path))
            
            # Check if PDF is encrypted
            if doc.needs_pass:
                doc.close()
                raise Exception("PDF is encrypted and cannot be processed")
            
            # Extract text from all pages
            text = ""
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                page_text = page.get_text()
                if page_text:
                    text += page_text + "\n"
            
            doc.close()
            
            if text.strip():
                return True, text, None
            else:
                return False, "", "No text could be extracted from PDF"
                
        except Exception as e:
            error_msg = f"Error extracting text from PDF: {str(e)}"
            logger.error(error_msg)
            return False, "", error_msg
    
    def detect_emails(self, text: str) -> List[str]:
        """Detect email addresses in text"""
        emails = self.email_pattern.findall(text)
        # Remove duplicates while preserving order
        unique_emails = []
        seen = set()
        for email in emails:
            if email.lower() not in seen:
                unique_emails.append(email)
                seen.add(email.lower())
        return unique_emails
    
    def detect_ssns(self, text: str) -> List[str]:
        """Detect SSNs in text, avoiding false positives"""
        ssns = []
        
        # Find all potential SSN matches
        for pattern in self.ssn_patterns:
            matches = pattern.findall(text)
            ssns.extend(matches)
        
        # Remove duplicates
        unique_ssns = list(set(ssns))
        
        # Filter out false positives
        filtered_ssns = []
        for ssn in unique_ssns:
            if not self._is_false_positive(ssn, text):
                filtered_ssns.append(ssn)
        
        return filtered_ssns
    
    def _is_false_positive(self, ssn: str, context_text: str) -> bool:
        """Check if SSN is a false positive"""
        # Check against false positive patterns
        for pattern in self.false_positive_patterns:
            if pattern.search(ssn):
                return True
        
        # Additional context-based checks
        # Look for context around the SSN
        ssn_index = context_text.find(ssn)
        if ssn_index != -1:
            # Get surrounding context (50 characters on each side)
            start = max(0, ssn_index - 50)
            end = min(len(context_text), ssn_index + len(ssn) + 50)
            context = context_text[start:end].lower()
            
            # Check for false positive indicators
            false_positive_indicators = [
                'part number', 'part #', 'serial number', 'serial #',
                'model number', 'model #', 'reference number', 'ref #',
                'phone', 'tel', 'fax', 'date', 'birth', 'dob'
            ]
            
            for indicator in false_positive_indicators:
                if indicator in context:
                    return True
        
        return False
    
    def parse_pdf(self, pdf_path: Path) -> Dict:
        """
        Parse PDF and detect PII
        
        Returns:
            Dictionary with parsing results
        """
        logger.info(f"Parsing PDF: {pdf_path}")
        
        # Extract text and get page count
        success, text, error = self.extract_text_from_pdf(pdf_path)
        
        if not success:
            return {
                "status": "FAILED",
                "error": error,
                "emails": [],
                "ssns": [],
                "text_length": 0,
                "pages_processed": 0
            }
        
        # Get actual page count from PyMuPDF
        try:
            doc = fitz.open(str(pdf_path))
            pages_processed = len(doc)
            doc.close()
        except:
            # Fallback to text-based estimation
            pages_processed = text.count('\f') + 1
        
        # Detect PII
        emails = self.detect_emails(text)
        ssns = self.detect_ssns(text)
        
        result = {
            "status": "SUCCESS",
            "emails": emails,
            "ssns": ssns,
            "text_length": len(text),
            "pages_processed": pages_processed,
            "error": None
        }
        
        logger.info(f"Parsing complete: {len(emails)} emails, {len(ssns)} SSNs found")
        return result

# Global parser instance
pdf_parser = PDFParser() 