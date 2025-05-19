from pydub.utils import mediainfo
from pathlib import Path
import tqdm
import os

def get_total_audio_length(folder_path):
    """Calculate total duration of .wav audio files in a folder and log any failures."""
    folder = Path(folder_path)
    total_duration = 0  # in seconds
    failed_files = []

    # Recursively get all .wav files
    audio_files = list(folder.rglob("*.wav"))

    if not audio_files:
        print("No .wav audio files found in the specified folder.")
        return 0

    print(f"Found {len(audio_files)} .wav files. Calculating total duration...")

    for audio_file in tqdm.tqdm(audio_files, desc="Processing Files", unit="file"):
        try:
            if not audio_file.exists():
                print(f"File not found: {audio_file}")
                failed_files.append(str(audio_file))
                continue

            info = mediainfo(audio_file)
            duration = float(info.get("duration", 0))
            total_duration += duration

        except Exception as e:
            print(f"Could not process {audio_file}: {e}")
            failed_files.append(str(audio_file))

    # # Log failed files if any
    # if failed_files:
    #     failed_log_path = folder / "failed_audio_files.txt"
    #     with open(failed_log_path, "w", encoding="utf-8") as f:
    #         f.write("\n".join(failed_files))
    #     print(f"\n⚠️ {len(failed_files)} files could not be processed. Details saved to: {failed_log_path}")

    total_hours = total_duration / 3600
    print(f"\n✅ Total duration: {total_hours:.2f} hours")
    return total_duration

if __name__ == "__main__":
    folder_path = input("Enter the folder path containing audio files: ").strip()
    if os.path.exists(folder_path):
        get_total_audio_length(folder_path)
    else:
        print("❌ The specified folder path does not exist.")
