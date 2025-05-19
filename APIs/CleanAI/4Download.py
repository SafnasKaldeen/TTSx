import requests
import os

def download_cleaned_audio(EDIT_ID):
    API_KEY = "PXWomUxajZe4WFyupshryP3wbc2wUXzb"
    API_URL = f"https://api.cleanvoice.ai/v2/edits/{EDIT_ID}"
    download_path = "E:/UOM/FYP/TTSx/APIs/Audios/cleaned_audio.wav"
    
    headers = {"X-Api-Key": API_KEY}
    
    try:
        # Make the API request to get the download URL
        response = requests.get(API_URL, headers=headers)

        # Check if the request was successful
        if response.status_code == 200:
            data = response.json()
            print(data)
            # Ensure 'result' contains 'download_url'
            if "result" in data and "download_url" in data["result"]:
                download_url = data["result"]["download_url"]
                print(f"Download URL: {download_url}")

                # Download the file from the download URL
                file_response = requests.get(download_url)
                
                if file_response.status_code == 200:
                    # Ensure the directory exists before saving
                    os.makedirs(os.path.dirname(download_path), exist_ok=True)

                    # Save the downloaded file
                    with open(download_path, "wb") as f:
                        f.write(file_response.content)
                    print(f"✅ File downloaded successfully: {download_path}")
                    return download_path  # Return the file's download path
                else:
                    print(f"❌ Failed to download the file. Status: {file_response.status_code}. Response: {file_response.text}")
                    return None
            else:
                print("❌ 'download_url' not found in the response.")
                return None
        else:
            print(f"❌ API request failed! Status Code: {response.status_code}. Response: {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        # Handle any request exception (e.g., connection issues)
        print(f"❌ Request failed with error: {str(e)}")
        return None


# # Example usage within your project
# if __name__ == "__main__":
#     EDIT_ID = "22229b62-0dd6-4cd5-aa0b-51e0e1eaca62" 
#     download_path = download_cleaned_audio(EDIT_ID)
#     if download_path:
#         print(f"Downloaded file is saved at: {download_path}")
#     else:
#         print("Failed to download the file.")
