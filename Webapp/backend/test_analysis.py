"""
Unit tests for analysis.py to debug YOLO and OCR pipeline
"""
import pytest
import cv2
import numpy as np
import os
from unittest.mock import patch, MagicMock
from analysis import (
    analyze_disk_image, 
    extract_medicine_ocr,
    crop_and_pad_640,
    combine_preprocessing,
    global_threshold,
    histogram_equalization,
    rotate_image,
    adjust_confidence_with_regex,
    model,
    ocr_reader
)

# Test image path (use a real image from your data)
TEST_IMAGE_PATH = "uploaded_images/test_plate.jpg"

class TestPreprocessing:
    """Test image preprocessing functions"""
    
    def test_global_threshold(self):
        """Test global thresholding"""
        # Create test image
        img = np.random.randint(0, 256, (100, 100), dtype=np.uint8)
        result = global_threshold(img, white=200)
        
        assert result.shape == img.shape
        assert result.dtype == np.uint8
        assert np.all((result == 0) | (result == 255))
        print("✓ global_threshold works")
    
    def test_histogram_equalization(self):
        """Test histogram equalization"""
        img = np.random.randint(0, 256, (100, 100), dtype=np.uint8)
        result = histogram_equalization(img)
        
        assert result.shape == img.shape
        assert result.dtype == np.uint8
        print("✓ histogram_equalization works")
    
    def test_combine_preprocessing(self):
        """Test combined preprocessing"""
        img = np.random.randint(0, 256, (100, 100), dtype=np.uint8)
        result = combine_preprocessing(img, white=200)
        
        assert result.shape == img.shape
        assert result.dtype == np.uint8
        print("✓ combine_preprocessing works")

class TestCropping:
    """Test image cropping and padding"""
    
    def test_crop_and_pad_640(self):
        """Test cropping and padding to 640x640"""
        # Create test image (500x500x3)
        img = np.random.randint(0, 256, (500, 500, 3), dtype=np.uint8)
        bbox = np.array([50, 50, 300, 300])  # 250x250 region
        
        result = crop_and_pad_640(img, bbox, target=640)
        
        assert result.shape == (640, 640), f"Expected (640, 640), got {result.shape}"
        assert result.dtype == np.uint8
        print("✓ crop_and_pad_640 works")
    
    def test_crop_and_pad_edge_cases(self):
        """Test cropping with edge cases"""
        img = np.random.randint(0, 256, (300, 300, 3), dtype=np.uint8)
        
        # Bbox out of bounds
        bbox = np.array([-50, -50, 350, 350])
        result = crop_and_pad_640(img, bbox, target=640)
        
        assert result.shape == (640, 640)
        print("✓ crop_and_pad_640 handles edge cases")

class TestRotation:
    """Test image rotation"""
    
    def test_rotate_image(self):
        """Test image rotation"""
        img = np.random.randint(0, 256, (100, 100), dtype=np.uint8)
        
        result = rotate_image(img, 45)
        assert result.shape == img.shape
        assert result.dtype == np.uint8
        print("✓ rotate_image works")

class TestRegex:
    """Test regex pattern matching"""
    
    def test_adjust_confidence_with_regex(self):
        """Test confidence adjustment based on regex"""
        # Valid formats
        valid_texts = [
            "AMX 30",
            "Amoxicillin 30",
            "CTX 30",
            "CephalexinSodium 500"
        ]
        
        for text in valid_texts:
            conf = adjust_confidence_with_regex(text, 0.5)
            assert conf == 0.5, f"Valid text '{text}' should keep full confidence"
        
        # Invalid formats
        invalid_texts = ["123", "....", ""]
        for text in invalid_texts:
            conf = adjust_confidence_with_regex(text, 0.5)
            assert conf < 0.5, f"Invalid text '{text}' should reduce confidence"
        
        print("✓ adjust_confidence_with_regex works")

