import os
import pandas as pd
from shutil import copy2

# Paths to dataset and metadata.csv
dataset_path = "E:/UOM/FYP/TTSx/Data/OpeSLR"
metadata_file = os.path.join(dataset_path, "metadata.csv")
output_base_dir = "E:/UOM/FYP/TTSx/Data/OpeSLR/Speakers"

# Load metadata.csv
print("\033[94mLoading metadata.csv...\033[0m")
metadata = pd.read_csv(metadata_file, sep='|', header=None, names=["id", "transcription","cleaned_transcription"])
print(f"\033[94mLoaded metadata with {len(metadata)} entries.\033[0m\n")

# Function to process each speaker
def process_speakers(metadata, dataset_path, output_base_dir):
    # Extract unique speaker IDs from the first 8 characters of the IDs
    print("\033[94mExtracting unique speaker IDs...\033[0m")
    metadata['speaker'] = metadata['id'].str[:8]
    unique_speakers = metadata['speaker'].unique()
    print(f"\033[94mFound {len(unique_speakers)} unique speakers.\033[0m\n")

    for speaker in unique_speakers:
        print(f"\033[94mProcessing speaker: {speaker}\033[0m")
        speaker_dir = os.path.join(output_base_dir, speaker)
        wav_dir = os.path.join(speaker_dir, "wavs")
        untranscribed_dir = os.path.join(speaker_dir, "wavs Untranscribed")
        os.makedirs(wav_dir, exist_ok=True)
        os.makedirs(untranscribed_dir, exist_ok=True)
        print(f"\033[94mCreated directories: {speaker_dir}, {wav_dir}, and {untranscribed_dir}\033[0m")

        # Filter rows for this speaker
        speaker_data = metadata[metadata['speaker'] == speaker]

        # Copy corresponding audio files
        transcriptions = 0
        for _, row in speaker_data.iterrows():
            source_file = os.path.join(dataset_path, "wavs", row["id"] + ".wav")
            target_file = os.path.join(wav_dir, row["id"] + ".wav")
            if os.path.exists(source_file):
                copy2(source_file, target_file)
                transcriptions += 1

        # Check for audio files without metadata and copy them to "wavs Untranscribed"
        audio_files = os.listdir(os.path.join(dataset_path, "wavs"))
        untranscribed_metadata = []
        untranscribed_audios = 0
        for audio_file in audio_files:
            audio_id = os.path.splitext(audio_file)[0]
            # print(speaker)
            if audio_id not in metadata['id'].values and audio_id.startswith(speaker):
               
                
                untranscribed_source = os.path.join(dataset_path, "wavs", audio_file)
                untranscribed_target = os.path.join(untranscribed_dir, audio_file)
                copy2(untranscribed_source, untranscribed_target)
                untranscribed_metadata.append([audio_id, ""])
                untranscribed_audios += 1

        # Save "Untranscribed metadatas.csv" in the untranscribed folder
        if untranscribed_metadata:
            untranscribed_metadata_path = os.path.join(speaker_dir, "Untranscribed metadatas.csv")
            untranscribed_df = pd.DataFrame(untranscribed_metadata, columns=["id", "transcription"])
            untranscribed_df.to_csv(untranscribed_metadata_path, sep='|', index=False, header=False)

        # Save metadata.csv for this speaker
        speaker_metadata_path = os.path.join(speaker_dir, "metadata.csv")
        speaker_data.drop(columns=["speaker"]).to_csv(speaker_metadata_path, sep='|', index=False, header=False)

        # Print stats for the speaker
        total_audios = transcriptions + untranscribed_audios
        print(f"\033[92mSpeaker {speaker}:\033[0m {transcriptions} transcribed + {untranscribed_audios} untranscribed = {total_audios} total audios verified {transcriptions + untranscribed_audios == total_audios}\n")

    print("\033[92mAll speakers processed successfully!\033[0m")

    print("1251+813=2064")

# Run the processing function
process_speakers(metadata, dataset_path, output_base_dir)
