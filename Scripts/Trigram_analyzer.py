import pandas as pd
from collections import defaultdict
import heapq
import re

# Load the metadata file
file_path = "E:/UOM/FYP/TTSx/Data/Mettananda Voice/metadata_shuffled.csv"
df = pd.read_csv(file_path, sep="|", header=None, names=["filename", "text", "phonetic"])

# Extract text column
sentences = df["text"].tolist()

# Function to preprocess text (replace symbols except '.' with spaces & remove consecutive spaces)
def preprocess_text(text):
    text = re.sub(r"[^\w\s.]", " ", text)  # Replace symbols except '.'
    text = re.sub(r"\s+", " ", text).strip()  # Collapse multiple spaces
    return text

# Extract trigrams function
def extract_trigrams(sentence):
    words = ["<s>"] + list(sentence) + ["</s>"]
    return {"".join(words[i:i+3]) for i in range(len(words) - 2)}

# Step 1: Preprocess text and extract trigrams
print("🔄 Preprocessing text and extracting trigrams...")

all_trigrams = set()
sentence_trigrams_map = {}
trigram_counts = defaultdict(int)

for sentence in sentences:
    preprocessed_sentence = preprocess_text(sentence)
    trigrams = extract_trigrams(preprocessed_sentence)

    sentence_trigrams_map[sentence] = trigrams
    for trigram in trigrams:
        trigram_counts[trigram] += 1
    all_trigrams.update(trigrams)

# Separate the counts for all trigrams
all_trigram_counts = defaultdict(int)

for sentence, trigrams in sentence_trigrams_map.items():
    for trigram in trigrams:
        all_trigram_counts[trigram] += 1

all_trigrams_counts_df = pd.DataFrame(list(all_trigram_counts.items()), columns=["Trigram", "Count"])
all_trigrams_counts_df = all_trigrams_counts_df.sort_values(by="Count").reset_index(drop=True)
all_trigrams_counts_df.to_csv("E:/UOM/FYP/TTSx/Data/Mettananda Voice/all_trigrams_counts.csv", index=False)
print(f"✅ All trigrams saved as 'all_trigrams_counts.csv' with {len(all_trigrams)} unique trigrams.")

# Step 2: Select sentences to cover all trigrams efficiently
print("🔄 Selecting sentences to maximize trigram coverage...")

selected_sentences = set()
covered_trigrams = set()

heap = []

for sentence, trigrams in sentence_trigrams_map.items():
    missing_trigrams = len(trigrams - covered_trigrams)
    heapq.heappush(heap, (-missing_trigrams, sentence))

while covered_trigrams != all_trigrams and heap:
    _, best_sentence = heapq.heappop(heap)
    new_trigrams = sentence_trigrams_map[best_sentence] - covered_trigrams
    if not new_trigrams:
        continue

    selected_sentences.add(best_sentence)
    covered_trigrams.update(new_trigrams)

    new_heap = []
    for sentence, trigrams in sentence_trigrams_map.items():
        if sentence not in selected_sentences:
            missing_trigrams = len(trigrams - covered_trigrams)
            if missing_trigrams > 0:
                heapq.heappush(new_heap, (-missing_trigrams, sentence))
    heap = new_heap

print(f"✅ {len(selected_sentences)} sentences selected to cover all trigrams.")

# Save the selected sentences
selected_sentences_df = pd.DataFrame({"text": list(selected_sentences)})
selected_sentences_df = selected_sentences_df.sort_values(by="text").reset_index(drop=True)
selected_sentences_df.to_csv("E:/UOM/FYP/TTSx/Data/Mettananda Voice/selected_sentences.csv", index=False)

# Step 3: Count trigrams in selected sentences
selected_trigram_counts = defaultdict(int)

for sentence in selected_sentences:
    trigrams = sentence_trigrams_map[sentence]
    for trigram in trigrams:
        selected_trigram_counts[trigram] += 1

selected_trigrams_counts_df = pd.DataFrame(list(selected_trigram_counts.items()), columns=["Trigram", "Count"])
selected_trigrams_counts_df = selected_trigrams_counts_df.sort_values(by="Count").reset_index(drop=True)
selected_trigrams_counts_df.to_csv("E:/UOM/FYP/TTSx/Data/Mettananda Voice/selected_trigrams_counts.csv", index=False)
print(f"✅ Selected trigrams saved as 'selected_trigrams_counts.csv'.")

# Step 4: Iteratively reduce to 500 sentences while maintaining trigram diversity
print("🔄 Reducing to 500 sentences while maintaining trigram coverage...")

removed_sentences = set()  # Track removed sentences for pruned trigram counts

