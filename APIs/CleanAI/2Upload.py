import requests

def upload_file_to_url(signed_url, file_path):
    """Uploads a file to the provided signed URL."""
    with open(file_path, "rb") as file:  # Using 'with' to ensure the file is closed automatically
        response = requests.put(signed_url, data=file)
        
        if response.status_code == 200:
            pass
        else:
            print(f"Failed to upload file. Status code: {response.status_code}, Response: {response.text}")
        
    return response

# # Example usage
# signed_url = "https://f9c8803feb33484a51d0df72dc0fb4a6.eu.r2.cloudflarestorage.com/uploads/uploads/NtVRbxp_audio.wav?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=954746a8aa0219ba6adbd561eb1697ca%2F20250220%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20250220T165423Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=ae6684e398f519cd1da791ebd5a2519b9ceabd5b89767b1e94a4b3cbcae8f4dd"
# file_path = "E:/UOM/FYP/TTSx/APIs/Audios/InitialInference.wav"
# response = upload_file_to_url(signed_url, file_path)

