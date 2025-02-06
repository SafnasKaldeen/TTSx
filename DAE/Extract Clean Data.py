import os
import shutil
import pandas as pd
import logging

# Set up logging to output both to a file and the console
log_filename = "audio_extraction.log"
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', handlers=[
    logging.FileHandler(log_filename),  # Write to a log file
    logging.StreamHandler()              # Also print to console
])

# Path to the metadata file and the folder containing .wav files
metadata_file = 'E:/UOM/FYP/TTSx/DAE/metadata.csv'
wav_folder = 'E:/UOM/FYP/TTSx/Data/Sinhala_lady_voice/wavs'
output_folder = 'E:/UOM/FYP/TTSx/DAE/Clean Data'

# Check if the metadata file exists
if not os.path.exists(metadata_file):
    logging.error(f"Metadata file not found: {metadata_file}")
    exit()

# Read the metadata file into a pandas DataFrame
metadata = pd.read_csv(metadata_file, header=None, sep='|', names=['audio_id', 'transcription_sinhala', 'transcription_roman'])

# Check if the wav folder exists
if not os.path.exists(wav_folder):
    logging.error(f"Wave folder not found: {wav_folder}")
    exit()

# Make sure the output folder exists
os.makedirs(output_folder, exist_ok=True)
logging.info(f"Output folder created or already exists: {output_folder}")

# Loop through each row in the metadata file
for index, row in metadata.iterrows():
    audio_id = row['audio_id']  # This will be something like sin_01_00001
    wav_filename = f"{audio_id}.wav"  # Corresponding .wav file name
    
    # Construct full path to the .wav file
    wav_path = os.path.join(wav_folder, wav_filename)
    
    # Check if the .wav file exists
    if os.path.exists(wav_path):
        try:
            # If it exists, copy the audio file to the output folder
            shutil.copy(wav_path, os.path.join(output_folder, wav_filename))
            logging.info(f"Successfully copied {wav_filename} to {output_folder}")
        except Exception as e:
            logging.error(f"Error copying {wav_filename}: {str(e)}")
    else:
        logging.warning(f"Missing audio file for {audio_id}: {wav_filename} not found in {wav_folder}")

logging.info("Audio extraction process completed.")
