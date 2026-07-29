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

def generate_3d_model_task(
    image_urls: list, 
    ai_model: str = "meshy-6", 
    enable_pbr: bool = True, 
    texture_resolution: str = "2k"
) -> str:
    """
    Submits a single-image or multi-image to 3D task to Meshy API.
    Returns a prefixed task ID: 'single_taskid' or 'multi_taskid'.
    """
    headers = get_headers()
    
    # Common texturing parameters
    # Note: 'de-lighting' is automatic on newer models, but we specify texturing parameters here
    params = {
        "ai_model": ai_model,
        "should_texture": True,
        "enable_pbr": enable_pbr,
        "texture_resolution": texture_resolution
    }

    if len(image_urls) > 1:
        # Submit to Multi-Image endpoint
        payload = {
            "image_urls": image_urls,
            **params
        }
        print(f"Submitting Multi-Image-to-3D task to Meshy for {len(image_urls)} images: {image_urls}")
        response = requests.post(f"{MESHY_BASE_URL}/multi-image-to-3d", headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        raw_id = data.get("id") or data.get("result")
        if not raw_id:
            raise Exception(f"Meshy multi-image task creation failed: {data}")
        task_id = f"multi_{raw_id}"
    else:
        # Submit to Single-Image endpoint
        payload = {
            "image_url": image_urls[0],
            **params
        }
        print(f"Submitting Single-Image-to-3D task to Meshy for: {image_urls[0]}")
        response = requests.post(f"{MESHY_BASE_URL}/image-to-3d", headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        raw_id = data.get("id") or data.get("result")
        if not raw_id:
            raise Exception(f"Meshy single-image task creation failed: {data}")
        task_id = f"single_{raw_id}"
        
    print(f"Meshy 3D generation started successfully. Task ID: {task_id}")
    return task_id

def check_3d_model_status(task_id: str) -> dict:
    """
    Checks the status of any Meshy task (single, multi, or resize) using its prefix.
    Returns a dict: {"status": "running"|"success"|"failed", "model_url": "..."}
    """
    headers = get_headers()
    
    # 1. Route to correct endpoint based on prefix
    if task_id.startswith("resize_"):
        raw_id = task_id.replace("resize_", "")
        url = f"{MESHY_BASE_URL}/resize/{raw_id}"
    elif task_id.startswith("multi_"):
        raw_id = task_id.replace("multi_", "")
        url = f"{MESHY_BASE_URL}/multi-image-to-3d/{raw_id}"
    else:
        raw_id = task_id.replace("single_", "")
        url = f"{MESHY_BASE_URL}/image-to-3d/{raw_id}"
        
    response = requests.get(url, headers=headers)
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
            print(f"Meshy task succeeded but GLB URL was not found in response: {data}")
    elif status == "FAILED":
        result["status"] = "failed"
        print(f"Meshy task {task_id} failed with error: {data.get('task_error')}")
    else:
        result["status"] = "running"
        
    return result

def resize_3d_model_task(input_task_id: str, resize_height_meters: float) -> str:
    """
    Submits a resize task to Meshy using a base task ID.
    Returns the task_id.
    """
    headers = get_headers()
    # Strip any prefixes before sending to Meshy
    raw_task_id = input_task_id.replace("single_", "").replace("multi_", "")
    
    payload = {
        "input_task_id": raw_task_id,
        "resize_height": resize_height_meters
    }
    print(f"Submitting Resize task to Meshy for: {raw_task_id} with height {resize_height_meters}m")
    response = requests.post(f"{MESHY_BASE_URL}/resize", headers=headers, json=payload)
    response.raise_for_status()
    
    data = response.json()
    raw_id = data.get("id") or data.get("result")
    if not raw_id:
        raise Exception(f"Meshy resize task creation failed, response: {data}")
        
    task_id = f"resize_{raw_id}"
    print(f"Meshy Resize task started successfully. Task ID: {task_id}")
    return task_id
