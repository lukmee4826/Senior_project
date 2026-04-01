import cv2
import re
import numpy as np
import matplotlib.pyplot as plt
from skimage import filters
from sklearn.cluster import KMeans

def adaptive_binarization(img):
    binary = cv2.adaptiveThreshold(
        img,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11,
        2
    )
    return binary

def sauvola_binarization(img, window_size=25, k=0.1):
    th = filters.threshold_sauvola(img, window_size=window_size, k=k)
    binary = img > th
    return binary

def global_threshold(img, white=200):
    _, thresh = cv2.threshold(img, white, 255, cv2.THRESH_BINARY)
    return thresh

def histogram_equalization(img):
    equalized = cv2.equalizeHist(img)
    return equalized

def sharpening(img):
    kernel = np.array([[-0.5,-0.5,-0.5], 
                       [-0.5,5,-0.5],
                       [-0.5,-0.5,-0.5]])
    sharpen = cv2.filter2D(img, -1, kernel)
    sharpen = np.clip(sharpen, 0, 255).astype(np.uint8)

    return sharpen

def otsu(gray):
    """Otsu global thresholding - auto-finds best threshold"""
    _, processed = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return processed

def adaptive(gray):
    """Adaptive thresholding - handles uneven illumination"""
    processed = cv2.adaptiveThreshold(
        gray,
        maxValue=255,
        adaptiveMethod=cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        thresholdType=cv2.THRESH_BINARY,
        blockSize=31,   # neighbourhood size (must be odd), tune this
        C=10            # constant subtracted from mean, tune this
    )
    return processed

def denoise_otsu(gray):
    # 1. CLAHE normalize แสง
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)

    # 2. Sharpen ก่อน — ดึงขอบตัวอักษรออกมาจากภาพเบลอ
    sharpened = sharpening(gray)

    # 2. Blur
    blurred = cv2.GaussianBlur(sharpened, (3, 3), 0)

    # 3. Otsu
    _, processed = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # 4. วัด stroke width → ตัดสินใจ dilate หรือ erode
    inverted = cv2.bitwise_not(processed)
    text_pixel_ratio = np.sum(inverted == 255) / inverted.size  # สัดส่วนพิกเซลดำ

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))

    if text_pixel_ratio < 0.15:
        # ตัวหนังสือบาง → หนาขึ้น (เคส CN 10)
        processed_fix = cv2.dilate(inverted, kernel, iterations=1)
    elif text_pixel_ratio > 0.35:
        # ตัวหนังสือหนาเกิน → บางลง (เคส ATM 30)
        processed_fix = cv2.erode(inverted, kernel, iterations=1)
    else:
        # ปกติ → ไม่ต้องทำอะไร
        processed_fix = inverted

    # 5. Invert กลับ
    result = cv2.bitwise_not(processed_fix)
    return result

def oldest_denoise_otsu(gray):
    """Denoise first, then Otsu — often best for OCR"""
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, processed = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return processed

def old_denoise_otsu(gray):
    # 1. Denoise
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)  # ลด kernel (5→3) เพื่อรักษาเส้นบาง

    # 2. Otsu threshold
    _, processed = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # 3. Invert ถ้าตัวหนังสือเป็นสีดำบนขาว → ต้องขาวบนดำก่อน dilate
    inverted = cv2.bitwise_not(processed)

    # 4. Dilate → หนาเส้นตัวอักษรขึ้น ช่วยให้ N ไม่หาย
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    dilated = cv2.dilate(inverted, kernel, iterations=1)

    # 5. Invert กลับ → ตัวหนังสือดำบนขาวเหมือนเดิม
    result = cv2.bitwise_not(dilated)

    return result

def hist_global(img, white=200):
    img1 = histogram_equalization(img)
    img2 = global_threshold(img1, white)
    return img2

def rotate_image(img, angle):
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


def crop_and_pad_640(img, box, target=640):
    x_min, y_min, x_max, y_max = box.astype(int)

    # ป้องกันพิกัดหลุดขอบภาพ
    x_min = max(0, x_min)
    y_min = max(0, y_min)
    x_max = min(img.shape[1], x_max)
    y_max = min(img.shape[0], y_max)

    # crop ROI จากภาพต้นฉบับ
    crop = img[y_min:y_max, x_min:x_max]

    if crop.ndim == 3:
        h, w, _ = crop.shape
    else:
        h, w = crop.shape


    square_size = min(h, w) # ด้านที่สั้นที่สุด

    # center crop ให้เป็น square
    y_start = (h - square_size) // 2
    x_start = (w - square_size) // 2

    square = crop[
        y_start:y_start + square_size,
        x_start:x_start + square_size
    ]

    # resize เป็น 640x640
    square_640 = cv2.resize(square, (target, target))

    return square_640


PATTERN = re.compile(
    r'^([A-Za-z]+(?:\s[A-Za-z]+){0,3})\s+(\d+(?:\.\d+)?)$'
)

def adjust_confidence_with_regex(text, conf, penalty=0.3):
    """
    ถ้า text ไม่ตรง regex → ลด confidence ลง penalty
    """
    if text is None:
        return max(0.0, conf - penalty)

    if PATTERN.match(text.strip()):
        return conf  # ผ่าน regex
    else:
        return max(0.0, conf - penalty)