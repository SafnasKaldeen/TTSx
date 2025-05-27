import os
import csv
import soundfile as sf

# Define paths
LJSPEECH_PATH = "E:/UOM/FYP/TTSx/Data/Sinhala_lady_voice"  # Change to your LJSpeech dataset path
VCTK_PATH = "E:/UOM/FYP/TTSx/Data/Sinhala_lady_voice_VCTK"  # Output directory
SPEAKER_NAME = "Oshadi"  # Change this to the desired speaker name

# Create required directories
os.makedirs(os.path.join(VCTK_PATH, "txt", SPEAKER_NAME), exist_ok=True)
os.makedirs(os.path.join(VCTK_PATH, "wav48_silence_trimmed", SPEAKER_NAME), exist_ok=True)

# Read metadata.csv
metadata_file = os.path.join(LJSPEECH_PATH, "metadata.csv")
wavs_path = os.path.join(LJSPEECH_PATH, "wavs")

with open(metadata_file, "r", encoding="utf-8") as f:
    reader = csv.reader(f, delimiter="|")
    for idx, row in enumerate(reader):
        filename, text = row[0], row[2]

        # Convert filename to numeric index (00001, 00002, etc.)
        new_id = f"{SPEAKER_NAME}_{idx+1:05d}"

        # Convert text file (inside txt/SPEAKER_NAME/)
        txt_output_path = os.path.join(VCTK_PATH, "txt", SPEAKER_NAME, f"{new_id}.txt")
        with open(txt_output_path, "w", encoding="utf-8") as txt_file:
            txt_file.write(text)

        # Convert audio file to FLAC (inside wav48_silence_trimmed/SPEAKER_NAME/)
        old_audio_path = os.path.join(wavs_path, f"{filename}.wav")
        new_audio_path = os.path.join(VCTK_PATH, "wav48_silence_trimmed", SPEAKER_NAME, f"{new_id}_mic1.flac")

        # Read WAV and save as FLAC
        audio_data, samplerate = sf.read(old_audio_path)
        sf.write(new_audio_path, audio_data, samplerate, format="FLAC")

        print(f"Converted {filename} -> {new_id}.txt, {new_id}.flac")

print("LJSpeech dataset successfully converted to VCTK format!")
