import requests

API_KEY = "PXWomUxajZe4WFyupshryP3wbc2wUXzb"
UPLOAD_URL = "https://api.cleanvoice.ai/v2/upload"

def get_signed_upload_url(filename: str):
    """
    Generates a signed URL for uploading an audio file to CleanVoice API.

    :param filename: Name of the audio file to upload.
    :return: Signed URL for uploading the file.
    """
    url = f"{UPLOAD_URL}?filename={filename}"
    headers = {"X-API-Key": API_KEY}

    response = requests.post(url, headers=headers)

    if response.status_code == 200:
        return response.json().get("signedUrl")
    else:
        return None  # Handle errors properly in the main application

# # Example usage
# if __name__ == "__main__":
#     file_name = "audio.wav"
#     signed_url = get_signed_upload_url(file_name)
#     print(f"Signed URL: {signed_url}" if signed_url else "Failed to get signed URL")
