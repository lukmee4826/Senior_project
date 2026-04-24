from ultralytics import YOLO
import cv2
import numpy as np
import os
import easyocr
import re
from skimage import filters
import uuid
from datetime import datetime
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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

# Configure Gemini
GEMINI_API_KEY = os.getenv("GOOGLE_VISION_API_KEY")
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('gemini-2.0-flash')
    except Exception as e:
        print(f"Error configuring Gemini: {e}")
        gemini_model = None
else:
    gemini_model = None

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
    """Adjust confidence based on regex match for medicine name + dosage."""
    if text is None or text.strip() == "":
        return 0.0
    
    text_clean = text.strip()
    lenient_pattern = re.compile(r'^[A-Za-z]+(?:\s+\d+(?:\.\d+)?)?(?:\s*[a-zA-Z]*)?$')
    
    if lenient_pattern.match(text_clean):
        return conf
    
    if re.match(r'^[A-Za-z\s]+$', text_clean):
        return max(0.0, conf - 0.05)
    
    if len(text_clean) >= 2 and re.search(r'[A-Za-z0-9]', text_clean):
        return max(0.0, conf - penalty)
    
    return 0.0

def extract_medicine_gemini(image_gray):
    """
    Primary OCR: Use Gemini AI for high-accuracy medicine code extraction.
    """
    if not gemini_model:
        return None, 0.0

    try:
        _, buffer = cv2.imencode('.jpg', image_gray)
        img_bytes = buffer.tobytes()

        prompt = "Read the short alphanumeric code on this antibiotic disk (e.g., OX 1, AMX 25, CN 10). Respond ONLY with the code."
        
        response = gemini_model.generate_content([
            prompt,
            {"mime_type": "image/jpeg", "data": img_bytes}
        ])
        
        full_text = response.text.strip()
        if not full_text:
            return "Unknown", 0.0

        if PATTERN.match(full_text):
            return full_text, 0.98
        
        return full_text, 0.90

    except Exception as e:
        print(f"[DEBUG OCR] Gemini API failed or limit reached: {e}")
        return None, 0.0

