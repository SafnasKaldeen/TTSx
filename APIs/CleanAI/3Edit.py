import requests
import json

def clean_audio(file_url, api_key="PXWomUxajZe4WFyupshryP3wbc2wUXzb", remove_noise=True, normalize=True, export_format="wav", summarize=True):
    """
    This function sends a request to the CleanVoice API to clean the audio file
    and apply various processing options like noise removal, normalization, etc.
    
    Args:
        file_url (str): URL of the audio file to be processed.
        ="" (str): API key for authentication.
        remove_noise (bool): Whether to remove noise from the audio.
        normalize (bool): Whether to normalize the audio.
        export_format (str): The format to export the cleaned audio file.
        summarize (bool): Whether to summarize the content of the audio.
        
    Returns:
        dict: The response from the API containing the processed result.
    """
    # Prepare the data to be sent to the API
    data = {
        "input": {
            "files": [file_url],  # Audio URL passed as the file input
            "config": {
                "remove_noise": remove_noise,
                "normalize": normalize,
                "export_format": export_format,
                "summarize": summarize
            }
        }
    }

    # Set up the request headers for authentication and content type
    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json"
    }

    # Send a POST request to the CleanVoice API
    response = requests.post("https://api.cleanvoice.ai/v2/edits", json=data, headers=headers)

    # Check if the response is successful
    if response.status_code == 200:
        print("Audio processed successfully!")
        return response.json()  # Return the JSON response from the API
    else:
        print(f"Failed to process audio. Status code: {response.status_code}")
        return response.text  # Return the error message

# def main():
#     file_url = "https://f9c8803feb33484a51d0df72dc0fb4a6.eu.r2.cloudflarestorage.com/uploads/uploads/3uc5toU_audio.wav?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=954746a8aa0219ba6adbd561eb1697ca%2F20250220%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20250220T155012Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=3745f28f8aa8752e99c100f3b80f1c5bada83aea00d62ba473277bd88505e96c"
#     api_key = "PXWomUxajZe4WFyupshryP3wbc2wUXzb"

#     # Call the function to process the audio
#     result = clean_audio(file_url, api_key)
    
#     # Print the result
#     print(json.dumps(result, indent=4)) 

# if __name__ == "__main__":
#     main()
