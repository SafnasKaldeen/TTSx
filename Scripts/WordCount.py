import csv
import matplotlib.pyplot as plt

# Define the file path for the dataset
file_path = 'E:/UOM/FYP/TTSx/Data/Prepared Data/corpus.csv'  

# Function to count words in a sentence
def count_words(sentence):
    return len(sentence.split())

# Read the dataset and extract the second Sinhala column
sinhala_sentences = []
with open(file_path, mode='r', encoding='utf-8') as infile:
    reader = csv.reader(infile, delimiter='|')
    for row in reader:
        if len(row) > 1:  # Check if the second column exists
            sinhala_sentences.append(row[1].strip())  # Extract second column (Sinhala text)

# Count words for each Sinhala sentence
word_counts = [count_words(sentence) for sentence in sinhala_sentences]

# Plot the word count distribution
plt.figure(figsize=(10, 6))
plt.hist(word_counts, bins=30, edgecolor='black', color='skyblue')
plt.title('Word Count Distribution of Sinhala Sentences')
plt.xlabel('Word Count')
plt.ylabel('Frequency')
plt.grid(True)
plt.show()
