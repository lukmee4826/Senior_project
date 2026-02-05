import requests
import os

# Adjust this path if needed to point to a valid image
IMAGE_PATH = r"c:\code\git\Senior_project\1on1\20250919_033735159_iOS.jpg"
URL = "http://127.0.0.1:8000/analyze"

def test_analyze():
    if not os.path.exists(IMAGE_PATH):
        print(f"Error: Image not found at {IMAGE_PATH}")
        return

    try:
        with open(IMAGE_PATH, "rb") as f:
            files = {"file": f}
            print(f"Sending request to {URL}...")
            response = requests.post(URL, files=files)
        
        print(f"Status Code: {response.status_code}")
        try:
            print("Response JSON:")
            print(response.json())
        except:
            print("Response Text:")
            print(response.text)
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_analyze()
