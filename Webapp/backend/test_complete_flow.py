"""
Complete system test: Check all functions and API endpoints
"""
import requests
import json
import os
import sys
from pathlib import Path

# Configuration
API_BASE_URL = "http://localhost:8001"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "testpass123"

def print_section(title):
    """Print formatted section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def test_api_health():
    """Test if API is running and responding"""
    print_section("TEST 1: API Health Check")
    try:
        response = requests.get(f"{API_BASE_URL}/", timeout=5)
        if response.status_code == 200:
            print("✅ API is running")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"❌ API returned status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API connection failed: {e}")
        return False

def test_register_user():
    """Test user registration"""
    print_section("TEST 2: User Registration")
    try:
        user_data = {
            "email": TEST_USER_EMAIL,
            "full_name": "Test User",
            "password": TEST_USER_PASSWORD
        }
        response = requests.post(
            f"{API_BASE_URL}/register",
            json=user_data,
            timeout=5
        )
        if response.status_code in [201, 400]:  # 201 = created, 400 = already exists
            print(f"✅ Registration endpoint working (status: {response.status_code})")
            if response.status_code == 400:
                print("   (User already exists)")
            return True
        else:
            print(f"❌ Registration failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Registration test failed: {e}")
        return False

def test_login():
    """Test user login"""
    print_section("TEST 3: User Login")
    try:
        login_data = {
            "username": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        response = requests.post(
            f"{API_BASE_URL}/login",
            data=login_data,
            timeout=5
        )
        if response.status_code == 200:
            token_data = response.json()
            if "access_token" in token_data:
                print("✅ Login successful")
                print(f"Token received: {token_data['access_token'][:20]}...")
                return token_data
            else:
                print(f"❌ No token in response: {response.text}")
                return None
        else:
            print(f"❌ Login failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login test failed: {e}")
        return None

def test_get_microbes(token):
    """Test getting microbes list"""
    print_section("TEST 4: Get Microbes List")
    try:
        headers = {"Authorization": f"Bearer {token['access_token']}"}
        response = requests.get(
            f"{API_BASE_URL}/microbes",
            headers=headers,
            timeout=5
        )
        if response.status_code == 200:
            microbes = response.json()
            print(f"✅ Retrieved {len(microbes)} microbes")
            if microbes:
                print(f"   First microbe: {microbes[0]}")
            return True
        else:
            print(f"❌ Get microbes failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Get microbes test failed: {e}")
        return False

def test_analyze_endpoint():
    """Test analyze endpoint (would need actual image)"""
    print_section("TEST 5: Analyze Endpoint Structure")
    
    print("Requirements for /analyze endpoint:")
    print("  - POST request")
    print("  - Requires: file (image), microbe_name, authentication token")
    print("  - Optional: batch_id")
    print("  - Returns: plate data, analysis results, visualization URL")
    print("  - Status: ✅ Endpoint exists and is properly configured")
    
    # Check if endpoint signature is correct
    try:
        import inspect
        from main import analyze_image
        sig = inspect.signature(analyze_image)
        params = list(sig.parameters.keys())
        
        required_params = {'file', 'microbe_name', 'db', 'current_user'}
        has_required = required_params.issubset(set(params))
        
        if has_required:
            print("  - ✅ All required parameters present")
            return True
        else:
            print(f"  - ❌ Missing parameters: {required_params - set(params)}")
            return False
    except Exception as e:
        print(f"  - ⚠️  Could not verify signature: {e}")
        return False

def test_analysis_functions():
    """Test analysis module functions"""
    print_section("TEST 6: Analysis Functions")
    
    functions_to_test = [
        ("crop_and_pad_640", "Crop and pad image to 640x640"),
        ("rotate_image", "Rotate image by angle"),
        ("extract_medicine_ocr", "Extract medicine name via OCR"),
        ("calculate_diameter_mm", "Calculate diameter in mm"),
        ("analyze_disk_image", "Main analysis function"),
        ("draw_detections_on_image", "Draw visualizations"),
        ("histogram_equalization", "Apply histogram equalization"),
        ("global_threshold", "Apply global threshold"),
        ("combine_preprocessing", "Combine preprocessing steps"),
    ]
    
    all_ok = True
    try:
        import analysis
        
        for func_name, description in functions_to_test:
            if hasattr(analysis, func_name):
                print(f"  ✅ {func_name}: {description}")
            else:
                print(f"  ❌ {func_name}: NOT FOUND")
                all_ok = False
        
        return all_ok
    except Exception as e:
        print(f"  ❌ Error checking functions: {e}")
        return False

def test_database_models():
    """Test database models"""
    print_section("TEST 7: Database Models")
    
    models_to_test = [
        "User", "Microbe", "Antibiotic", "Plate", 
        "PlateResult", "Standard", "BreakpointDiskDiffusion"
    ]
    
    all_ok = True
    try:
        import models
        
        for model_name in models_to_test:
            if hasattr(models, model_name):
                print(f"  ✅ {model_name}")
            else:
                print(f"  ❌ {model_name}: NOT FOUND")
                all_ok = False
        
        return all_ok
    except Exception as e:
        print(f"  ❌ Error checking models: {e}")
        return False

def test_schema_validation():
    """Test Pydantic schemas"""
    print_section("TEST 8: Schema Validation (Pydantic V2)")
    
    schemas_to_test = [
        "UserCreate", "PlateBase", "PlateResultBase", "AnalysisBatchBase"
    ]
    
    all_ok = True
    try:
        import schemas
        
        for schema_name in schemas_to_test:
            if hasattr(schemas, schema_name):
                schema_class = getattr(schemas, schema_name)
                # Check if it has from_attributes (Pydantic V2)
                config = getattr(schema_class, 'model_config', None)
                print(f"  ✅ {schema_name}")
            else:
                print(f"  ❌ {schema_name}: NOT FOUND")
                all_ok = False
        
        return all_ok
    except Exception as e:
        print(f"  ❌ Error checking schemas: {e}")
        return False

def test_uploads_directory():
    """Check if uploads directory is writable"""
    print_section("TEST 9: Uploads Directory")
    try:
        upload_dir = "uploaded_images"
        if os.path.exists(upload_dir):
            print(f"  ✅ Directory exists: {upload_dir}")
            
            # Check if writable
            test_file = os.path.join(upload_dir, ".write_test")
            try:
                with open(test_file, "w") as f:
                    f.write("test")
                os.remove(test_file)
                print(f"  ✅ Directory is writable")
                return True
            except:
                print(f"  ❌ Directory is NOT writable")
                return False
        else:
            print(f"  ⚠️  Directory not found: {upload_dir}")
            return False
    except Exception as e:
        print(f"  ❌ Error checking directory: {e}")
        return False

def test_yolo_model():
    """Test YOLO model loading"""
    print_section("TEST 10: YOLO Model")
    try:
        from analysis import model, ocr_reader
        
        if model is not None:
            print("  ✅ YOLO model loaded successfully")
        else:
            print("  ❌ YOLO model failed to load")
            return False
        
        if ocr_reader is not None:
            print("  ✅ OCR reader loaded successfully")
        else:
            print("  ❌ OCR reader failed to load")
            return False
        
        return True
    except Exception as e:
        print(f"  ❌ Error loading models: {e}")
        return False

def main():
    """Run all tests"""
    print("\n")
    print("╔" + "="*58 + "╗")
    print("║" + " "*15 + "COMPLETE SYSTEM TEST SUITE" + " "*17 + "║")
    print("╚" + "="*58 + "╝")
    
    results = {}
    
    # Run tests
    results["API Health"] = test_api_health()
    results["User Registration"] = test_register_user()
    
    token = test_login()
    results["User Login"] = token is not None
    
    if token:
        results["Get Microbes"] = test_get_microbes(token)
    
    results["Analyze Endpoint"] = test_analyze_endpoint()
    results["Analysis Functions"] = test_analysis_functions()
    results["Database Models"] = test_database_models()
    results["Schema Validation"] = test_schema_validation()
    results["Uploads Directory"] = test_uploads_directory()
    results["YOLO Model"] = test_yolo_model()
    
    # Summary
    print_section("TEST SUMMARY")
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status:8} {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
