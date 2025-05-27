import pandas as pd
import os
import re

# Load metadata.csv (Update the path if needed)
csv_path = "E:/UOM/FYP/TTSx/Data/Recording/combined_text.csv"
df = pd.read_csv(csv_path, sep="|", header=None, names=["text"], dtype=str)  # Ensuring text format

# Shuffle the data first
df = df.sample(frac=1, random_state=42).reset_index(drop=True)  # Shuffle the data

# Function to count words in a sentence (ignoring punctuation, using whitespace)
def word_count(sentence):
    cleaned_sentence = re.sub(r"[^\w\s]", "", str(sentence))  # Remove punctuation/symbols
    words = cleaned_sentence.split()  # Split by whitespace
    return len(words)

# Add a new column marking eligibility
df["count"] = df["text"].apply(word_count)
df["Eligible"] = df["count"].apply(lambda x: "Eligible" if 6 <= x <= 25 else "Not Eligible")

# Save the updated input file with eligibility column
updated_csv_path = "E:/UOM/FYP/TTSx/Data/Recording/combined_text_updated.csv"
df.to_csv(updated_csv_path, index=False, sep="|")

print(f"✅ Updated file saved: {updated_csv_path}")

# Filter sentences with 8 to 15 words for chunking
filtered_df = df[df["Eligible"] == "Eligible"].drop(columns=["Eligible", "count"])  # Drop extra columns for chunks

# how many sentences are eligible
print(f"✅ {len(filtered_df)} sentences are eligible for chunking.")

# Split into chunks of 25 sentences per batch
chunk_size = 25
chunks = [filtered_df[i:i + chunk_size] for i in range(0, len(filtered_df), chunk_size)]

# Create output folder
output_dir = "E:/UOM/FYP/TTS/chunks"
os.makedirs(output_dir, exist_ok=True)

# Save each chunk as a separate CSV file
for idx, chunk in enumerate(chunks, start=1):
    chunk.to_csv(f"{output_dir}/chunk{idx}.csv", index=False, sep="|", header=False)

print(f"✅ {len(chunks)} chunk files created in {output_dir}")
