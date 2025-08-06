# PDF Parser Testing Suite

This directory contains a comprehensive testing suite for the PDF parsing functionality with PII detection capabilities.

## 📁 File Structure

```
python_server/
├── test_generator.py    # Generates test PDFs with various scenarios
├── test_runner.py       # Executes tests and compares results
├── pdf_parser.py        # Core PDF parsing and PII detection logic
├── run_tests.py         # Convenience script to run the full test suite
├── requirements.txt     # Python dependencies
└── tests/              # Generated test files (created by test_generator.py)
    ├── expectations.yaml
    ├── clean/
    ├── happy-path/
    ├── multipage/
    ├── ssn-nodash/
    ├── email-edgecases/
    ├── oversize/
    ├── corrupt/
    ├── encrypted/
    ├── scanned-image/
    ├── false-positive/
    ├── multi-pii/
    └── complex-email/
```

## 🧪 Test Scenarios

The test suite covers 12 different scenarios:

1. **Clean PDF** - No PII content
2. **Happy Path** - Simple PII detection
3. **Multipage PII** - PII spread across multiple pages
4. **SSN without dashes** - Different SSN formats
5. **Email Edge Cases** - Complex email formats
6. **Oversize** - Large PDF (100 pages)
7. **Corrupt PDF** - Truncated/corrupted file
8. **Encrypted PDF** - Password-protected file
9. **Scanned Image** - PDF with image content
10. **False Positive Bait** - Content that looks like PII but isn't
11. **Multiple PII Types** - Multiple emails and SSNs
12. **Complex Email Formats** - Various email patterns

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd python_server
pip install -r requirements.txt
```

### 2. Run Full Test Suite

```bash
python run_tests.py
```

This will:
- Generate all test PDFs
- Run the parsing tests
- Compare results with expectations
- Display a summary report

### 3. Individual Steps

#### Generate Test PDFs Only
```bash
python test_generator.py
```

#### Run Tests Only (requires test PDFs to exist)
```bash
python test_runner.py
```

## 🔧 API Endpoints

The FastAPI server includes these testing endpoints:

### POST `/api/parse-pdf`
Upload and parse a PDF file for PII detection.

**Request:** Multipart form with PDF file
**Response:**
```json
{
  "status": "SUCCESS",
  "emails": ["test@example.com"],
  "ssns": ["123-45-6789"],
  "text_length": 1500,
  "pages_processed": 3,
  "processing_time": 0.245,
  "error": null
}
```

### POST `/api/run-tests`
Execute the full test suite via API.

**Response:**
```json
{
  "total_tests": 12,
  "passed": 11,
  "failed": 1,
  "success_rate": 91.67,
  "details": { ... }
}
```

## 📊 PII Detection Rules

### PDF Processing
- **PyMuPDF (fitz)**: Single library for PDF generation, parsing, text extraction, and redaction
- **Complete PDF workflow**: From creation to analysis using one library
- **Robust text extraction**: Handles various PDF formats and structures
- **Encryption detection**: Automatically detects and handles encrypted PDFs
- **Accurate page counting**: Uses PyMuPDF's native page count
- **Test generation**: Creates test PDFs with PyMuPDF for consistent testing

### Email Detection
- Supports standard email formats: `user@domain.com`
- Handles complex formats: `user+tag@subdomain.org`
- International domains: `admin@company.co.uk`
- Removes duplicates (case-insensitive)

### SSN Detection
- Standard format: `XXX-XX-XXXX`
- No dashes: `XXXXXXXXX`
- Space separated: `XXX XX XXXX`
- False positive filtering for:
  - Part numbers (123-45-678)
  - Phone numbers (123-456-7890)
  - Dates (12-31-2023)

## 🐛 Troubleshooting

### Common Issues

1. **Missing Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **PDF Generation Fails**
   - Ensure `PyMuPDF` is installed
   - Check write permissions in the directory

3. **PyMuPDF Installation Issues**
   - PyMuPDF requires system dependencies on some platforms
   - For macOS: `brew install mupdf`
   - For Ubuntu: `sudo apt-get install libmupdf-dev`

3. **Test Execution Fails**
   - Verify test PDFs exist in `tests/` directory
   - Check that `expectations.yaml` is present

4. **Import Errors**
   - Ensure you're running from the `python_server` directory
   - Check Python path includes current directory

### Debug Mode

Enable detailed logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📈 Performance Metrics

The test suite tracks:
- Processing time per PDF
- Text extraction success rate
- PII detection accuracy
- False positive rate

## 🔄 Continuous Integration

To integrate with CI/CD:

```bash
# Install dependencies
pip install -r requirements.txt

# Run tests and capture exit code
python run_tests.py
exit_code=$?

# Optional: Upload results
# curl -X POST http://your-ci-server/results -d @test_results.yaml

exit $exit_code
```

## 📝 Adding New Tests

1. **Add test case to `test_generator.py`:**
   ```python
   # New test scenario
   new_test_dir = base_dir / "new-scenario"
   new_test_dir.mkdir(exist_ok=True)
   new_test_pdf = new_test_dir / "new-test.pdf"
   make_pdf(new_test_pdf, ["Test content with test@example.com"])
   expectations[new_test_pdf.name] = {
       "emails": ["test@example.com"], 
       "ssns": [], 
       "status": "SUCCESS"
   }
   ```

2. **Run test generation:**
   ```bash
   python test_generator.py
   ```

3. **Verify test passes:**
   ```bash
   python test_runner.py
   ```

## 🎯 Expected Results

A successful test run should show:
- All 12 test cases executed
- High success rate (>90%)
- Fast processing times (<1s per PDF)
- Accurate PII detection
- Proper false positive filtering 