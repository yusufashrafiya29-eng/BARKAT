import os
import requests
import time
from dotenv import load_dotenv

load_dotenv()

TRIPO_API_KEY = os.getenv("TRIPO_API_KEY")
print(f"Loaded Key: {TRIPO_API_KEY[:5]}...")

headers = {
    "Authorization": f"Bearer {TRIPO_API_KEY}",
    "Content-Type": "application/json"
}

# 1. Try starting a task with direct URL
test_image_url = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1500&auto=format&fit=crop"

print("\n--- Testing Task Creation (URL) ---")
payload = {
    "type": "image_to_model",
    "file": {
        "type": "jpg",
        "url": test_image_url
    }
}
response = requests.post("https://api.tripo3d.ai/v2/openapi/task", headers=headers, json=payload)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code != 200:
    print("\nTrying alternative payload...")
    payload_alt = {
        "type": "image_to_model",
        "url": test_image_url
    }
    response2 = requests.post("https://api.tripo3d.ai/v2/openapi/task", headers=headers, json=payload_alt)
    print(f"Alt Status: {response2.status_code}")
    print(f"Alt Response: {response2.text}")