def extract_medicine_ocr(image_gray):
    """
    Hybrid OCR Switcher: Try Gemini first, Fallback to EasyOCR.
    """
    # 1. Try Gemini
    print(f"[DEBUG OCR] Attempting Gemini OCR...")
    medicine_name, confidence = extract_medicine_gemini(image_gray)
    
    if medicine_name and confidence > 0.5:
        print(f"[DEBUG OCR] ✓ Gemini Success: '{medicine_name}' (conf: {confidence})")
        return medicine_name, confidence, 0

    # 2. Fallback to EasyOCR
    print(f"[DEBUG OCR] ⚠️ Falling back to Local EasyOCR...")
    if ocr_reader is None:
        return "Unknown", 0.0, 0
    
    best_text = "Unknown"
    best_conf = 0.0
    best_angle = 0
    
    angles = list(range(-180, 180, 15))
    
    for angle in angles:
        rotated = rotate_image(image_gray, angle)
        try:
            result = ocr_reader.readtext(rotated, allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.', detail=1)
            texts = [t for _, t, _ in result]
            confs = [c for _, _, c in result]
            display_text = " ".join(texts) if texts else ""
            avg_conf = np.mean(confs) if confs else 0.0
            adj_conf = adjust_confidence_with_regex(display_text, avg_conf, penalty=0.10)
            
            if adj_conf > best_conf:
                best_conf = adj_conf
                best_text = display_text
                best_angle = angle
        except:
            continue
            
    if best_conf < 0.10 or best_text.strip() == "":
        best_text = "Unknown"
        best_conf = 0.0
    
    return best_text, round(best_conf, 3), best_angle

def calculate_diameter_mm(bbox, image_width_px, pixels_per_mm=10):
    """Calculate diameter using hybrid geometric approach."""
    x1, y1, x2, y2 = bbox
    width_px = x2 - x1
    height_px = y2 - y1
    d_diam = (width_px + height_px) / 2
    d_area = 2 * np.sqrt((width_px * height_px) / np.pi)
    avg_size_px = (d_diam + d_area) / 2
    return avg_size_px / pixels_per_mm

def analyze_disk_image(image_path: str):
    detected_zones = []
    detected_disks = []
    if not model: return detected_zones

    try:
        img = cv2.imread(image_path)
        if img is None: return detected_zones
        image_height, image_width = img.shape[:2]
        results = model(image_path, conf=0.1)
        
        if results and len(results) > 0:
            result = results[0]
            if result.boxes is not None:
                for box in result.boxes:
                    class_id = int(box.cls[0].cpu().numpy())
                    class_name = result.names[class_id]
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    bbox = [float(x1), float(y1), float(x2), float(y2)]
                    conf = float(box.conf[0].cpu().numpy())
                    
                    if class_name.lower() == "antibiotic":
                        detected_disks.append({"bbox": bbox, "confidence": conf})
                    elif class_name.lower() in ["disk_zone", "disk-zone"]:
                        detected_zones.append({"bbox": bbox, "confidence": conf})

        results_with_medicine = []
        used_disk_indices = set()
        
        for zone_idx, zone_data in enumerate(detected_zones):
            zone_bbox = zone_data['bbox']
            current_pixels_per_mm = PIXELS_PER_MM
            medicine_name = "Unknown"
            ocr_conf = 0.0
            disk_used_idx = -1
            
            if detected_disks:
                min_dist = float('inf')
                nearest_idx = -1
                zx = (zone_bbox[0] + zone_bbox[2]) / 2
                zy = (zone_bbox[1] + zone_bbox[3]) / 2
                
                for idx, disk in enumerate(detected_disks):
                    dx = (disk['bbox'][0] + disk['bbox'][2]) / 2
                    dy = (disk['bbox'][1] + disk['bbox'][3]) / 2
                    dist = np.sqrt((zx - dx)**2 + (zy - dy)**2)
                    if dist < min_dist:
                        min_dist = dist
                        nearest_idx = idx
                
                if nearest_idx >= 0:
                    disk_bbox = detected_disks[nearest_idx]['bbox']
                    disk_used_idx = nearest_idx
                    used_disk_indices.add(nearest_idx)
                    disk_avg_px = ((disk_bbox[2] - disk_bbox[0]) + (disk_bbox[3] - disk_bbox[1])) / 2
                    if disk_avg_px > 0:
                        current_pixels_per_mm = disk_avg_px / 6.35
                    
                    crop_640 = crop_and_pad_640(img, disk_bbox)
                    gray_crop = cv2.cvtColor(crop_640, cv2.COLOR_BGR2GRAY) if len(crop_640.shape) == 3 else crop_640
                    processed_crop = denoise_otsu(gray_crop)
                    medicine_name, ocr_conf, _ = extract_medicine_ocr(processed_crop)
                    
                    if medicine_name == "Unknown" or ocr_conf < 0.3:
                        medicine_name = f"Disk_{nearest_idx + 1}"
                        ocr_conf = 0.0
            else:
                medicine_name = "Unknown_Disk"
            
            diameter_mm = calculate_diameter_mm(zone_bbox, image_width, pixels_per_mm=current_pixels_per_mm)
            results_with_medicine.append({
                "medicine_name": medicine_name,
                "diameter_mm": round(diameter_mm, 2),
                "ocr_confidence": ocr_conf,
                "yolo_confidence": round(zone_data['confidence'], 3),
                "disk_used_idx": disk_used_idx,
                "bbox": zone_bbox
            })

        for idx, disk in enumerate(detected_disks):
            if idx not in used_disk_indices:
                crop_640 = crop_and_pad_640(img, disk['bbox'])
                gray_crop = cv2.cvtColor(crop_640, cv2.COLOR_BGR2GRAY) if len(crop_640.shape) == 3 else crop_640
                processed_crop = denoise_otsu(gray_crop)
                medicine_name, ocr_conf, _ = extract_medicine_ocr(processed_crop)
                if medicine_name == "Unknown" or ocr_conf < 0.3:
                    medicine_name = f"Disk_{idx + 1}"
                    ocr_conf = 0.0
                results_with_medicine.append({
                    "medicine_name": medicine_name,
                    "diameter_mm": 0.0,
                    "ocr_confidence": ocr_conf,
                    "yolo_confidence": round(disk['confidence'], 3),
                    "disk_used_idx": idx,
                    "bbox": disk['bbox']
                })
        return results_with_medicine
    except Exception as e:
        print(f"Error during analysis: {e}")
        return detected_zones

def draw_detections_on_image(image_path: str, detected_zones: list, output_dir: str = "uploaded_images"):
    try:
        img = cv2.imread(image_path)
        if img is None: return None
        for zone in detected_zones:
            bbox = zone.get('bbox', [])
            if not bbox or len(bbox) < 4: continue
            x1, y1, x2, y2 = map(int, bbox)
            cv2.rectangle(img, (x1, y1), (x2, y2), (255, 0, 0), 3)
            center_x, center_y = (x1 + x2) // 2, (y1 + y2) // 2
            radius = (x2 - x1) // 2
            cv2.circle(img, (center_x, center_y), radius, (0, 255, 255), 2)
            label = f"{zone.get('medicine_name', 'Unknown')} {zone.get('diameter_mm', 0)}mm"
            label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
            cv2.rectangle(img, (x1, y1 - 35), (x1 + label_size[0] + 10, y1), (255, 0, 0), -1)
            cv2.putText(img, label, (x1 + 5, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        
        output_filename = f"detection_result_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.jpg"
        output_path = os.path.join(output_dir, output_filename)
        if cv2.imwrite(output_path, img):
            return f"/uploaded_images/{output_filename}"
        return None
    except:
        return None
