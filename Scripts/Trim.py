import os
import librosa
import soundfile as sf
import noisereduce as nr

def trim_silence_from_flac(file_path, output_path, top_db=30):
    try:
        # Load the FLAC audio file
        audio, sr = librosa.load(file_path, sr=None)

        # Apply noise reduction
        audio_reduced = nr.reduce_noise(y=audio, sr=sr, prop_decrease=0.9, use_torch=False)

        # Trim leading and trailing silence
        trimmed_audio, _ = librosa.effects.trim(audio_reduced, top_db=top_db)

        trimmed_audio = trimmed_audio * 2

        # Save the trimmed audio to the new output path
        sf.write(output_path, trimmed_audio, sr)
        print(f"Trimmed and saved to: {output_path}")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

def process_folder(root_folder, output_root_folder):
    for foldername, subfolders, filenames in os.walk(root_folder):
        for filename in filenames:
            if filename.lower().endswith('.wav'):
                file_path = os.path.join(foldername, filename)

                # Create corresponding output folder structure
                relative_path = os.path.relpath(foldername, root_folder)
                output_folder = os.path.join(output_root_folder, relative_path)

                # Make sure the output folder exists
                os.makedirs(output_folder, exist_ok=True)

                # Define output file path
                output_file_path = os.path.join(output_folder, filename)

                # Trim silence and save to the new folder
                trim_silence_from_flac(file_path, output_file_path)

# Example usage
input_directory = "E:/UOM/FYP/TTSx/Data/Speakers"
output_directory = "E:/UOM/FYP/TTSx/Data/Speakers2"
process_folder(input_directory, output_directory)
