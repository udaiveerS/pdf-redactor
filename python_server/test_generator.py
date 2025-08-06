import os
from pathlib import Path
import fitz  # PyMuPDF
import yaml
import random
import string

base_dir = Path("tests")
base_dir.mkdir(exist_ok=True)

def make_pdf(path, pages, encrypt_password=None, draw_image=False):
    """Create a PDF with specified content using PyMuPDF"""
    # Create a new PDF document
    doc = fitz.open()
    
    # Page size (A4 equivalent)
    page_width, page_height = 595, 842  # A4 size in points
    
    for idx, text in enumerate(pages, start=1):
        # Create a new page
        page = doc.new_page(width=page_width, height=page_height)
        
        # Insert text
        page.insert_text((72, 72), f"Page {idx}", fontsize=12)
        page.insert_text((72, 90), text, fontsize=12)
        
        if draw_image:
            # Draw a grey rectangle to mimic a scanned image
            rect = fitz.Rect(72, 144, 432, 576)  # 5x6 inch rectangle
            page.draw_rect(rect, color=(0.8, 0.8, 0.8), fill=(0.8, 0.8, 0.8))
    
    # Save the PDF
    if encrypt_password:
        # PyMuPDF encryption
        doc.save(str(path), encryption=fitz.PDF_ENCRYPT_AES_256, user_pw=encrypt_password)
    else:
        doc.save(str(path))
    
    doc.close()

def rand_text(length=80):
    """Generate random text for testing"""
    return ''.join(random.choices(string.ascii_letters + " ", k=length))

expectations = {}

# 1. Clean PDF - no PII
clean_dir = base_dir / "clean"
clean_dir.mkdir(exist_ok=True)
clean_pdf = clean_dir / "clean-single-page.pdf"
make_pdf(clean_pdf, [rand_text()])
expectations[clean_pdf.name] = {"emails": [], "ssns": [], "status": "SUCCESS"}

# 2. Happy-path - simple PII
happy_dir = base_dir / "happy-path"
happy_dir.mkdir(exist_ok=True)
happy_pdf = happy_dir / "simple-pii.pdf"
make_pdf(happy_pdf, ["Contact us at help@example.com and SSN 123-45-6789"])
expectations[happy_pdf.name] = {"emails": ["help@example.com"], "ssns": ["123-45-6789"], "status": "SUCCESS"}

# 3. Multipage PII
multi_dir = base_dir / "multipage"
multi_dir.mkdir(exist_ok=True)
multi_pdf = multi_dir / "multipage-pii.pdf"
pages = [rand_text() for _ in range(7)]
pages[2] = "Reach bob@company.org for details."
pages[6] = "Employee SSN is 987-65-4321."
make_pdf(multi_pdf, pages)
expectations[multi_pdf.name] = {"emails": ["bob@company.org"], "ssns": ["987-65-4321"], "status": "SUCCESS"}

# 4. SSN without dashes
ssn_dir = base_dir / "ssn-nodash"
ssn_dir.mkdir(exist_ok=True)
ssn_pdf = ssn_dir / "ssn-nodash.pdf"
make_pdf(ssn_pdf, ["Alternate SSN format 111223333"])
expectations[ssn_pdf.name] = {"emails": [], "ssns": ["111223333"], "status": "SUCCESS"}

# 5. Email edge cases
edge_dir = base_dir / "email-edgecases"
edge_dir.mkdir(exist_ok=True)
edge_pdf = edge_dir / "email-edgecases.pdf"
make_pdf(edge_pdf, ["Contact first.last+alias@sub.domain.co.uk ASAP"])
expectations[edge_pdf.name] = {"emails": ["first.last+alias@sub.domain.co.uk"], "ssns": [], "status": "SUCCESS"}

# 6. Oversize (100 pages)
oversize_dir = base_dir / "oversize"
oversize_dir.mkdir(exist_ok=True)
oversize_pdf = oversize_dir / "oversize-pii.pdf"
oversize_pages = ["Oversize doc with foo@bar.com on page 1"] + [rand_text() for _ in range(99)]
make_pdf(oversize_pdf, oversize_pages)
expectations[oversize_pdf.name] = {"emails": ["foo@bar.com"], "ssns": [], "status": "SUCCESS"}

# 7. Corrupt PDF (invalid content)
corrupt_dir = base_dir / "corrupt"
corrupt_dir.mkdir(exist_ok=True)
corrupt_pdf = corrupt_dir / "corrupt.pdf"
# Create a completely invalid PDF file
with open(corrupt_pdf, "wb") as f:
    f.write(b"This is not a valid PDF file content")
expectations[corrupt_pdf.name] = {"emails": [], "ssns": [], "status": "FAILED"}

# 8. Encrypted PDF
encrypted_dir = base_dir / "encrypted"
encrypted_dir.mkdir(exist_ok=True)
encrypted_pdf = encrypted_dir / "encrypted.pdf"
make_pdf(encrypted_pdf, ["Secret info admin@secure.com"], encrypt_password="secret123")
expectations[encrypted_pdf.name] = {"emails": [], "ssns": [], "status": "FAILED"}

# 9. Scanned image placeholder
scan_dir = base_dir / "scanned-image"
scan_dir.mkdir(exist_ok=True)
scan_pdf = scan_dir / "scanned-image.pdf"
make_pdf(scan_pdf, ["Scanned page placeholder"], draw_image=True)
expectations[scan_pdf.name] = {"emails": [], "ssns": [], "status": "SUCCESS"}

# 10. False-positive bait
fp_dir = base_dir / "false-positive"
fp_dir.mkdir(exist_ok=True)
fp_pdf = fp_dir / "false-positive-bait.pdf"
make_pdf(fp_pdf, ["Part number 123-45-678, not SSN"])
expectations[fp_pdf.name] = {"emails": [], "ssns": [], "status": "SUCCESS"}

# 11. Multiple PII types
multi_pii_dir = base_dir / "multi-pii"
multi_pii_dir.mkdir(exist_ok=True)
multi_pii_pdf = multi_pii_dir / "multi-pii.pdf"
make_pdf(multi_pii_pdf, [
    "Contact: john.doe@company.com",
    "SSN: 555-12-3456",
    "Email: jane.smith@example.org",
    "SSN: 987-65-4321"
])
expectations[multi_pii_pdf.name] = {
    "emails": ["john.doe@company.com", "jane.smith@example.org"], 
    "ssns": ["555-12-3456", "987-65-4321"], 
    "status": "SUCCESS"
}

# 12. Complex email formats
complex_email_dir = base_dir / "complex-email"
complex_email_dir.mkdir(exist_ok=True)
complex_email_pdf = complex_email_dir / "complex-email.pdf"
make_pdf(complex_email_pdf, [
    "Emails: test@domain.com, user+tag@subdomain.org, admin@company.co.uk"
])
expectations[complex_email_pdf.name] = {
    "emails": ["test@domain.com", "user+tag@subdomain.org", "admin@company.co.uk"], 
    "ssns": [], 
    "status": "SUCCESS"
}

# Write expectations.yaml
exp_path = base_dir / "expectations.yaml"
with open(exp_path, "w") as f:
    yaml.dump(expectations, f, sort_keys=False)

print(f"Test corpus generated at {base_dir}")
print(f"Expectations written to {exp_path}")
print(f"Generated {len(expectations)} test cases:")
for test_name, expected in expectations.items():
    print(f"  - {test_name}: {expected['status']} ({len(expected['emails'])} emails, {len(expected['ssns'])} SSNs)")

def main():
    """Main function to generate test corpus"""
    # The test generation code is already executed when the module is imported
    pass

if __name__ == "__main__":
    main() 