import requests
import os

def test_multipart_upload():
    url = "http://127.0.0.1:8000/api/v1/auth/signup/owner"
    
    # Create a dummy image file
    with open("test_logo.png", "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xff\xff?\x00\x05\xfe\x02\xfe\xdcG\xe1\x04\x00\x00\x00\x00IEND\xaeB`\x82")

    payload = {
        "email": "test_logo_upload@example.com",
        "password": "password123",
        "full_name": "Test Logo User",
        "phone_number": "9876543210",
        "restaurant_name": "Logo Test Restaurant"
    }
    
    files = {
        "logo": ("test_logo.png", open("test_logo.png", "rb"), "image/png")
    }

    try:
        print(f"Sending multipart/form-data request to {url}...")
        response = requests.post(url, data=payload, files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if os.path.exists("test_logo.png"):
            os.remove("test_logo.png")

if __name__ == "__main__":
    test_multipart_upload()
