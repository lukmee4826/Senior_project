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

    return sharpen

def combine_preprocessing(img, white=200):
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

    h, w, _ = crop.shape


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