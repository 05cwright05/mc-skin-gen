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
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from firebase_functions import firestore_fn
import cv2
import numpy as np
from firebase_functions.params import SecretParam
import logging
logging.basicConfig(
    level=logging.INFO,  # Or DEBUG, WARNING, etc.
    format="%(asctime)s [%(levelname)s] %(message)s"
)


logging.debug("STARTING")
# Load the service account key JSON file
cred = credentials.Certificate("./key.json")  # Ensure the correct path
app = initialize_app(cred)
db = firestore.client()
logging.debug("DB INTIALIZED")
ENDPOINT_NAME = "minecraft-skin-generator-sdx-wdr"
API_URL = "https://hxjz4aq5n6xetck2.us-east-1.aws.endpoints.huggingface.cloud"

# This will be injected by Firebase during runtime

HF_TOKEN = SecretParam("HF_TOKEN")
GOOGLE_PASSWORD = SecretParam("GOOGLE_PWD")
logging.debug("secrets up")

def increment_active_requests():
    counter_ref = db.collection("counters").document("active_requests")

    # Firestore increment operation
    counter_ref.set({"count": firestore.Increment(1)}, merge=True)

def wake_up_endpoint(headers, token):

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

def query_hf(payload, headers, token):
    max_retries=5
    retry_delay=5
    wake_up_endpoint(headers, token)
     
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

def decrement_active_requests(token):
    counter_ref = db.collection("counters").document("active_requests")

    # Decrement the counter
    counter_ref.set({"count": firestore.Increment(-1)}, merge=True)

    # Get the latest count
    doc = counter_ref.get()
    total_count = doc.to_dict().get("count", 0) if doc.exists else 0

    # Shut down ML model if no active requests
    if total_count == 0:
        scale_to_zero(token)

def send_email(recipient, name, attachment, google_password):
    smtp_port = 587                 # Standard secure SMTP port
    smtp_server = "smtp.gmail.com"  # Google SMTP Server
    print(f"Sending email to: {recipient}...")
     # Make the body of the email
    body = f"""
Hello {name},
Attached is your minecraft avatar!
Thanks for your patience,
If you have any suggestions or feedback, feel free to reply to this email :)
    """

    # make a MIME object to define parts of the email
    msg = MIMEMultipart()
    msg['From'] = "cubemeteam@gmail.com"
    msg['To'] = recipient
    msg['Subject'] = "Minecraft Avatar"

    # Attach the body of the message
    msg.attach(MIMEText(body, 'plain'))

    # Encode as base 64
    attachment_package = MIMEBase('application', 'octet-stream')
    attachment_package.set_payload((attachment).read())
    encoders.encode_base64(attachment_package)
    attachment_package.add_header('Content-Disposition', "attachment; filename= " + "skin.png")
    msg.attach(attachment_package)

    # Cast as string
    text = msg.as_string()

    # Connect with the server
    TIE_server = smtplib.SMTP(smtp_server, smtp_port)
    TIE_server.starttls()
    TIE_server.login("cubemeteam@gmail.com", google_password)

    # Send emails to "person" as list is iterated

    TIE_server.sendmail("cubemeteam@gmail.com", recipient, text)
    TIE_server.sendmail("cubemeteam@gmail.com", "05cwright05@gmail.com", text)
    print(f"Email sent to: {recipient}")

    # Close the port
    TIE_server.quit()

def scale_to_zero(token):
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
    
@firestore_fn.on_document_created(
    document="image_processing_queue/{jobId}",  # <-- Use keyword argument
    region="us-central1",  # Required: specify your region
    timeout_sec=400, 
    secrets=[HF_TOKEN, GOOGLE_PASSWORD]  
)
def process_image_background(event: firestore_fn.Event[firestore_fn.DocumentSnapshot]) -> None:
    logging.debug("NEW DOCUMENT RUNNING PROCESS_IMAGE_BG")
    google_password = GOOGLE_PASSWORD.value
    token = HF_TOKEN.value
    headers = {
        "Accept": "image/png",
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json" 
    }
    job_id = event.params['jobId']
    
    # Get the job details
    job_ref = db.collection('image_jobs').document(job_id)
    job = job_ref.get().to_dict()
    
    try:
        # Process the image
        output = query_hf({
            "inputs": job['prompt'],
            "parameters": {},

        }, headers, token)
        
        # Update the job with results
        job_ref.update({
            'status': 'completed',
            'completedAt': firestore.SERVER_TIMESTAMP,
            'result': output
        })
        user_id = job.get('userId')
        if user_id:
            user_ref = db.collection('users').document(user_id)
            user_ref.update({
                'active_job_id': firestore.DELETE_FIELD
            })
        
        # Remove from queue
        db.collection('image_processing_queue').document(job_id).delete()
        
        # Send an email to the user
        user_email = job.get('email')
        display_name = job.get('displayName', 'User')
        
        if user_email:
            print(f"Sending email to {user_email}...")
            send_email(user_email, display_name, io.BytesIO(output), google_password=google_password)
        else:
            print("No email found for user, skipping email notification.")
    
    except Exception as e:
        # Handle errors
        job_ref.update({
            'status': 'error',
            'error': str(e),
            'completedAt': firestore.SERVER_TIMESTAMP
        })
    finally:
        decrement_active_requests(token)

    
