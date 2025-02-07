import pandas as pd

# Load the second metadata file (two columns: speaker_id and transcription)
file2_path = "E:/UOM/FYP/TTSx/Data/Recording/Chunks/Recording copy/Chunks/metadata.csv"
df2 = pd.read_csv(file2_path, sep=",")  # Adjust delimiter as per your file

# Save the first column (speaker_id) to a new CSV
speaker_id_path = "E:/UOM/FYP/TTSx/Data/Recording/speaker_id.csv"
df2[['speaker_id']].to_csv(speaker_id_path, index=False, header=["speaker_id"], sep="|")

# Save the second column (transcription) to a new CSV
transcription_path = "E:/UOM/FYP/TTSx/Data/Recording/transcription.csv"
df2[['transcription']].to_csv(transcription_path, index=False, header=["transcription"], sep="|")

print(f"✅ Speaker ID CSV saved: {speaker_id_path}")
print(f"✅ Transcription CSV saved: {transcription_path}")
