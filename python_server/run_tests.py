#!/usr/bin/env python3
"""
Script to generate test PDFs and run the test suite
"""

import sys
from pathlib import Path

def main():
    print("🔧 PDF Parser Test Suite")
    print("=" * 40)
    
    # Step 1: Generate test PDFs
    print("\n📄 Step 1: Generating test PDFs...")
    try:
        from test_generator import main as generate_tests
        generate_tests()
        print("✅ Test PDFs generated successfully")
    except Exception as e:
        print(f"❌ Failed to generate test PDFs: {e}")
        return 1
    
    # Step 2: Run test suite
    print("\n🧪 Step 2: Running test suite...")
    try:
        from test_runner import main as run_tests
        exit_code = run_tests()
        if exit_code == 0:
            print("✅ All tests passed!")
        else:
            print("⚠️  Some tests failed. Check the output above for details.")
        return exit_code
    except Exception as e:
        print(f"❌ Test suite execution failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 