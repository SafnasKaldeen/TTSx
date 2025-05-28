import csv
from collections import defaultdict

# Define your vowel and consonant sets
VOWELS = {'a', 'e', 'i', 'o', 'u', 'æ', 'ā', 'ē', 'ī', 'ō', 'ū', 'ǣ'}
CONSONANTS = {
    'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'y',
    'ñ', 'ś', 'ş', 'ḍ', 'ḥ', 'ḷ', 'ṁ', 'ṅ', 'ṇ', 'ṉ', 'ṛ', 'ṝ', 'ṭ'
}

# Optional: full phoneme list for analysis
ALL_PHONEMES = VOWELS.union(CONSONANTS)

# Path to metadata file
metadata_path = "E:/UOM/FYP/TTSx/Scripts/Evaluations/CorpusEval/metadata.csv"  # or .txt

# Phoneme counter
phoneme_counts = defaultdict(int)

# Read and process metadata
with open(metadata_path, 'r', encoding='utf-8') as file:
    reader = csv.reader(file, delimiter='|')
    for row in reader:
        if len(row) < 3:
            continue
        romanized = row[2].strip().lower()
        for char in romanized:
            if char in ALL_PHONEMES:
                phoneme_counts[char] += 1

# Prepare the final structure
PHONEME_COVERAGE = {
    'vowels': {},
    'consonants': {},
    'coverage_percentage': 0.0,
    'min_occurrences': 0,
    'avg_occurrences': 0.0
}

vowel_total = 0
consonant_total = 0

for ph, count in phoneme_counts.items():
    if ph in VOWELS:
        PHONEME_COVERAGE['vowels'][f'/{ph}/'] = count
        vowel_total += count
    elif ph in CONSONANTS:
        PHONEME_COVERAGE['consonants'][f'/{ph}/'] = count
        consonant_total += count

# Calculate coverage statistics
all_phonemes_covered = VOWELS.union(CONSONANTS)
covered = set(phoneme_counts.keys())
PHONEME_COVERAGE['coverage_percentage'] = round(
    (len(covered & all_phonemes_covered) / len(all_phonemes_covered)) * 100, 2
)

if phoneme_counts:
    PHONEME_COVERAGE['min_occurrences'] = min(phoneme_counts.values())
    PHONEME_COVERAGE['avg_occurrences'] = round(
        sum(phoneme_counts.values()) / len(phoneme_counts), 2
    )

# Pretty print the output like a JSON
import json
print(json.dumps(PHONEME_COVERAGE, indent=4, ensure_ascii=False))
