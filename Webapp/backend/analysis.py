from ultralytics import YOLO
import cv2
import numpy as np
import os
import easyocr
import re
from skimage import filters
import uuid
from datetime import datetime

PIXELS_PER_MM = float(os.getenv("PIXELS_PER_MM", "10.0"))

# Load the YOLO model for zone detection
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "yolo_best.pt")

try:
    model = YOLO(MODEL_PATH)
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Load EasyOCR reader
try:
    ocr_reader = easyocr.Reader(['en'])
except Exception as e:
    print(f"Error loading OCR reader: {e}")
    ocr_reader = None

# Regex pattern for validating medicine name and dosage
PATTERN = re.compile(
    r'^([A-Za-z]+(?:\s[A-Za-z]+){0,3})\s+(\d+(?:\.\d+)?)$')

# ==========================================
# Preprocessing Functions for OCR
# ==========================================

def global_threshold(img, white=200):
    """Apply global threshold to image."""
    _, thresh = cv2.threshold(img, white, 255, cv2.THRESH_BINARY)
    return thresh

def histogram_equalization(img):
    """Apply histogram equalization to improve contrast."""
    equalized = cv2.equalizeHist(img)
    return equalized

def adaptive_threshold_clahe(img):
    """IMPROVED: Use CLAHE (Contrast Limited Adaptive Histogram Equalization).
    More gentle than global thresholding, better for text extraction."""
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(img)
    return enhanced

def sharpening(img):
    kernel = np.array([[-0.5,-0.5,-0.5], 
                       [-0.5,5,-0.5],
                       [-0.5,-0.5,-0.5]])
    sharpen = cv2.filter2D(img, -1, kernel)
    sharpen = np.clip(sharpen, 0, 255).astype(np.uint8)

    return sharpen

def denoise_otsu(gray):
    # 1. CLAHE normalize
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray_clahe = clahe.apply(gray)

    # 2. Sharpen
    sharpened = sharpening(gray_clahe)

    # 3. Blur
    blurred = cv2.GaussianBlur(sharpened, (3, 3), 0)

    # 4. Otsu
    _, processed = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # 5. Measure stroke width -> dilate/erode
    inverted = cv2.bitwise_not(processed)
    text_pixel_ratio = np.sum(inverted == 255) / inverted.size

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))

    if text_pixel_ratio < 0.15:
        processed_fix = cv2.dilate(inverted, kernel, iterations=1)
    elif text_pixel_ratio > 0.35:
        processed_fix = cv2.erode(inverted, kernel, iterations=1)
    else:
        processed_fix = inverted

    result = cv2.bitwise_not(processed_fix)
    return result

def crop_and_pad_640(img, box, target=640):
    """Crop ROI from image and pad to target size (640x640)."""
    # Convert box to numpy array if it's a list
    if isinstance(box, list):
        box = np.array(box)
    
    x_min, y_min, x_max, y_max = box.astype(int)
    
    # Prevent coordinates from going out of bounds
    x_min = max(0, x_min)
    y_min = max(0, y_min)
    x_max = min(img.shape[1], x_max)
    y_max = min(img.shape[0], y_max)
    
    # Crop ROI from original image
    crop = img[y_min:y_max, x_min:x_max]
    
    if crop.size == 0:
        return np.zeros((target, target, 3), dtype=np.uint8) if len(img.shape) == 3 else np.zeros((target, target), dtype=np.uint8)
    
    h, w = crop.shape[:2]
    
    square_size = min(h, w)  # Use the shorter dimension
    
    # Center crop to square
    y_start = (h - square_size) // 2
    x_start = (w - square_size) // 2
    
    square = crop[
        y_start:y_start + square_size,
        x_start:x_start + square_size
    ]
    
    # Resize to target size
    square_resized = cv2.resize(square, (target, target))
    
    return square_resized

