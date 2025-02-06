from pydub.utils import mediainfo
from pathlib import Path
import tqdm
import os

def get_total_audio_length(folder_path):
    """Calculate the total duration of audio files in a folder."""
    folder = Path(folder_path)
    total_duration = 0  # in seconds

    # Get all audio files in the folder
    audio_files = list(folder.glob("*"))
    
    if not audio_files:
        print("No audio files found in the specified folder.")
        return 0

    print(f"Found {len(audio_files)} audio files. Calculating total duration...")

    # Use tqdm for a progress bar
    for audio_file in tqdm.tqdm(audio_files, desc="Processing Files", unit="file"):
        try:
            # Get metadata of the audio file
            info = mediainfo(audio_file)
            total_duration += float(info.get("duration", 0))
        except Exception as e:
            print(f"Could not process {audio_file}: {e}")

    print(f"Total duration: {total_duration / 3600:.2f} hours")
    return total_duration

if __name__ == "__main__":
    folder_path = input("Enter the folder path containing audio files: ").strip()
    if os.path.exists(folder_path):
        get_total_audio_length(folder_path)
    else:
        print("The specified folder path does not exist.")
