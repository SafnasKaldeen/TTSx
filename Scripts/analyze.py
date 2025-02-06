import csv
import os
from collections import Counter
from statistics import mean, median, stdev
import matplotlib.pyplot as plt
import re
from matplotlib import rcParams

# Set default font
rcParams['font.family'] = 'Arial'

def is_sinhala(text):
    """Check if the text contains Sinhala characters."""
    return bool(re.search(r'[\u0D80-\u0DFF]', text))  # Sinhala Unicode range

def load_metadata(file_path):
    """Load metadata from CSV file."""
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="|")
        return [row[1] for row in reader]  # Assuming the second column is text

def analyze_texts(texts):
    """Analyze the texts for various statistics."""
    char_counts = [len(text) for text in texts]
    word_counts = [len(text.split()) for text in texts]
    word_frequency = Counter(word for text in texts for word in text.split())
    
    stats = {
        "total_texts": len(texts),
        "total_words": sum(word_counts),
        "total_characters": sum(char_counts),
        "avg_words_per_text": mean(word_counts),
        "median_words_per_text": median(word_counts),
        "std_dev_words_per_text": stdev(word_counts) if len(word_counts) > 1 else 0,
        "avg_chars_per_text": mean(char_counts),
        "median_chars_per_text": median(char_counts),
        "std_dev_chars_per_text": stdev(char_counts) if len(char_counts) > 1 else 0,
        "most_common_words": word_frequency.most_common(10),
    }
    return stats

def plot_statistics(stats, save_path=None):
    """Plot the statistics."""
    plt.figure(figsize=(10, 6))
    words = [word for word, _ in stats["most_common_words"]]
    
    # Set font conditionally for Sinhala text
    if any(is_sinhala(word) for word in words):
        rcParams['font.family'] = 'Iskoola Pota Regular'  # Sinhala font
    
    plt.bar(words, [count for _, count in stats["most_common_words"]])
    plt.title("Top 10 Most Common Words")
    plt.ylabel("Frequency")
    plt.xlabel("Words")
    
    if save_path:
        plt.savefig(os.path.join(save_path, "word_frequency.png"))
    plt.show()

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--file_path", help="Path to the metadata.csv file")
    parser.add_argument("--save_to", help="Directory to save plots")
    args = parser.parse_args()
    
    # Prompt for arguments if not provided
    if not args.file_path:
        args.file_path = input("Enter the path to the metadata.csv file: ")
    if not args.save_to:
        args.save_to = input("Enter the directory to save plots (or press Enter to skip saving): ")
    
    texts = load_metadata(args.file_path)
    stats = analyze_texts(texts)
    
    print("Text Analysis Results:")
    for key, value in stats.items():
        if key != "most_common_words":
            print(f"{key}: {value}")
        else:
            print(f"{key}: {value}")
    
    if args.save_to:
        os.makedirs(args.save_to, exist_ok=True)
        plot_statistics(stats, save_path=args.save_to)
    else:
        plot_statistics(stats)

if __name__ == "__main__":
    import matplotlib.font_manager

    if 'Iskoola Pota' in matplotlib.font_manager.findSystemFonts(fontpaths=None, fontext='ttf'):
        print("Iskoola Pota font is available for sinhala analysis.")

    main()
