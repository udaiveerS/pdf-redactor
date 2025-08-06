import yaml
import time
from pathlib import Path
from typing import Dict, List
import logging
from pdf_parser import pdf_parser

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestRunner:
    """Test runner for PDF parsing functionality"""
    
    def __init__(self, test_dir: Path = Path("tests")):
        self.test_dir = test_dir
        self.expectations_file = test_dir / "expectations.yaml"
        self.results = {}
        
    def load_expectations(self) -> Dict:
        """Load test expectations from YAML file"""
        if not self.expectations_file.exists():
            raise FileNotFoundError(f"Expectations file not found: {self.expectations_file}")
        
        with open(self.expectations_file, 'r') as f:
            return yaml.safe_load(f)
    
    def find_test_pdfs(self) -> List[Path]:
        """Find all PDF test files"""
        pdf_files = []
        for pdf_file in self.test_dir.rglob("*.pdf"):
            pdf_files.append(pdf_file)
        return sorted(pdf_files)
    
    def run_single_test(self, pdf_path: Path) -> Dict:
        """Run a single test case"""
        logger.info(f"Testing: {pdf_path.name}")
        
        start_time = time.time()
        result = pdf_parser.parse_pdf(pdf_path)
        processing_time = time.time() - start_time
        
        result["processing_time"] = processing_time
        result["file_size"] = pdf_path.stat().st_size
        
        return result
    
    def run_all_tests(self) -> Dict:
        """Run all test cases"""
        logger.info("Starting test suite...")
        
        # Load expectations
        expectations = self.load_expectations()
        
        # Find test PDFs
        test_pdfs = self.find_test_pdfs()
        logger.info(f"Found {len(test_pdfs)} test PDFs")
        
        # Run tests
        for pdf_path in test_pdfs:
            test_name = pdf_path.name
            if test_name in expectations:
                result = self.run_single_test(pdf_path)
                self.results[test_name] = result
            else:
                logger.warning(f"No expectations found for {test_name}")
        
        return self.results
    
    def compare_results(self) -> Dict:
        """Compare test results with expectations"""
        expectations = self.load_expectations()
        comparison = {
            "total_tests": len(expectations),
            "passed": 0,
            "failed": 0,
            "details": {}
        }
        
        for test_name, expected in expectations.items():
            if test_name not in self.results:
                comparison["details"][test_name] = {
                    "status": "MISSING",
                    "expected": expected,
                    "actual": None,
                    "passed": False
                }
                comparison["failed"] += 1
                continue
            
            actual = self.results[test_name]
            
            # Compare status
            status_match = actual["status"] == expected["status"]
            
            # Compare emails (order doesn't matter)
            emails_match = set(actual["emails"]) == set(expected["emails"])
            
            # Compare SSNs (order doesn't matter)
            ssns_match = set(actual["ssns"]) == set(expected["ssns"])
            
            # Overall test result
            passed = status_match and emails_match and ssns_match
            
            comparison["details"][test_name] = {
                "status": "PASSED" if passed else "FAILED",
                "expected": expected,
                "actual": {
                    "status": actual["status"],
                    "emails": actual["emails"],
                    "ssns": actual["ssns"],
                    "processing_time": actual.get("processing_time", 0),
                    "text_length": actual.get("text_length", 0),
                    "pages_processed": actual.get("pages_processed", 0)
                },
                "passed": passed,
                "status_match": status_match,
                "emails_match": emails_match,
                "ssns_match": ssns_match
            }
            
            if passed:
                comparison["passed"] += 1
            else:
                comparison["failed"] += 1
        
        return comparison
    
    def print_summary(self, comparison: Dict):
        """Print test summary"""
        print("\n" + "="*60)
        print("PDF PARSING TEST RESULTS")
        print("="*60)
        print(f"Total Tests: {comparison['total_tests']}")
        print(f"Passed: {comparison['passed']}")
        print(f"Failed: {comparison['failed']}")
        print(f"Success Rate: {(comparison['passed']/comparison['total_tests']*100):.1f}%")
        
        if comparison["failed"] > 0:
            print("\nFAILED TESTS:")
            print("-" * 40)
            for test_name, details in comparison["details"].items():
                if not details["passed"]:
                    print(f"\n{test_name}:")
                    print(f"  Expected: {details['expected']}")
                    print(f"  Actual:   {details['actual']}")
                    if not details["status_match"]:
                        print(f"  ❌ Status mismatch")
                    if not details["emails_match"]:
                        print(f"  ❌ Email mismatch")
                    if not details["ssns_match"]:
                        print(f"  ❌ SSN mismatch")
        
        print("\nPERFORMANCE SUMMARY:")
        print("-" * 40)
        processing_times = [
            details["actual"]["processing_time"] 
            for details in comparison["details"].values() 
            if details["actual"] and details["actual"]["processing_time"]
        ]
        if processing_times:
            avg_time = sum(processing_times) / len(processing_times)
            max_time = max(processing_times)
            min_time = min(processing_times)
            print(f"Average processing time: {avg_time:.3f}s")
            print(f"Min processing time: {min_time:.3f}s")
            print(f"Max processing time: {max_time:.3f}s")
    
    def save_results(self, comparison: Dict, output_file: str = "test_results.yaml"):
        """Save test results to file"""
        with open(output_file, 'w') as f:
            yaml.dump(comparison, f, default_flow_style=False, sort_keys=False)
        logger.info(f"Results saved to {output_file}")

def main():
    """Main test execution function"""
    runner = TestRunner()
    
    try:
        # Run all tests
        results = runner.run_all_tests()
        
        # Compare with expectations
        comparison = runner.compare_results()
        
        # Print summary
        runner.print_summary(comparison)
        
        # Save results
        runner.save_results(comparison)
        
        # Return exit code
        return 0 if comparison["failed"] == 0 else 1
        
    except Exception as e:
        logger.error(f"Test execution failed: {e}")
        return 1

if __name__ == "__main__":
    exit(main()) 