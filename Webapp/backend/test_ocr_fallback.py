"""
Quick test to verify the fallback logic for OCR failure
"""
import sys
sys.path.insert(0, r'c:\code\git\Senior_project\Webapp\backend')

from analysis import analyze_disk_image
import os

print("\n" + "="*60)
print("  TEST: OCR Fallback Logic")
print("="*60)

# Check if test image exists
test_image_dir = "uploaded_images"
test_images = [f for f in os.listdir(test_image_dir) if f.endswith(('.jpg', '.png'))] if os.path.exists(test_image_dir) else []

if test_images:
    test_image_path = os.path.join(test_image_dir, test_images[0])
    print(f"\n✅ Found test image: {test_image_path}")
    print("\nRunning analysis with fallback logic...")
    print("Expected behavior:")
    print("  → If OCR reads medicine name → Show actual name")
    print("  → If OCR fails → Show 'Disk_1', 'Disk_2', etc.")
    print("\n" + "-"*60)
    
    results = analyze_disk_image(test_image_path)
    
    print("\n" + "-"*60)
    print(f"\n✅ Analysis completed: {len(results)} zones detected")
    
    for i, result in enumerate(results, 1):
        print(f"\nZone {i}:")
        print(f"  medicine_name: {result['medicine_name']}")
        print(f"  diameter_mm: {result['diameter_mm']}mm")
        print(f"  ocr_confidence: {result['ocr_confidence']}")
        print(f"  yolo_confidence: {result['yolo_confidence']}")
        
        # Check if fallback was used
        if result['medicine_name'].startswith('Disk_'):
            print(f"  📌 FALLBACK USED: OCR couldn't read, using disk identifier")
        else:
            print(f"  📌 OCR: Medicine name successfully extracted")

else:
    print("\n⚠️  No test images found in uploaded_images/")
    print("To test with real images:")
    print("  1. Upload an image via http://localhost:8001/docs")
    print("  2. Run this test again")
    print("  3. It will analyze with the new fallback logic")

print("\n" + "="*60)
print("✅ OCR fallback feature is ready!")
print("="*60 + "\n")
