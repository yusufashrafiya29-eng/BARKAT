import requests
import json
import time
from core.config import settings

TRIPO_BASE_URL = "https://api.tripo3d.ai/v2/openapi"

def get_headers():
    if not settings.TRIPO_API_KEY:
        raise ValueError("TRIPO_API_KEY is not configured")
    return {
        "Authorization": f"Bearer {settings.TRIPO_API_KEY}",
        "Content-Type": "application/json"
    }

def upload_image_to_tripo(image_url: str) -> str:
    """
    Downloads an image from a URL and uploads it to Tripo3D to get a file_token.
    """
    try:
        # 1. Download image
        print(f"Downloading image from {image_url}...")
        img_response = requests.get(image_url)
        img_response.raise_for_status()
        
        # 2. Upload to Tripo
        print("Uploading image to Tripo3D...")
        upload_headers = {
            "Authorization": f"Bearer {settings.TRIPO_API_KEY}"
            # Content-Type is multipart/form-data, requests sets it automatically
        }
        
        files = {
            'file': ('image.jpg', img_response.content, 'image/jpeg')
        }
        
        response = requests.post(f"{TRIPO_BASE_URL}/upload", headers=upload_headers, files=files)
        response.raise_for_status()
        
        data = response.json()
        if data.get("code") == 0 and "data" in data and "image_token" in data["data"]:
            return data["data"]["image_token"]
        else:
            raise Exception(f"Tripo upload failed: {data}")
            
    except Exception as e:
        print(f"Tripo Upload Error: {e}")
        # Fallback: Many platforms allow passing URL directly in task payload.
        # We will return the URL as a fallback and let the task payload handle it.
        return image_url

def generate_3d_model_task(image_url: str) -> str:
    """
    Submits an image-to-3D task to Tripo3D API.
    Returns the task_id.
    """
    headers = get_headers()
    
    # In Tripo V2, we can usually just send the image token or file token
    file_token = upload_image_to_tripo(image_url)
    
    # Try with file_token payload
    payload = {
        "type": "image_to_model",
        "file": {
            "type": "jpg",
            "file_token": file_token
        }
    }
    
    # If the file_token is actually a URL (fallback), adjust payload
    if file_token.startswith("http"):
         payload = {
            "type": "image_to_model",
            "file": {
                "type": "jpg",
                "url": file_token
            }
        }

    response = requests.post(f"{TRIPO_BASE_URL}/task", headers=headers, json=payload)
    
    if response.status_code != 200:
        raise Exception(f"Failed to submit Tripo task: {response.text}")
        
    data = response.json()
    if data.get("code") == 0 and "data" in data and "task_id" in data["data"]:
        return data["data"]["task_id"]
    else:
        raise Exception(f"Tripo task creation failed: {data}")

def check_3d_model_status(task_id: str) -> dict:
    """
    Checks the status of a Tripo3D task.
    Returns a dict: {"status": "running"|"success"|"failed", "model_url": "..."}
    """
    headers = get_headers()
    
    response = requests.get(f"{TRIPO_BASE_URL}/task/{task_id}", headers=headers)
    if response.status_code != 200:
        raise Exception(f"Failed to check Tripo task status: {response.text}")
        
    data = response.json()
    if data.get("code") != 0:
        raise Exception(f"Tripo task status error: {data}")
        
    task_data = data.get("data", {})
    status = task_data.get("status")
    
    result = {"status": status, "model_url": None}
    
    if status == "success":
        # Extract the model URL (Tripo usually provides 'model' or 'pbr_model')
        output = task_data.get("output", {})
        model_url = output.get("pbr_model") or output.get("model")
        result["model_url"] = model_url
        
    return result