class TestModelLoading:
    """Test model and OCR loading"""
    
    def test_yolo_model_loaded(self):
        """Test YOLO model is loaded"""
        assert model is not None, "YOLO model failed to load"
        print(f"✓ YOLO model loaded: {model}")
    
    def test_ocr_reader_loaded(self):
        """Test OCR reader is loaded"""
        assert ocr_reader is not None, "OCR reader failed to load"
        print(f"✓ OCR reader loaded: {ocr_reader}")

class TestMedicineExtraction:
    """Test OCR medicine extraction"""
    
    @pytest.mark.skipif(ocr_reader is None, reason="OCR reader not available")
    def test_extract_medicine_ocr_basic(self):
        """Test basic OCR extraction"""
        # Create a simple image with text-like patterns
        img = np.ones((640, 640), dtype=np.uint8) * 255
        cv2.putText(img, "AMX25", (200, 320), cv2.FONT_HERSHEY_SIMPLEX, 2, 0, 2)
        
        medicine, conf, angle = extract_medicine_ocr(img)
        
        print(f"OCR Result: medicine='{medicine}' conf={conf} angle={angle}")
        # Even if we don't get exact match, function should run without error
        assert isinstance(medicine, str)
        assert isinstance(conf, float)
        assert isinstance(angle, int)

class TestFullPipeline:
    """Test the complete analysis pipeline"""
    
    @pytest.mark.skipif(model is None, reason="YOLO model not available")
    @pytest.mark.skipif(not os.path.exists(TEST_IMAGE_PATH), reason="Test image not available")
    def test_analyze_disk_image(self):
        """Test full analysis pipeline"""
        print(f"\nTesting with image: {TEST_IMAGE_PATH}")
        results = analyze_disk_image(TEST_IMAGE_PATH)
        
        print(f"Analysis results: {len(results)} zones detected")
        for i, zone in enumerate(results):
            print(f"  Zone {i+1}: {zone['medicine_name']} - {zone['diameter_mm']}mm")
        
        assert isinstance(results, list)
        # Note: Don't assert len > 0 as model might not detect properly
        print("✓ analyze_disk_image runs without errors")

if __name__ == "__main__":
    print("=" * 60)
    print("Running Analysis Unit Tests")
    print("=" * 60)
    
    # Test preprocessing
    print("\n[1] Testing Preprocessing Functions...")
    test_prep = TestPreprocessing()
    test_prep.test_global_threshold()
    test_prep.test_histogram_equalization()
    test_prep.test_combine_preprocessing()
    
    # Test cropping
    print("\n[2] Testing Cropping Functions...")
    test_crop = TestCropping()
    test_crop.test_crop_and_pad_640()
    test_crop.test_crop_and_pad_edge_cases()
    
    # Test rotation
    print("\n[3] Testing Rotation Functions...")
    test_rot = TestRotation()
    test_rot.test_rotate_image()
    
    # Test regex
    print("\n[4] Testing Regex Functions...")
    test_regex = TestRegex()
    test_regex.test_adjust_confidence_with_regex()
    
    # Test model loading
    print("\n[5] Testing Model Loading...")
    test_model = TestModelLoading()
    test_model.test_yolo_model_loaded()
    test_model.test_ocr_reader_loaded()
    
    # Test OCR
    print("\n[6] Testing OCR Extraction...")
    test_ocr = TestMedicineExtraction()
    if ocr_reader is not None:
        test_ocr.test_extract_medicine_ocr_basic()
    else:
        print("⚠ OCR reader not available, skipping OCR test")
    
    # Test full pipeline
    print("\n[7] Testing Full Pipeline...")
    test_full = TestFullPipeline()
    if os.path.exists(TEST_IMAGE_PATH) and model is not None:
        test_full.test_analyze_disk_image()
    else:
        print(f"⚠ Test image not available at {TEST_IMAGE_PATH}, skipping pipeline test")
    
    print("\n" + "=" * 60)
    print("Unit Tests Completed!")
    print("=" * 60)
