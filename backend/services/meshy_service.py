import requests
from core.config import settings

MESHY_BASE_URL = "https://api.meshy.ai/openapi/v1"

def get_headers():
    if not settings.MESHY_API_KEY:
        raise ValueError("MESHY_API_KEY is not configured")
    return {
        "Authorization": f"Bearer {settings.MESHY_API_KEY}",
        "Content-Type": "application/json"
    }

def generate_3d_model_task(image_url: str) -> str:
    """
    Submits an image-to-3D task to Meshy API.
    Returns the task_id.
    """
    headers = get_headers()
    
    # We use "smart-topology" as it generates optimized and cleaner mesh models for Web/Mobile
    payload = {
        "image_url": image_url,
        "model_type": "smart-topology"
    }
    
    print(f"Submitting Image-to-3D task to Meshy for: {image_url}")
    response = requests.post(f"{MESHY_BASE_URL}/image-to-3d", headers=headers, json=payload)
    response.raise_for_status()
    
    data = response.json()
    # The response can return the task object containing the "id"
    task_id = data.get("id") or data.get("result")
    if not task_id:
        raise Exception(f"Meshy task creation failed, response: {data}")
        
    print(f"Meshy 3D generation started successfully. Task ID: {task_id}")
    return task_id

def check_3d_model_status(task_id: str) -> dict:
    """
    Checks the status of a Meshy task.
    Returns a dict: {"status": "running"|"success"|"failed", "model_url": "..."}
    """
    headers = get_headers()
    response = requests.get(f"{MESHY_BASE_URL}/image-to-3d/{task_id}", headers=headers)
    response.raise_for_status()
        
    data = response.json()
    status = data.get("status")
    
    result = {"status": "running", "model_url": None}
    
    if status == "SUCCEEDED":
        # Extract the model URL (Meshy provides a dictionary 'model_urls' containing 'glb')
        model_urls = data.get("model_urls", {})
        glb_url = model_urls.get("glb")
        if glb_url:
            result["status"] = "success"
            result["model_url"] = glb_url
        else:
            result["status"] = "failed"
            print(f"Meshy task succeeded but GLB url was not found in: {data}")
    elif status == "FAILED":
        result["status"] = "failed"
        print(f"Meshy task failed with error: {data.get('task_error')}")
    else:
        # PENDING, PROCESSING, etc.
        result["status"] = "running"
        
    return result

def resize_3d_model_task(input_task_id: str, resize_height_meters: float) -> str:
    """
    Submits a resize task to Meshy.
    Returns the task_id.
    """
    headers = get_headers()
    payload = {
        "input_task_id": input_task_id,
        "resize_height": resize_height_meters
    }
    print(f"Submitting Resize task to Meshy for: {input_task_id} with height {resize_height_meters}m")
    response = requests.post(f"{MESHY_BASE_URL}/resize", headers=headers, json=payload)
    response.raise_for_status()
    
    data = response.json()
    task_id = data.get("id") or data.get("result")
    if not task_id:
        raise Exception(f"Meshy resize task creation failed, response: {data}")
        
    print(f"Meshy Resize task started successfully. Task ID: {task_id}")
    return task_id

def check_resize_status(task_id: str) -> dict:
    """
    Checks the status of a Meshy resize task.
    Returns a dict: {"status": "running"|"success"|"failed", "model_url": "..."}
    """
    headers = get_headers()
    response = requests.get(f"{MESHY_BASE_URL}/resize/{task_id}", headers=headers)
    response.raise_for_status()
        
    data = response.json()
    status = data.get("status")
    
    result = {"status": "running", "model_url": None}
    
    if status == "SUCCEEDED":
        model_urls = data.get("model_urls", {})
        glb_url = model_urls.get("glb")
        if glb_url:
            result["status"] = "success"
            result["model_url"] = glb_url
        else:
            result["status"] = "failed"
            print(f"Meshy resize task succeeded but GLB url was not found in: {data}")
    elif status == "FAILED":
        result["status"] = "failed"
        print(f"Meshy resize task failed with error: {data.get('task_error')}")
    else:
        result["status"] = "running"
        
    return result

