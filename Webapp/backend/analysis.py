from ultralytics import YOLO
import cv2
import numpy as np
import os

# Load the model
# Ensure the path is correct relative to where this script is run or uses absolute path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "yolo_best.pt")

try:
    model = YOLO(MODEL_PATH)
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

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
    Analyze the disk image using YOLO model to detect inhibition zones.
    Returns detected zones with class information, confidence, and diameter.
    """
    
    detected_zones = []

    if not model:
        print("Error: Model failed to load")
        return detected_zones

    try:
        # Load image to get dimensions for pixel-to-mm conversion
        img = cv2.imread(image_path)
        if img is None:
            print(f"Error: Could not read image from {image_path}")
            return detected_zones
        
        image_height, image_width = img.shape[:2]
        
        # Run YOLO inference
        results = model(image_path, conf=0.25)
        
        # Process results
        if results and len(results) > 0:
            result = results[0]
            
            # Check if detections exist
            if result.boxes is not None and len(result.boxes) > 0:
                boxes = result.boxes
                
                for i, box in enumerate(boxes):
                    # Get bounding box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    bbox = [float(x1), float(y1), float(x2), float(y2)]
                    
                    # Get confidence score
                    confidence = float(box.conf[0].cpu().numpy())
                    
                    # Get class information
                    class_id = int(box.cls[0].cpu().numpy())
                    class_name = result.names[class_id] if class_id in result.names else f"Class_{class_id}"
                    
                    # Calculate diameter in mm (adjust pixels_per_mm based on your calibration)
                    diameter_mm = calculate_diameter_mm(bbox, image_width, pixels_per_mm=10)
                    
                    detected_zones.append({
                        "class_id": class_id,
                        "class_name": class_name,
                        "confidence": round(confidence, 3),
                        "diameter_mm": round(diameter_mm, 2),
                        "bbox": bbox
                    })
        
        return detected_zones
    
    except Exception as e:
        print(f"Error during analysis: {e}")
        return detected_zones
