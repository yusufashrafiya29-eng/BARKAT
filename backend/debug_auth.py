import requests

BASE_URL = "http://127.0.0.1:8002/api/v1/auth"

def test_signup():
    print("Testing Owner Signup...")
    payload = {
        "email": "test_owner_debug2@example.com",
        "password": "password123",
        "full_name": "Test Owner",
        "phone_number": "1234567890",
        "restaurant_name": "Debug Resto"
    }
    try:
        response = requests.post(f"{BASE_URL}/signup/owner", json=payload)
        print(f"Signup Status: {response.status_code}")
        print(f"Signup Response: {response.json()}")
        return payload["email"]
    except Exception as e:
        print(f"Signup Error: {e}")
        return None

def test_verify(email, otp):
    print(f"Testing Verify OTP for {email} with code {otp}...")
    try:
        response = requests.post(f"{BASE_URL}/verify-otp", json={"email": email, "otp_code": otp})
        print(f"Verify Status: {response.status_code}")
        print(f"Verify Response: {response.json()}")
    except Exception as e:
        print(f"Verify Error: {e}")

def test_login(email):
    print(f"Testing Login for {email}...")
    try:
        response = requests.post(f"{BASE_URL}/login", json={"email": email, "password": "password123"})
        print(f"Login Status: {response.status_code}")
        print(f"Login Response: {response.json()}")
    except Exception as e:
        print(f"Login Error: {e}")

if __name__ == "__main__":
    email = "test_owner_debug2@example.com"
    otp = "724954"
    test_verify(email, otp)
    test_login(email)