def rotate_image(img, angle):
    """Rotate image by given angle."""
    h, w = img.shape[:2]
    center = (w // 2, h // 2)
    
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(
        img, M, (w, h),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=255
    )
    return rotated

def adjust_confidence_with_regex(text, conf, penalty=0.15):
    """Adjust confidence based on regex match for medicine name + dosage.
    
    IMPROVED: Reduced default penalty from 0.3 to 0.15 and more flexible regex pattern.
    Now accepts variations like "AMC 20" (single digit dosage) and partial matches.
    """
    if text is None or text.strip() == "":
        return 0.0
    
    text_clean = text.strip()
    
    # More lenient pattern - accepts just medicine name with optional dosage
    # Accepts: "AMC", "AMC20", "AMC 20", "AMC 20ug", etc.
    lenient_pattern = re.compile(r'^[A-Za-z]+(?:\s+\d+(?:\.\d+)?)?(?:\s*[a-zA-Z]*)?$')
    
    if lenient_pattern.match(text_clean):
        return conf  # Full match - no penalty
    
    # Check if it's at least a valid medicine name (letters only, no numbers mixed)
    if re.match(r'^[A-Za-z\s]+$', text_clean):
        return max(0.0, conf - 0.05)  # Light penalty for name-only
    
    # If pattern doesn't match but has some alphanumeric content and length > 2
    if len(text_clean) >= 2 and re.search(r'[A-Za-z0-9]', text_clean):
        return max(0.0, conf - penalty)  # Standard penalty
    
    return 0.0  # No valid text

def extract_medicine_ocr(image_gray):
    """
    Extract medicine name from cropped disk image using OCR with rotation.
    Expects image_gray to already be preprocessed (e.g., with denoise_otsu).
    Returns (medicine_name, confidence, angle_used)
    """
    if ocr_reader is None:
        print("Warning: OCR reader not initialized")
        return "Unknown", 0.0, 0
    
    best_text = "Unknown"
    best_conf = 0.0
    best_angle = 0
    
    angles = list(range(-180, 180, 15))
    print(f"[DEBUG OCR] Starting OCR with {len(angles)} angles (Optimized Pipeline)")
    
    for angle in angles:
        rotated = rotate_image(image_gray, angle)
        
        try:
            result = ocr_reader.readtext(
                rotated,
                allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.',
                detail=1
            )
            
            texts = [t for _, t, _ in result]
            confs = [c for _, _, c in result]
            
            display_text = " ".join(texts) if texts else ""
            avg_conf = np.mean(confs) if confs else 0.0
            
            # Adjust confidence based on pattern matching
            adj_conf = adjust_confidence_with_regex(display_text, avg_conf, penalty=0.10)
            
            if display_text:
                print(f"[DEBUG OCR] Angle {angle}°: text='{display_text}' conf={avg_conf:.3f} adj_conf={adj_conf:.3f}")
            
            if adj_conf > best_conf:
                best_conf = adj_conf
                best_text = display_text
                best_angle = angle
        
        except Exception as e:
            print(f"[DEBUG OCR] Error at angle {angle}: {e}")
            continue
    
    # Fallback checking
    if best_conf < 0.10 and best_text.strip() != "Unknown":
        pass # accept weak but valid
    elif best_conf < 0.10 or best_text.strip() == "":
        best_text = "Unknown"
        best_conf = 0.0
    
    print(f"[DEBUG OCR] ✓ Best result: text='{best_text}' conf={best_conf:.3f} angle={best_angle}°")
    
    return best_text, round(best_conf, 3), best_angle

def calculate_diameter_mm(bbox, image_width_px, pixels_per_mm=10):
    """
    Calculate the diameter of a detected zone in mm.
    
    Args:
        bbox: [x1, y1, x2, y2] bounding box coordinates
        image_width_px: width of the image in pixels
        pixels_per_mm: conversion factor (pixels per mm) - adjust based on your actual image calibration
    
    Returns:
        diameter in mm
    """
    x1, y1, x2, y2 = bbox
    width_px = x2 - x1
    height_px = y2 - y1
    avg_size_px = (width_px + height_px) / 2
    diameter_mm = avg_size_px / pixels_per_mm
    return diameter_mm

def analyze_disk_image(image_path: str):
    """
    Analyze the disk image using YOLO model to detect:
    1. Antibiotic disk (class 0) - use for OCR medicine name
    2. Inhibition areas (class 1) - use for diameter measurement
    
    IMPORTANT: Do NOT preprocess image before YOLO inference.
    YOLO was trained on original images. Only preprocess the cropped disk region for OCR.
    
    Returns:
        List of dicts with: medicine_name (from OCR of disk), diameter_mm (from zone), confidence
    """
    
    detected_zones = []
    detected_disks = []
    
    if not model:
        print("Error: YOLO Model failed to load")
        return detected_zones

    try:
        print(f"[DEBUG] Starting analysis for image: {image_path}")
        print(f"[DEBUG] Model loaded: {model is not None}")
        print(f"[DEBUG] OCR reader loaded: {ocr_reader is not None}")
        
        # Load image - ORIGINAL, NO PREPROCESSING FOR YOLO
        img = cv2.imread(image_path)
        if img is None:
            print(f"Error: Could not read image from {image_path}")
            return detected_zones
        
        image_height, image_width = img.shape[:2]
        print(f"[DEBUG] Image shape: {img.shape}")
        
        # Run YOLO inference with ORIGINAL image
        print("[DEBUG] Running YOLO inference on ORIGINAL image (no preprocessing)...")
        results = model(image_path, conf=0.1)
        print(f"[DEBUG] YOLO results: {results is not None and len(results) > 0}")
        
        # Separate detections by class
        if results and len(results) > 0:
            result = results[0]
            print(f"[DEBUG] Result boxes: {result.boxes}")
            
            # Check if detections exist
            if result.boxes is not None and len(result.boxes) > 0:
                boxes = result.boxes
                print(f"[DEBUG] Total detections: {len(boxes)}")
                
                for i, box in enumerate(boxes):
                    # Get class information
                    class_id = int(box.cls[0].cpu().numpy())
                    class_name = result.names[class_id] if class_id in result.names else f"Class_{class_id}"
                    
                    # Get bounding box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    bbox = [float(x1), float(y1), float(x2), float(y2)]
                    
                    # Get confidence score from YOLO
                    yolo_confidence = float(box.conf[0].cpu().numpy())
                    
                    print(f"[DEBUG] Detection {i+1}: class={class_name} (id={class_id}) conf={yolo_confidence:.3f}")
                    
                    # Separate by class
                    if class_name.lower() == "antibiotic":
                        print(f"  → Detected ANTIBIOTIC DISK")
                        detected_disks.append({
                            "bbox": bbox,
                            "confidence": yolo_confidence,
                            "class_id": class_id,
                            "class_name": class_name
                        })
                    elif class_name.lower() in ["disk_zone", "disk-zone"]:  # Handle both formats
                        print(f"  → Detected INHIBITION ZONE")
                        detected_zones.append({
                            "bbox": bbox,
                            "confidence": yolo_confidence,
                            "class_id": class_id,
                            "class_name": class_name
                        })
        else:
            print("[DEBUG] No detections from YOLO!")
            return detected_zones
        
        print(f"\n[DEBUG] Found {len(detected_disks)} disks and {len(detected_zones)} inhibition zones")
        
        # Process each inhibition zone and pair with nearest disk
        results_with_medicine = []
        used_disk_indices = set()
        
        for zone_idx, zone_data in enumerate(detected_zones):
            print(f"\n[DEBUG] Processing zone {zone_idx + 1}...")
            
            zone_bbox = zone_data['bbox']
            
            # Default pixels_per_mm
            current_pixels_per_mm = PIXELS_PER_MM
            
            # Find nearest disk for this zone
            medicine_name = "Unknown"
            ocr_confidence = 0.0
            disk_used_idx = -1
            
            if detected_disks:
                min_distance = float('inf')
                nearest_disk_idx = -1
                
                zone_center_x = (zone_bbox[0] + zone_bbox[2]) / 2
                zone_center_y = (zone_bbox[1] + zone_bbox[3]) / 2
                
                for disk_idx, disk_data in enumerate(detected_disks):
                    disk_bbox = disk_data['bbox']
                    disk_center_x = (disk_bbox[0] + disk_bbox[2]) / 2
                    disk_center_y = (disk_bbox[1] + disk_bbox[3]) / 2
                    
                    # Calculate distance between zone center and disk center
                    distance = np.sqrt((zone_center_x - disk_center_x)**2 + (zone_center_y - disk_center_y)**2)
                    
                    if distance < min_distance:
                        min_distance = distance
                        nearest_disk_idx = disk_idx
                
                # Use nearest disk for OCR and Calibration
                if nearest_disk_idx >= 0:
                    disk_data = detected_disks[nearest_disk_idx]
                    disk_bbox = disk_data['bbox']
                    disk_used_idx = nearest_disk_idx
                    used_disk_indices.add(nearest_disk_idx)
                    
                    # DYNAMIC CALIBRATION: Standard antibiotic disk is 6.0 mm
                    disk_w = disk_bbox[2] - disk_bbox[0]
                    disk_h = disk_bbox[3] - disk_bbox[1]
                    disk_avg_px = (disk_w + disk_h) / 2
                    if disk_avg_px > 0:
                        current_pixels_per_mm = disk_avg_px / 6.0
                        print(f"[DEBUG] Dynamic Calibration: disk size={disk_avg_px:.1f}px -> {current_pixels_per_mm:.2f} px/mm (used as reference)")
                    
                    print(f"[DEBUG] Using disk {nearest_disk_idx + 1} (distance: {min_distance:.0f}px)")
                    print(f"[DEBUG] Disk bbox: [{disk_bbox[0]:.0f}, {disk_bbox[1]:.0f}, {disk_bbox[2]:.0f}, {disk_bbox[3]:.0f}]")
                    print(f"[DEBUG] Disk size: {disk_bbox[2]-disk_bbox[0]:.0f}x{disk_bbox[3]-disk_bbox[1]:.0f} pixels")
                    
                    # Crop disk region and extract medicine name
                    crop_640 = crop_and_pad_640(img, disk_bbox)
                    print(f"[DEBUG] Cropped & padded disk to 640x640")
                    
                    # Convert to grayscale for OCR
                    if len(crop_640.shape) == 3:
                        gray_crop = cv2.cvtColor(crop_640, cv2.COLOR_BGR2GRAY)
                    else:
                        gray_crop = crop_640
                    
                    print(f"[DEBUG] Gray crop shape: {gray_crop.shape}")
                    
                    # Apply preprocessing
                    processed_crop = denoise_otsu(gray_crop)
                    print(f"[DEBUG] After preprocessing - min: {processed_crop.min()}, max: {processed_crop.max()}")
                    
                    # Extract medicine name via OCR
                    print(f"[DEBUG] Running OCR on disk {nearest_disk_idx + 1}...")
                    medicine_name, ocr_confidence, angle_used = extract_medicine_ocr(processed_crop)
                    print(f"[DEBUG] OCR result: medicine_name='{medicine_name}' confidence={ocr_confidence} angle={angle_used}°")
                    
                    # FALLBACK: If OCR fails or confidence too low, use class name + disk number
                    if medicine_name == "Unknown" or ocr_confidence < 0.3:
                        medicine_name = f"Disk_{nearest_disk_idx + 1}"  # Fallback: use class name
                        ocr_confidence = 0.0  # Mark as no OCR confidence
                        print(f"[DEBUG] OCR failed - Using fallback: '{medicine_name}'")
            else:
                print("[DEBUG] No disks detected for OCR")
                medicine_name = "Unknown_Disk"  # No disk found fallback
            
            # Calculate final diameter using calibrated pixels_per_mm
            diameter_mm = calculate_diameter_mm(zone_bbox, image_width, pixels_per_mm=current_pixels_per_mm)
            print(f"[DEBUG] Zone diameter: {diameter_mm:.2f}mm (using {current_pixels_per_mm:.2f} px/mm)")

            results_with_medicine.append({
                "medicine_name": medicine_name,  # Name from OCR or fallback class name
                "diameter_mm": round(diameter_mm, 2),  # Measured zone size
                "ocr_confidence": ocr_confidence,
                "yolo_confidence": round(zone_data['confidence'], 3),
                "disk_used_idx": disk_used_idx,
                "bbox": zone_bbox
            })

        # If some disks have no paired zone, still return them with diameter 0.
        # This ensures frontend shows detected antibiotic disks even when no inhibition zone is found.
        for disk_idx, disk_data in enumerate(detected_disks):
            if disk_idx in used_disk_indices:
                continue

            disk_bbox = disk_data['bbox']
            medicine_name = f"Disk_{disk_idx + 1}"
            ocr_confidence = 0.0

            try:
                crop_640 = crop_and_pad_640(img, disk_bbox)
                if len(crop_640.shape) == 3:
                    gray_crop = cv2.cvtColor(crop_640, cv2.COLOR_BGR2GRAY)
                else:
                    gray_crop = crop_640

                processed_crop = denoise_otsu(gray_crop)
                medicine_name, ocr_confidence, _ = extract_medicine_ocr(processed_crop)
                if medicine_name == "Unknown" or ocr_confidence < 0.3:
                    medicine_name = f"Disk_{disk_idx + 1}"
                    ocr_confidence = 0.0
            except Exception as e:
                print(f"[DEBUG] Disk-only OCR failed for disk {disk_idx + 1}: {e}")

            results_with_medicine.append({
                "medicine_name": medicine_name,
                "diameter_mm": 0.0,
                "ocr_confidence": ocr_confidence,
                "yolo_confidence": round(disk_data['confidence'], 3),
                "disk_used_idx": disk_idx,
                "bbox": disk_bbox
            })
            print(f"[DEBUG] Added disk-only result for disk {disk_idx + 1} with diameter=0.0")
        
        print(f"\n[DEBUG] Total final results: {len(results_with_medicine)}")
        return results_with_medicine
    
    except Exception as e:
        print(f"Error during analysis: {e}")
        import traceback
        traceback.print_exc()
        return detected_zones


def draw_detections_on_image(image_path: str, detected_zones: list, output_dir: str = "uploaded_images"):
    """
    Draw bounding boxes and labels on the image for visualization.
    - Antibiotic disks: GREEN rectangles (สำหรับ OCR medicine name)
    - Inhibition zones: BLUE rectangles (สำหรับการวัดเส้นผ่านศูนย์กลาง)
    
    Args:
        image_path: Path to original image
        detected_zones: List of detected zones with bbox and medicine_name
        output_dir: Directory to save visualization image
    
    Returns:
        URL path to the visualization image
    """
    try:
        print("[DEBUG] Drawing detections on image...")
        
        # Load original image
        img = cv2.imread(image_path)
        if img is None:
            print(f"Error: Could not read image from {image_path}")
            return None
        
        img_height, img_width = img.shape[:2]
        print(f"[DEBUG] Image size: {img_width}x{img_height}")
        
        # Draw each detected zone
        for i, zone in enumerate(detected_zones):
            bbox = zone.get('bbox', [])
            medicine_name = zone.get('medicine_name', 'Unknown')
            diameter = zone.get('diameter_mm', 0)
            ocr_conf = zone.get('ocr_confidence', 0)
            yolo_conf = zone.get('yolo_confidence', 0)
            disk_idx = zone.get('disk_used_idx', -1)
            
            if not bbox or len(bbox) < 4:
                continue
            
            x1, y1, x2, y2 = bbox
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
            
            # Draw zone bounding box (BLUE for inhibition zones)
            cv2.rectangle(img, (x1, y1), (x2, y2), (255, 0, 0), 3)  # BGR: Blue
            
            # Draw circle at center with radius = half of width
            center_x = (x1 + x2) // 2
            center_y = (y1 + y2) // 2
            radius = (x2 - x1) // 2
            cv2.circle(img, (center_x, center_y), radius, (0, 255, 255), 2)  # Cyan circle
            
            # Draw label with medicine name and size
            label = f"{medicine_name} {diameter}mm"
            label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
            
            # Background for text (Blue background for zone label)
            cv2.rectangle(img, (x1, y1 - 35), (x1 + label_size[0] + 10, y1), (255, 0, 0), -1)
            
            # Text - white color
            cv2.putText(img, label, (x1 + 5, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            
            # Confidence info below bbox
            conf_text = f"Disk#{disk_idx+1} YOLO:{yolo_conf:.2f} OCR:{ocr_conf:.2f}"
            cv2.putText(img, conf_text, (x1, y2 + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)
            
            print(f"[DEBUG] Drew zone {i+1}: {medicine_name} at ({x1},{y1}) to ({x2},{y2})")
        
        # Save visualization image
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"detection_result_{timestamp}_{uuid.uuid4().hex[:8]}.jpg"
        output_path = os.path.join(output_dir, output_filename)
        
        success = cv2.imwrite(output_path, img)
        if success:
            print(f"[DEBUG] Saved visualization to {output_path}")
            return f"/uploaded_images/{output_filename}"
        else:
            print(f"Error: Failed to save visualization image")
            return None
    
    except Exception as e:
        print(f"Error during visualization: {e}")
        import traceback
        traceback.print_exc()
        return None
