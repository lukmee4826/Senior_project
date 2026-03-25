"""
Simplified system test - focus on API structure and functions without database dependencies
"""
import requests
import json
import sys

API_BASE_URL = "http://localhost:8001"

def test_api_basic():
    """Test basic API health"""
    print("\n" + "="*60)
    print("  TEST: API Basic Health Check")
    print("="*60)
    try:
        response = requests.get(f"{API_BASE_URL}/", timeout=5)
        print(f"✅ API is responding (status: {response.status_code})")
        print(f"   Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ API not responding: {e}")
        return False

def test_analysis_module():
    """Test analysis module can be imported and functions exist"""
    print("\n" + "="*60)
    print("  TEST: Analysis Module Functions")
    print("="*60)
    
    try:
        import sys
        sys.path.insert(0, r'c:\code\git\Senior_project\Webapp\backend')
        import analysis
        
        functions = [
            'crop_and_pad_640',
            'rotate_image',
            'extract_medicine_ocr',
            'calculate_diameter_mm',
            'analyze_disk_image',
            'draw_detections_on_image',
            'histogram_equalization',
            'global_threshold',
            'combine_preprocessing',
            'adjust_confidence_with_regex'
        ]
        
        all_ok = True
        for func_name in functions:
            if hasattr(analysis, func_name):
                func = getattr(analysis, func_name)
                print(f"✅ {func_name}")
            else:
                print(f"❌ {func_name} NOT FOUND")
                all_ok = False
        
        return all_ok
    except Exception as e:
        print(f"❌ Error checking module: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_models():
    """Test database models"""
    print("\n" + "="*60)
    print("  TEST: Database Models")
    print("="*60)
    
    try:
        import sys
        sys.path.insert(0, r'c:\code\git\Senior_project\Webapp\backend')
        import models
        
        model_names = [
            'User', 'Microbe', 'Antibiotic', 'Plate', 
            'PlateResult', 'Standard', 'BreakpointDiskDiffusion', 'AnalysisBatch'
        ]
        
        all_ok = True
        for model_name in model_names:
            if hasattr(models, model_name):
                print(f"✅ {model_name}")
            else:
                print(f"❌ {model_name} NOT FOUND")
                all_ok = False
        
        return all_ok
    except Exception as e:
        print(f"❌ Error checking models: {e}")
        return False

def test_yolo_model():
    """Test YOLO model loading"""
    print("\n" + "="*60)
    print("  TEST: ML Models (YOLO & OCR)")
    print("="*60)
    
    try:
        import sys
        sys.path.insert(0, r'c:\code\git\Senior_project\Webapp\backend')
        from analysis import model, ocr_reader
        
        if model is not None:
            print("✅ YOLO model loaded:")
            print(f"   Model type: {type(model).__name__}")
            print(f"   Model classes: {model.names}")
        else:
            print("❌ YOLO model failed to load")
            return False
        
        if ocr_reader is not None:
            print("✅ EasyOCR reader loaded")
        else:
            print("❌ OCR reader failed to load")
            return False
        
        return True
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_image_functions():
    """Test that image processing functions work"""
    print("\n" + "="*60)
    print("  TEST: Image Processing Functions")
    print("="*60)
    
    try:
        import sys
        sys.path.insert(0, r'c:\code\git\Senior_project\Webapp\backend')
        import analysis
        import numpy as np
        import cv2
        
        # Create dummy image
        dummy_img = np.zeros((640, 640, 3), dtype=np.uint8)
        dummy_gray = cv2.cvtColor(dummy_img, cv2.COLOR_BGR2GRAY)
        
        # Test histogram equalization
        result = analysis.histogram_equalization(dummy_gray)
        assert result.shape == dummy_gray.shape
        print("✅ histogram_equalization works")
        
        # Test global threshold
        result = analysis.global_threshold(dummy_gray, white=200)
        assert result.shape == dummy_gray.shape
        print("✅ global_threshold works")
        
        # Test combine preprocessing
        result = analysis.combine_preprocessing(dummy_gray, white=200)
        assert result.shape == dummy_gray.shape
        print("✅ combine_preprocessing works")
        
        # Test rotate_image
        result = analysis.rotate_image(dummy_img, 45)
        assert result.shape == dummy_img.shape
        print("✅ rotate_image works")
        
        # Test crop_and_pad_640
        bbox = [100, 100, 300, 300]
        result = analysis.crop_and_pad_640(dummy_img, bbox, target=640)
        assert result.shape[:2] == (640, 640), f"Expected (640, 640), got {result.shape}"
        print("✅ crop_and_pad_640 works")
        
        # Test diameter calculation
        diameter = analysis.calculate_diameter_mm([100, 100, 200, 200], 640, pixels_per_mm=10)
        assert isinstance(diameter, (int, float))
        assert diameter > 0
        print(f"✅ calculate_diameter_mm works (calculated: {diameter}mm)")
        
        return True
    except Exception as e:
        print(f"❌ Error testing image functions: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_api_endpoints():
    """Check if required endpoints exist"""
    print("\n" + "="*60)
    print("  TEST: API Endpoints")
    print("="*60)
    
    try:
        from main import app
        import inspect
        
        # Get all routes
        routes = []
        for route in app.routes:
            if hasattr(route, 'name'):
                routes.append(route.name)
        
        required_endpoints = [
            'login_for_access_token',  # /login
            'register_user',  # /register
            'read_microbes',  # /microbes
            'analyze_image',  # /analyze
            'read_root'  # /
        ]
        
        all_ok = True
        for endpoint in required_endpoints:
            if endpoint in routes:
                print(f"✅ Endpoint '{endpoint}' exists")
            else:
                print(f"❌ Endpoint '{endpoint}' NOT FOUND")
                all_ok = False
        
        return all_ok
    except Exception as e:
        print(f"❌ Error checking endpoints: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_config():
    """Test configuration"""
    print("\n" + "="*60)
    print("  TEST: Configuration")
    print("="*60)
    
    try:
        import sys
        sys.path.insert(0, r'c:\code\git\Senior_project\Webapp\backend')
        import os
        
        # Check if uploaded_images directory exists
        if os.path.exists("uploaded_images"):
            print("✅ uploaded_images directory exists")
        else:
            print("⚠️  uploaded_images directory not found")
        
        # Check if models exist
        if os.path.exists("models/yolo_best.pt"):
            print("✅ YOLO model file found")
        else:
            print("❌ YOLO model file not found")
            return False
        
        # Check if database exists
        if os.path.exists("senior_project.db"):
            print("✅ Database file found")
        else:
            print("⚠️  Database file not found (will be created on first run)")
        
        return True
    except Exception as e:
        print(f"❌ Error checking configuration: {e}")
        return False

def main():
    """Run all tests"""
    print("\n")
    print("╔" + "="*58 + "╗")
    print("║" + " "*12 + "STREAMLINED SYSTEM TEST SUITE v2" + " "*14 + "║")
    print("╚" + "="*58 + "╝")
    
    tests = [
        ("API Basic Check", test_api_basic),
        ("Analysis Module", test_analysis_module),
        ("Database Models", test_models),
        ("ML Models", test_yolo_model),
        ("Image Functions", test_image_functions),
        ("API Endpoints", test_api_endpoints),
        ("Configuration", test_config),
    ]
    
    results = {}
    for test_name, test_func in tests:
        results[test_name] = test_func()
    
    # Summary
    print("\n" + "="*60)
    print("  SUMMARY")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status:8} {test_name}")
    
    print(f"\n  Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! System is ready.")
    else:
        print(f"\n⚠️  {total - passed} test(s) need attention.")
    
    print("\n" + "="*60)
    print("API Server is running at: http://localhost:8001")
    print("Interactive docs available at: http://localhost:8001/docs")
    print("="*60 + "\n")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
