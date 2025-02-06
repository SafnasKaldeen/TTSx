import re

def clean_file(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    with open(output_file, 'w', encoding='utf-8') as file:
        for line in lines:
            # Strip extra whitespaces and check for any hidden characters
            cleaned_line = re.sub(r'[\r\n]+', '', line).strip()  # Remove newlines and extra spaces
            if cleaned_line != line.strip():
                print(f"[!] Line discarded: {line.strip()}")
            file.write(cleaned_line + '\n')

input_file = 'E:/UOM/FYP/TTSx/Data/Sinhala_lady_voice/metadata.csv'
output_file = ':/UOM/FYP/TTSx/Data/Sinhala_lady_voice/cleaned_metadata.csv'

clean_file(input_file, output_file)
