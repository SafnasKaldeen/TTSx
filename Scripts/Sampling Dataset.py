import pandas as pd
import os
import random

# Define file paths
metadata_file_path = 'E:/UOM/FYP/TTSx/Data/OpeSLR/metadata.csv'  # Adjust this to your metadata file path
splits_directory = 'E:/UOM/FYP/TTSx/Data/OpeSLR/'  # Directory to save the split files

# Load the metadata file
df = pd.read_csv(metadata_file_path, delimiter='|')

# Ensure the necessary columns exist
if 'sin_sentence' not in df.columns:
    raise ValueError("Column 'sin_sentence' not found in metadata file.")

# Step 1: Count character occurrences in 'sin_sentence'
char_count = {}
for sentence in df['sin_sentence']:
    for char in sentence:
        if char not in char_count:
            char_count[char] = 0
        char_count[char] += 1

# Save the character count to a CSV (pipe-delimited)
char_count_df = pd.DataFrame(list(char_count.items()), columns=['Character', 'Count'])
char_count_report_path = 'E:/UOM/FYP/TTSx/Data/OpeSLR/character_count_report.csv'
char_count_df.to_csv(char_count_report_path, index=False, sep='|')

# Step 2: Calculate the total character count and target for each split
total_char_count = sum(char_count.values())
target_char_count = total_char_count // 5

# Step 3: Calculate sentence-wise character counts
df['char_count'] = df['sin_sentence'].apply(len)  # Count the characters in each sentence

# Shuffle the sentences to avoid any bias based on their original order
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

# Step 4: Distribute sentences into 5 splits while maintaining tolerance
splits = {i: {'sentences': [], 'char_count': 0} for i in range(1, 6)}
split_char_target = target_char_count
lower_bound = target_char_count * 0.8
upper_bound = target_char_count * 1.2

# Add sentences to splits in a way that respects the tolerance
for _, row in df.iterrows():
    sentence = row['sin_sentence']
    sentence_char_count = len(sentence)

    # Sort splits by current character count to balance the distribution
    sorted_splits = sorted(splits.items(), key=lambda x: x[1]['char_count'])
    
    for split_idx, split_data in sorted_splits:
        if lower_bound <= split_data['char_count'] + sentence_char_count <= upper_bound:
            splits[split_idx]['sentences'].append(sentence)
            splits[split_idx]['char_count'] += sentence_char_count
            break
    else:
        # If none of the splits can accept the sentence within bounds, add to the least filled split
        least_filled_split = min(splits.items(), key=lambda x: x[1]['char_count'])
        splits[least_filled_split[0]]['sentences'].append(sentence)
        splits[least_filled_split[0]]['char_count'] += sentence_char_count

# Step 5: Save the splits into separate CSV files (pipe-delimited)
for i in range(1, 6):
    split_df = df[df['sin_sentence'].isin(splits[i]['sentences'])]
    split_file_path = os.path.join(splits_directory, f'split_{i}.csv')
    split_df.drop(columns='char_count', inplace=True)  # Drop the helper column
    split_df.to_csv(split_file_path, index=False, sep='|')
    print(f'Split {i} saved with {len(splits[i]["sentences"])} sentences.')

# Step 6: Report the character counts for each split (by character)
split_report = []
for i in range(1, 6):
    split_data = splits[i]
    split_char_count = {char: 0 for char in char_count}  # Initialize with all characters
    
    # Count the characters in the sentences of each split
    for sentence in split_data['sentences']:
        for char in sentence:
            split_char_count[char] += 1
    
    split_report.append({
        'Split': i,
        **split_char_count  # Add character counts for each character
    })

# Convert the split report to a DataFrame
split_report_df = pd.DataFrame(split_report)

# Save the split report to a CSV file (pipe-delimited)
split_report_path = 'E:/UOM/FYP/TTSx/Data/OpeSLR/split_report.csv'
split_report_df.to_csv(split_report_path, index=False, sep='|')

print(f"Split report saved in: {split_report_path}")
print(f"Character count report saved in: {char_count_report_path}")


# List of split files (you can manually list them or dynamically fetch them from the directory)
split_files = [f'split_{i+1}.csv' for i in range(5)]  # Adjust the number of splits if necessary

# Initialize a dictionary to track occurrences of sentences across splits
sentence_tracker = {}

# Iterate over each split and collect sentences
for split_file in split_files:
    split_path = os.path.join(splits_directory, split_file)
    if os.path.exists(split_path):
        split_df = pd.read_csv(split_path, delimiter='|')

        # Check if 'sin_sentence' column exists in the current split file
        if 'sin_sentence' not in split_df.columns:
            print(f"Warning: Column 'sin_sentence' not found in {split_file}. Skipping this split.")
            continue

        # Iterate through each sentence in the split
        for index, row in split_df.iterrows():
            sentence = row['sin_sentence']

            # Track sentence occurrences across splits
            if sentence in sentence_tracker:
                sentence_tracker[sentence].append(split_file)
            else:
                sentence_tracker[sentence] = [split_file]

# Filter out sentences that appear in more than one split
duplicates = {sentence: splits for sentence, splits in sentence_tracker.items() if len(splits) > 1}

# Create a DataFrame from the duplicates dictionary
duplicate_sentences_df = pd.DataFrame([(sentence, ', '.join(splits)) for sentence, splits in duplicates.items()],
                                      columns=['sin_sentence', 'splits'])

# Save the duplicate sentences to a CSV file
output_file = 'E:/UOM/FYP/TTSx/Data/OpeSLR/duplicate_sentences.csv'  # Specify the output file path
duplicate_sentences_df.to_csv(output_file, index=False, sep='|')

print(f"Duplicate sentences across splits have been saved in: {output_file}")
