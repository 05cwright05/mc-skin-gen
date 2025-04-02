import firebase_functions
from firebase_functions import https_fn
# The Firebase Admin SDK to access Cloud Firestore.
import firebase_admin
from firebase_admin import credentials, initialize_app, firestore
import requests
import io
import time
from PIL import Image
from huggingface_hub import get_inference_endpoint
import uuid
import base64
from datetime import datetime, timedelta, timezone

from firebase_functions import firestore_fn

# Load the service account key JSON file
cred = credentials.Certificate("./key.json")  # Ensure the correct path
app = initialize_app(cred)
db = firestore.client()

ENDPOINT_NAME = "minecraft-skin-generator-sdx-wdr"
API_URL = "https://hxjz4aq5n6xetck2.us-east-1.aws.endpoints.huggingface.cloud"
with open("./hf_token.txt", "r") as file:
    token = file.read().strip()
headers = {
"Accept": "image/png",
"Authorization": f"Bearer {token}",
"Content-Type": "application/json" 
}

def increment_active_requests():
    counter_ref = db.collection("counters").document("active_requests")

    # Firestore increment operation
    counter_ref.set({"count": firestore.Increment(1)}, merge=True)

def wake_up_endpoint():
    """Wake up the endpoint by checking its status and waiting if necessary"""

    try:
        print(f"Checking endpoint '{ENDPOINT_NAME}' status...")
        endpoint = get_inference_endpoint(ENDPOINT_NAME, token=token)
        
        # If the endpoint is already running, no need to wait
        if endpoint.status == "running":
            print(f"Endpoint '{ENDPOINT_NAME}' is already running.")
            return True
        print(f"END POINT STATUS {endpoint.status}")
            
        # If the endpoint is scaled to zero or initializing, we need to wake it up
        if endpoint.status in ["scaled_to_zero", "initializing", "pending", "scaledToZero"]:
            print(f"Endpoint is {endpoint.status}. Waking it up...")
            
            # Send a simple health check request to trigger scaling
            try:
                # Some endpoints have a /health route
                health_url = f"{API_URL}/health"
                requests.get(health_url, headers={"Authorization": headers["Authorization"]}, timeout=2)
            except requests.exceptions.RequestException:
                # If health check fails, try with a minimal payload
                try:
                    minimal_payload = {"inputs": "test"}
                    requests.post(API_URL, headers=headers, json=minimal_payload, timeout=2)
                except requests.exceptions.RequestException:
                    # It's ok if this fails, we just want to trigger the wake-up
                    pass
            
            # Wait for the endpoint to be ready
            max_attempts = 25
            wait_time = 15  # seconds between checks
            for attempt in range(max_attempts):
                print(f"Waiting for endpoint to wake up... (attempt {attempt+1}/{max_attempts})")
                endpoint.fetch()
                if endpoint.status == "running":
                    print(f"Endpoint '{ENDPOINT_NAME}' is now running!")
                    return True
                time.sleep(wait_time)
                
            print(f"Endpoint didn't wake up after {max_attempts * wait_time} seconds.")
            return False
            
        print(f"Endpoint is in state '{endpoint.status}' which may indicate an issue.")
        return False
        
    except Exception as e:
        print(f"Error checking endpoint status: {e}")
        return False

def query_hf(payload, max_retries=5, retry_delay=5):
    wake_up_endpoint()
     
    # Then try the actual query with retries
    for attempt in range(max_retries):
        try:
            print(f"Sending request to endpoint (attempt {attempt+1}/{max_retries})...")
            response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
            
            if response.status_code == 200:
                print("Request successful!")
                return response.content
                
            # For certain status codes, we should retry
            if response.status_code in [429, 500, 502, 503, 504]:
                print(f"Received status code {response.status_code}, retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                continue
                
            # For other status codes, just return the error
            print(f"Request failed with status code {response.status_code}: {response.text}")
            return None
            
        except requests.exceptions.RequestException as e:
            print(f"Request error: {e}")
            if attempt < max_retries - 1:
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                print("Maximum retries reached. The endpoint may still be waking up.")
                return None

    return None

def decrement_active_requests():
    counter_ref = db.collection("counters").document("active_requests")

    # Decrement the counter
    counter_ref.set({"count": firestore.Increment(-1)}, merge=True)

    # Get the latest count
    doc = counter_ref.get()
    total_count = doc.to_dict().get("count", 0) if doc.exists else 0

    # Shut down ML model if no active requests
    if total_count == 0:
        scale_to_zero()


def scale_to_zero():
    """Scale the inference endpoint to zero to save costs"""
    try:
        endpoint = get_inference_endpoint(ENDPOINT_NAME, token=token)
        if endpoint.status == "running":
            print(f"Scaling endpoint '{ENDPOINT_NAME}' to zero...")
            endpoint.scale_to_zero()
            print(f"Endpoint '{ENDPOINT_NAME}' scaled to zero successfully.")
        return True
    except Exception as e:
        print(f"Error scaling endpoint to zero: {e}")
        return False
    
# In a separate function that triggers on Firestore writes
@firestore_fn.on_document_created(
    document="image_processing_queue/{jobId}",  # <-- Use keyword argument
    region="us-central1",  # Required: specify your region
    timeout_sec=400
)
def process_image_background(event: firestore_fn.Event[firestore_fn.DocumentSnapshot]) -> None:
    job_id = event.params['jobId']
    
    # Get the job details
    job_ref = db.collection('image_jobs').document(job_id)
    job = job_ref.get().to_dict()
    
    try:
        # Process the image
        output = query_hf({
            "inputs": job['prompt'],
            "parameters": {}
        })
        
        # Update the job with results
        job_ref.update({
            'status': 'completed',
            'completedAt': firestore.SERVER_TIMESTAMP,
            'result': output
        })
        
        # Remove from queue
        db.collection('image_processing_queue').document(job_id).delete()
        print("SENT AN EMAIL")
        #send an email to user
    except Exception as e:
        # Handle errors
        job_ref.update({
            'status': 'error',
            'error': str(e),
            'completedAt': firestore.SERVER_TIMESTAMP
        })
    finally:
        decrement_active_requests()
    
@https_fn.on_call()
def upload_image(req: https_fn.CallableRequest) -> any:
    increment_active_requests()
    
    # Get user info from request
    user_id = req.data.get('userId')
    input_prompt = req.data.get('prompt', 'A man with sunglasses')
    
    # Create a job document in Firestore
    job_ref = db.collection('image_jobs').document()
    job_ref.set({
        'userId': user_id,
        'prompt': input_prompt,
        'status': 'processing',
        'createdAt': firestore.SERVER_TIMESTAMP,
        'completedAt': None,
        'result': None
    })
    
    # Trigger the background process (separate function)
    db.collection('image_processing_queue').document(job_ref.id).set({
        'jobId': job_ref.id,
        'createdAt': firestore.SERVER_TIMESTAMP
    })
    
    return "SUCCESSULLY UPLOADED AND SHI"

        