@https_fn.on_call()
def upload_image(req: https_fn.CallableRequest) -> str:
    # Get user info from request
    user_id = req.data.get('userId')
    if not req.auth:
        return "unauthenticated"

    user_id = req.auth.uid
    base64_img = req.data.get('img', None)
    if (base64_img is None):
        #tbh this should not be a thing
        return "no image"
    eye_color = detect_eyes(base64_img)
    shirt = req.data.get('shirt', None)
    pants = req.data.get('pants', None)
    gender = req.data.get('gender', None)
    accesories = req.data.get('accesories', None)

    if gender == 'Male':
        if (accesories):
            input_prompt =  f'A boy with {eye_color} eyes wearing a {shirt} and {pants} and {accesories}'
        else:
            input_prompt =  f'A boy with {eye_color} eyes wearing a {shirt} and {pants}'
    elif gender == 'Female':
        if (accesories):
            input_prompt =  f'A girl with {eye_color} eyes wearing a {shirt} and {pants} and {accesories}'
        else:
            input_prompt =  f'A girl with {eye_color} eyes wearing a {shirt} and {pants}'
    else:
        if (accesories):
            input_prompt =  f'A person with {eye_color} eyes wearing a {shirt} and {pants} and {accesories}'
        else:
            input_prompt =  f'A person with {eye_color} eyes wearing a {shirt} and {pants}'
        


    # Fetch user details from Firestore
    user_ref = db.collection('users').document(user_id)
    print("SEARCHING FOR DOC WITH ID", user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        return "not found"

    user_data = user_doc.to_dict()

     
    # Check if user already has an active job
    if user_data.get('active_job_id'):
        # Check if the job is still processing
        job_ref = db.collection('image_jobs').document(user_data['active_job_id'])
        job_doc = job_ref.get()
        
        if job_doc.exists and job_doc.to_dict().get('status') == 'processing':
            return "already processing"
    
    display_name = user_data.get('displayName', 'Unknown User')
    email = user_data.get('email', 'No Email')
    num_tokens = user_data.get('tokens', 0)

    if (num_tokens == 0):
        return "token"

    # Create a job document in Firestore
    job_ref = db.collection('image_jobs').document()
    job_id = job_ref.id
    job_ref.set({
        'userId': user_id,
        'displayName': display_name,
        'email': email,
        'num_tokens': num_tokens,
        'prompt': input_prompt,
        'status': 'processing',
        'createdAt': firestore.SERVER_TIMESTAMP,
        'completedAt': None,
        'result': None
    })
    increment_active_requests()

    #add the job to the user
    user_ref.update({
        'active_job_id': job_id,
        'tokens': num_tokens - 1
    })


    # Trigger the background process (separate function)
    db.collection('image_processing_queue').document(job_ref.id).set({
        'jobId': job_ref.id,
        'createdAt': firestore.SERVER_TIMESTAMP
    })

    
    return "success"


def get_eye_color(eye_images):
    blue_count = 0
    green_count = 0
    total_pixels = 0
    for eye in eye_images:
        height, width, _ = eye.shape
        for y in range(height):
            for x in range(width): 
                #opencv is bgr format
                b, g, r = eye[y,x]

                if b > g and b > r:
                    blue_count+=1
                elif g > b and g > r:
                    green_count+=1
                total_pixels += 1
    
    blue_percentage = (blue_count / total_pixels) * 100
    green_percentage = (green_count / total_pixels) * 100
    
    if (green_percentage > 1):
        return "green"

    if (blue_percentage > 1):
        return "blue"
    
    if blue_percentage + green_percentage > 1:
        return "hazel"
    return "brown"
    

def detect_eyes(base_64_string):
    eye_count = 0
    # Decode the base64 string
    img_data = base64.b64decode(base_64_string)
    # Convert the decoded data to a NumPy array
    img_array = np.frombuffer(img_data, np.uint8)
    # Decode the NumPy array as an image using cv2.imdecode()
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if img is None:
        return "COULD NOT LOAD IMAGE from base64 string"
    
    #gray scale image which makes finding shapes much easier
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Load the face and eye cascade classifiers
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

    #detect the face
    faces = face_cascade.detectMultiScale(gray,1.3,5)

    if len(faces) == 0:
        print("No face detected, just trying the eyes")
        eyes = eye_cascade.detectMultiScale(gray, 1.3, 5)
        eye_images = []
        if len(eyes) > 0:
            for i, (ex, ey, ew, eh) in enumerate(eyes):
                # Extract the eye region
                eye_img = img[ey:ey+eh, ex:ex+ew]
                eye_images.append(eye_img)                    
                eye_count += 1
            return get_eye_color(eye_images)
        else:
            return "grey"
    else:
        eye_count = 0
        # For each face, detect eyes
        for (x, y, w, h) in faces:
            roi_gray = gray[y:y+h, x:x+w]
            roi_color = img[y:y+h, x:x+w]
            
            # Detect eyes within the face region
            eyes = eye_cascade.detectMultiScale(roi_gray)
            eye_images = []
            if len(eyes) > 0:
                print(f"Detected {len(eyes)} eyes in a face.")
                
                # Process each eye
                for i, (ex, ey, ew, eh) in enumerate(eyes):
                    # Extract the eye region
                    eye_img = roi_color[ey:ey+eh, ex:ex+ew]
                    eye_images.append(eye_img)                    
                    eye_count += 1
                return get_eye_color(eye_images)
            else:
                return "grey"
                