import re
import logging
import fitz  # PyMuPDF
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Set
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class RedactionType(str, Enum):
    EMAIL = "email"
    SSN = "ssn"
    PHONE = "phone"
    CREDIT_CARD = "credit_card"

@dataclass
class PIIMatch:
    """Represents a detected PII item with its location and context"""
    text: str
    type: RedactionType
    page_number: int
    bbox: fitz.Rect  # Bounding box coordinates
    confidence: float
    context: str  # Surrounding text for verification

@dataclass
class RedactionRectangle:
    """Represents a redaction rectangle to be applied to the PDF"""
    page_number: int
    bbox: fitz.Rect
    pii_type: RedactionType
    original_text: str
    replacement_text: str = "[REDACTED]"

class PDFRedactor:
    """Advanced PDF redactor with coordinate-based PII detection and redaction"""
    
    def __init__(self):
        # Enhanced regex patterns with better context
        self.patterns = {
            RedactionType.EMAIL: re.compile(
                r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            ),
            RedactionType.SSN: [
                re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),  # XXX-XX-XXXX
                re.compile(r'\b\d{9}\b'),              # XXXXXXXXX
                re.compile(r'\b\d{3}\s\d{2}\s\d{4}\b'), # XXX XX XXXX
            ],
            RedactionType.PHONE: [
                re.compile(r'\b\d{3}-\d{3}-\d{4}\b'),  # XXX-XXX-XXXX
                re.compile(r'\b\(\d{3}\)\s\d{3}-\d{4}\b'),  # (XXX) XXX-XXXX
                re.compile(r'\b\d{10}\b'),  # XXXXXXXXXX
            ],
            RedactionType.CREDIT_CARD: [
                re.compile(r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b'),  # XXXX-XXXX-XXXX-XXXX
                re.compile(r'\b\d{4}\s\d{4}\s\d{4}\s\d{4}\b'),  # XXXX XXXX XXXX XXXX
            ]
        }
        
        # False positive patterns
        self.false_positive_patterns = [
            re.compile(r'\b\d{3}-\d{2}-\d{3}\b'),  # Part numbers
            re.compile(r'\b\d{1,2}-\d{1,2}-\d{4}\b'),  # Dates
        ]
    
    def detect_pii_with_coordinates(self, pdf_path: Path) -> Tuple[List[PIIMatch], Dict]:
        """
        Detect PII in PDF with exact coordinates for redaction
        
        Returns:
            Tuple of (pii_matches, metadata)
        """
        logger.info(f"Detecting PII with coordinates in: {pdf_path}")
        
        try:
            doc = fitz.open(str(pdf_path))
            
            if doc.needs_pass:
                doc.close()
                raise Exception("PDF is encrypted and cannot be processed")
            
            pii_matches = []
            total_pages = len(doc)
            
            for page_num in range(total_pages):
                page = doc.load_page(page_num)
                
                # Get text blocks with coordinates
                text_blocks = page.get_text("dict")
                
                # Process each text block
                for block in text_blocks.get("blocks", []):
                    if "lines" in block:  # Text block
                        for line in block["lines"]:
                            for span in line["spans"]:
                                text = span["text"]
                                bbox = fitz.Rect(span["bbox"])
                                
                                # Detect PII in this text span
                                matches = self._detect_pii_in_span(
                                    text, bbox, page_num, span
                                )
                                pii_matches.extend(matches)
            
            doc.close()
            
            # Remove duplicates and overlapping matches
            pii_matches = self._deduplicate_matches(pii_matches)
            
            metadata = {
                "total_pages": total_pages,
                "total_matches": len(pii_matches),
                "matches_by_type": self._count_matches_by_type(pii_matches)
            }
            
            logger.info(f"Detection complete: {len(pii_matches)} PII items found")
            return pii_matches, metadata
            
        except Exception as e:
            logger.error(f"Error detecting PII: {str(e)}")
            raise
    
    def _detect_pii_in_span(self, text: str, bbox: fitz.Rect, page_num: int, span: Dict) -> List[PIIMatch]:
        """Detect PII in a specific text span with coordinates"""
        matches = []
        
        # Detect emails
        email_matches = self.patterns[RedactionType.EMAIL].finditer(text)
        for match in email_matches:
            match_bbox = self._get_match_bbox(match, bbox, span)
            if match_bbox:
                # Debug: print bbox coordinates
                logger.debug(f"Email bbox: {match_bbox}")
                matches.append(PIIMatch(
                    text=match.group(),
                    type=RedactionType.EMAIL,
                    page_number=page_num,
                    bbox=match_bbox,
                    confidence=1.0,
                    context=self._get_context(text, match.start(), match.end())
                ))
        
        # Detect SSNs
        for pattern in self.patterns[RedactionType.SSN]:
            ssn_matches = pattern.finditer(text)
            for match in ssn_matches:
                if not self._is_false_positive(match.group(), text):
                    match_bbox = self._get_match_bbox(match, bbox, span)
                    if match_bbox:
                        matches.append(PIIMatch(
                            text=match.group(),
                            type=RedactionType.SSN,
                            page_number=page_num,
                            bbox=match_bbox,
                            confidence=0.95,
                            context=self._get_context(text, match.start(), match.end())
                        ))
        
        # Detect phone numbers
        for pattern in self.patterns[RedactionType.PHONE]:
            phone_matches = pattern.finditer(text)
            for match in phone_matches:
                match_bbox = self._get_match_bbox(match, bbox, span)
                if match_bbox:
                    matches.append(PIIMatch(
                        text=match.group(),
                        type=RedactionType.PHONE,
                        page_number=page_num,
                        bbox=match_bbox,
                        confidence=0.9,
                        context=self._get_context(text, match.start(), match.end())
                    ))
        
        # Detect credit cards
        for pattern in self.patterns[RedactionType.CREDIT_CARD]:
            cc_matches = pattern.finditer(text)
            for match in cc_matches:
                match_bbox = self._get_match_bbox(match, bbox, span)
                if match_bbox:
                    matches.append(PIIMatch(
                        text=match.group(),
                        type=RedactionType.CREDIT_CARD,
                        page_number=page_num,
                        bbox=match_bbox,
                        confidence=0.85,
                        context=self._get_context(text, match.start(), match.end())
                    ))
        
        return matches
    
    def _get_match_bbox(self, match, span_bbox: fitz.Rect, span: Dict) -> Optional[fitz.Rect]:
        """Calculate the bounding box for a regex match within a text span"""
        try:
            # Get character positions
            start_char = match.start()
            end_char = match.end()
            
            # Calculate relative positions
            text = span["text"]
            if start_char >= len(text) or end_char > len(text):
                return None
            
            # Get font information
            font_size = span.get("size", 12)
            
            # Calculate character width (approximate)
            # Use the span width if available, otherwise estimate
            span_width = span_bbox.width
            char_width = span_width / max(len(text), 1)
            
            # Calculate x-offsets
            x0 = span_bbox.x0 + (start_char * char_width)
            x1 = span_bbox.x0 + (end_char * char_width)
            
            # Use span's y-coordinates
            y0 = span_bbox.y0
            y1 = span_bbox.y1
            
            # Ensure the rectangle is valid
            if x0 >= x1 or y0 >= y1:
                return None
                
            # Ensure coordinates are finite
            if not (x0 < float('inf') and x1 < float('inf') and y0 < float('inf') and y1 < float('inf')):
                return None
            
            return fitz.Rect(x0, y0, x1, y1)
            
        except Exception as e:
            logger.warning(f"Error calculating match bbox: {e}")
            return None
    
    def _get_context(self, text: str, start: int, end: int, context_chars: int = 20) -> str:
        """Get surrounding context for a match"""
        context_start = max(0, start - context_chars)
        context_end = min(len(text), end + context_chars)
        return text[context_start:context_end]
    
    def _is_false_positive(self, text: str, context: str) -> bool:
        """Check if detected text is a false positive"""
        for pattern in self.false_positive_patterns:
            if pattern.search(text):
                return True
        
        # Additional context checks
        context_lower = context.lower()
        false_positive_indicators = [
            'part number', 'part #', 'serial number', 'serial #',
            'model number', 'model #', 'reference number', 'ref #',
            'date', 'birth', 'dob'
        ]
        
        for indicator in false_positive_indicators:
            if indicator in context_lower:
                return True
        
        return False
    
    def _deduplicate_matches(self, matches: List[PIIMatch]) -> List[PIIMatch]:
        """Remove duplicate and overlapping PII matches"""
        if not matches:
            return []
        
        # Sort by confidence (higher first) and then by page number
        matches.sort(key=lambda x: (-x.confidence, x.page_number, x.bbox.x0))
        
        unique_matches = []
        seen_texts = set()
        
        for match in matches:
            # Check for exact text duplicates
            if match.text.lower() in seen_texts:
                continue
            
            # Check for overlapping bounding boxes
            is_overlapping = False
            for existing_match in unique_matches:
                if (match.page_number == existing_match.page_number and 
                    match.bbox.intersects(existing_match.bbox)):
                    is_overlapping = True
                    break
            
            if not is_overlapping:
                unique_matches.append(match)
                seen_texts.add(match.text.lower())
        
        return unique_matches
    
    def _count_matches_by_type(self, matches: List[PIIMatch]) -> Dict:
        """Count matches by PII type"""
        counts = {}
        for match in matches:
            counts[match.type] = counts.get(match.type, 0) + 1
        return counts
    
    def create_redaction_plan(self, pii_matches: List[PIIMatch]) -> List[RedactionRectangle]:
        """Create a plan for redaction rectangles"""
        redaction_rectangles = []
        
        for match in pii_matches:
            # Expand the bounding box slightly for better coverage
            expanded_bbox = match.bbox + (2, 2, 2, 2)
            
            # Create replacement text based on type
            replacement_text = self._get_replacement_text(match.type, match.text)
            
            redaction_rectangles.append(RedactionRectangle(
                page_number=match.page_number,
                bbox=expanded_bbox,
                pii_type=match.type,
                original_text=match.text,
                replacement_text=replacement_text
            ))
        
        return redaction_rectangles
    
    def _get_replacement_text(self, pii_type: RedactionType, original_text: str) -> str:
        """Generate appropriate replacement text for PII type"""
        if pii_type == RedactionType.EMAIL:
            return "[EMAIL REDACTED]"
        elif pii_type == RedactionType.SSN:
            return "[SSN REDACTED]"
        elif pii_type == RedactionType.PHONE:
            return "[PHONE REDACTED]"
        elif pii_type == RedactionType.CREDIT_CARD:
            return "[CREDIT CARD REDACTED]"
        else:
            return "[REDACTED]"
    
    def redact_pdf(self, pdf_path: Path, output_path: Path, pii_matches: List[PIIMatch]) -> bool:
        """
        Apply redaction to PDF based on detected PII matches
        
        Returns:
            True if redaction was successful
        """
        logger.info(f"Redacting PDF: {pdf_path} -> {output_path}")
        
        try:
            # Create redaction plan
            redaction_rectangles = self.create_redaction_plan(pii_matches)
            
            # Open PDF for redaction
            doc = fitz.open(str(pdf_path))
            
            # Apply redactions page by page
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                
                # Get redactions for this page
                page_redactions = [r for r in redaction_rectangles if r.page_number == page_num]
                
                for redaction in page_redactions:
                    # Apply redaction rectangle
                    page.add_redact_annot(
                        redaction.bbox,
                        text=redaction.replacement_text,
                        fill=(1, 1, 1),  # White fill
                        fontsize=10
                    )
                
                # Apply all redactions on this page
                if page_redactions:
                    page.apply_redactions()
            
            # Save redacted PDF
            doc.save(str(output_path))
            doc.close()
            
            logger.info(f"Redaction complete: {len(redaction_rectangles)} redactions applied")
            return True
            
        except Exception as e:
            logger.error(f"Error during redaction: {str(e)}")
            return False
    
    def get_redaction_summary(self, pii_matches: List[PIIMatch]) -> Dict:
        """Generate a summary of redaction results"""
        summary = {
            "total_redactions": len(pii_matches),
            "redactions_by_type": {},
            "redactions_by_page": {},
            "confidence_stats": {
                "high": 0,  # > 0.9
                "medium": 0,  # 0.7-0.9
                "low": 0  # < 0.7
            }
        }
        
        for match in pii_matches:
            # Count by type
            pii_type = match.type.value
            summary["redactions_by_type"][pii_type] = summary["redactions_by_type"].get(pii_type, 0) + 1
            
            # Count by page
            page_num = match.page_number
            summary["redactions_by_page"][page_num] = summary["redactions_by_page"].get(page_num, 0) + 1
            
            # Count by confidence
            if match.confidence > 0.9:
                summary["confidence_stats"]["high"] += 1
            elif match.confidence > 0.7:
                summary["confidence_stats"]["medium"] += 1
            else:
                summary["confidence_stats"]["low"] += 1
        
        return summary

# Global redactor instance
pdf_redactor = PDFRedactor() 