while len(selected_sentences) > 500:
    # Find the sentence with the least unique trigram contribution
    least_valuable_sentence = min(
        selected_sentences, key=lambda s: sum(trigram_counts[t] for t in sentence_trigrams_map[s])
    )

    # Remove it from selected sentences
    selected_sentences.remove(least_valuable_sentence)
    removed_sentences.add(least_valuable_sentence)  # Add to removed sentences

    # Update trigram counts
    for trigram in sentence_trigrams_map[least_valuable_sentence]:
        trigram_counts[trigram] -= 1
        if trigram_counts[trigram] == 0:
            del trigram_counts[trigram]  # Remove trigram if not covered anymore

    # Print progress every 50 removals
    if len(selected_sentences) % 50 == 0:
        print(f"🔄 Reduced to {len(selected_sentences)} sentences... Remaining trigrams: {len(trigram_counts)}")

print(f"✅ Final sentence count: {len(selected_sentences)}")
print(f"✅ Trigram coverage maintained with {len(trigram_counts)} unique trigrams.")

# Step 5: Save optimized dataset (sorted)
print("🔄 Saving final optimized dataset...")

# Sort the sentences alphabetically
selected_sentences_df = pd.DataFrame({"text": list(selected_sentences)})
selected_sentences_df = selected_sentences_df.sort_values(by="text").reset_index(drop=True)

# Save the sorted dataset
selected_sentences_df.to_csv("E:/UOM/FYP/TTSx/Data/Mettananda Voice/optimized_500_sentences.csv", index=False)

# Step 6: Save pruned trigram counts (sorted by count)
print("🔄 Saving pruned trigram counts...")

# We now count trigrams for the removed sentences
pruned_trigram_counts = defaultdict(int)

# Loop through removed sentences and count the trigrams
for sentence in removed_sentences:
    for trigram in sentence_trigrams_map[sentence]:
        pruned_trigram_counts[trigram] += 1

# Sort the pruned trigrams by their count in ascending order
pruned_trigram_counts_df = pd.DataFrame(list(pruned_trigram_counts.items()), columns=["Trigram", "Count"])
pruned_trigram_counts_df = pruned_trigram_counts_df.sort_values(by="Count").reset_index(drop=True)

# Save the sorted pruned trigram counts
pruned_trigram_counts_df.to_csv("E:/UOM/FYP/TTSx/Data/Mettananda Voice/pruned_trigram_counts.csv", index=False)

# Step 7: Save all trigrams before trimming (sorted by count)
print("🔄 Saving all trigrams before trimming...")

# Step 8: Calculate retained trigrams (from the selected sentences)
# Step 8: Calculate retained trigrams (from the selected sentences)
print("🔄 Calculating retained trigrams...")

# Initialize a dictionary to store the count of each retained trigram
retained_trigrams_counts = defaultdict(int)

# Loop through selected sentences to manually update the count of each trigram
for sentence in selected_sentences:
    for trigram in sentence_trigrams_map[sentence]:
        # Manually count trigrams without using `update()`
        retained_trigrams_counts[trigram] += 1

# Convert the retained trigrams and their counts into a DataFrame
retained_trigrams_counts_df = pd.DataFrame(list(retained_trigrams_counts.items()), columns=["Trigram", "Count"])

# Sort the DataFrame by Trigram (optional)
retained_trigrams_counts_df = retained_trigrams_counts_df.sort_values(by="Trigram").reset_index(drop=True)

# Save the retained trigrams
retained_trigrams_counts_df.to_csv("E:/UOM/FYP/TTSx/Data/Mettananda Voice/retained_trigrams_counts.csv", index=False)
print(f"✅ Retained trigrams saved as 'retained_trigrams_counts.csv'.")

retained_trigrams = list(retained_trigrams_counts.keys())

# Step 9: Calculate missing trigrams (those that are not covered by selected sentences)
missing_trigrams = all_trigrams - set(retained_trigrams)

# Initialize missing trigrams counts based on selected trigrams
missing_trigrams_counts = {}

# Add counts for missing trigrams based on selected_trigrams_counts
for trigram in missing_trigrams:
    # If the trigram is in selected_trigrams_counts, use its count; otherwise, use 0
    missing_trigrams_counts[trigram] = selected_trigram_counts.get(trigram, 0)

# Save the missing trigrams with their counts
if missing_trigrams_counts:
    missing_trigrams_df = pd.DataFrame(list(missing_trigrams_counts.items()), columns=["Trigram", "Count"])
    missing_trigrams_df.to_csv("E:/UOM/FYP/TTSx/Data/Mettananda Voice/missing_trigrams.csv", index=False)
    print(f"✅ Missing trigrams saved as 'missing_trigrams.csv'.")
else:
    print("❌ No missing trigrams found.")
