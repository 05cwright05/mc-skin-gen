import firebase_functions
from firebase_functions import https_fn
# The Firebase Admin SDK to access Cloud Firestore.
import firebase_admin
from firebase_admin import credentials, initialize_app, firestore


import uuid
import base64
from datetime import datetime, timedelta, timezone

# Load the service account key JSON file
cred = credentials.Certificate("./key.json")  # Ensure the correct path
app = initialize_app(cred)


@https_fn.on_call()
def upload_image(req: https_fn.CallableRequest) -> any:
    return "pp"
        