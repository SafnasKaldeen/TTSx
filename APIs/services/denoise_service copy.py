import requests
import time
import os
import logging
import json

API_KEY = "YhYDsAMUjrupMW4xetJsTMpNi2gmoHKq"
UPLOAD_URL = "https://api.cleanvoice.ai/v2/upload"
EDIT_URL = "https://api.cleanvoice.ai/v2/edits"


def get_signed_upload_url(filename: str):
    """Generate a signed URL for uploading the audio file."""
    url = f"{UPLOAD_URL}?filename={filename}"
    headers = {"X-API-Key": API_KEY}

    response = requests.post(url, headers=headers)
    if response.status_code == 200:
        return response.json().get("signedUrl")
    else:
        print(f"Failed to get signed URL: {response.status_code}, {response.text}")
        return None


def upload_file_to_url(signed_url, file_path):
    """Uploads a file to the provided signed URL."""
    with open(file_path, "rb") as file:
        response = requests.put(signed_url, data=file)
        if response.status_code == 200:
            print("File uploaded successfully.")
        else:
            print(f"Failed to upload file. Status code: {response.status_code}, Response: {response.text}")
        return response


def clean_audio(file_url, remove_noise=True, normalize=True, export_format="wav", summarize=True):
    """Cleans the audio using CleanVoice API."""
    data = {
        "input": {
            "files": [file_url],
            "config": {
                "remove_noise": remove_noise,
                "normalize": normalize,
                "export_format": export_format,
                "summarize": summarize
            }
        }
    }
    headers = {"X-API-Key": API_KEY, "Content-Type": "application/json"}
    response = requests.post(EDIT_URL, json=data, headers=headers)

    if response.status_code == 200:
        print("Audio cleaned successfully!")
        return response.json()  # Return the cleaned result
    else:
        print(f"Failed to clean audio. Status: {response.status_code}, {response.text}")
        return None


def download_cleaned_audio(edit_id):
    """Downloads the cleaned audio using the edit ID."""
    url = f"{EDIT_URL}/{edit_id}"
    headers = {"X-Api-Key": API_KEY}
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json()
        download_url = data["result"].get("download_url")
        if download_url:
            file_response = requests.get(download_url)
            if file_response.status_code == 200:
                download_path = "/Audios/cleaned_audio.wav"
                os.makedirs(os.path.dirname(download_path), exist_ok=True)
                with open(download_path, "wb") as f:
                    f.write(file_response.content)
                print(f"✅ File downloaded successfully: {download_path}")
                return download_path
            else:
                print(f"Failed to download file: {file_response.status_code}, {file_response.text}")
    else:
        print(f"Failed to retrieve cleaned audio: {response.status_code}, {response.text}")
    return None


def clean_audio_service(audio_file_path):
    """Complete service for cleaning audio file."""
    try:
        print("Starting audio cleaning service...")

        # Step 1: Get signed upload URL
        signed_upload_url = get_signed_upload_url(audio_file_path)
        if not signed_upload_url:
            return {"status": "error", "message": "Failed to get signed upload URL."}

        # Step 2: Upload the file to signed URL
        response = upload_file_to_url(signed_upload_url, audio_file_path)
        if response.status_code != 200:
            return {"status": "error", "message": f"Failed to upload file. Error: {response.text}"}

        # Step 3: Clean the audio
        file_url = signed_upload_url  # The signed URL will be used for cleaning
        clean_response = clean_audio(file_url)
        if not clean_response or not clean_response.get("id"):
            return {"status": "error", "message": "Failed to clean audio."}

        edit_id = clean_response["id"]
        print(f"Audio cleaning initiated. Edit ID: {edit_id}")

        # Step 4: Poll for audio cleaning completion
        retries = 0
        poll_interval = 10  # seconds
        max_retries = 10
        while retries < max_retries:
            download_path = download_cleaned_audio(edit_id)
            if download_path:
                return {"status": "success", "message": "File cleaned and downloaded successfully.", "download_path": download_path}
            time.sleep(poll_interval)
            retries += 1

        return {"status": "error", "message": "Failed to download cleaned audio after retries."}

    except Exception as e:
        print(f"An unexpected error occurred: {str(e)}")
        return {"status": "error", "message": f"An unexpected error occurred: {str(e)}"}


# Example usage
audio_file_path = "E:/UOM/FYP/TTSx/UI/client/public/Audios/DenoisedInference.wav"
result = clean_audio_service(audio_file_path)
print(json.dumps(result, indent=4))
