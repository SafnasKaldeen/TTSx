import os
import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from tqdm import tqdm
import re
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Sinhala month mapping
SINHALA_MONTHS = {
    "01": "ජනවාරි",
    "02": "පෙබරවාරි",
    "03": "මාර්තු",
    "04": "අප්‍රේල්",
    "05": "මැයි",
    "06": "ජූනි",
    "07": "ජූලි",
    "08": "අගෝස්තු",
    "09": "සැප්තැම්බර්",
    "10": "ඔක්තෝබර්",
    "11": "නොවැම්බර්",
    "12": "දෙසැම්බර්"
}

def contains_date_or_time(text):
    """
    Checks if the given text includes any valid date or time patterns.
    """
    date_patterns = [
        r'\b\d{4}-\d{2}-\d{2}\b',  # YYYY-MM-DD
        r'\b\d{2}-\d{2}-\d{4}\b',  # DD-MM-YYYY
        r'\b\d{2}/\d{2}/\d{4}\b',  # DD/MM/YYYY
        r'\b\d{4}/\d{2}/\d{2}\b',  # YYYY/MM/DD
        r'\b\d{2}:\d{2}\b',        # HH:MM
        r'\b\d{2}:\d{2}:\d{2}\b',  # HH:MM:SS
    ]
    
    for pattern in date_patterns:
        if re.search(pattern, text.strip()):
            return True
    return False

def map_month_to_sinhala(date_text):
    """
    Replaces the month in the date string with its Sinhala equivalent.
    """
    # Adjusted regex to better capture date-time formats with both date and time
    patterns = [
        r'(\d{4})-(\d{2})-(\d{2})',  # YYYY-MM-DD
        r'(\d{2})-(\d{2})-(\d{4})',  # DD-MM-YYYY
        r'(\d{4})/(\d{2})/(\d{2})',  # YYYY/MM/DD
        r'(\d{2})/(\d{2})/(\d{4})',  # DD/MM/YYYY
        r'(\d{4})/(\d{2})/(\d{2}) (\d{2}):(\d{2}):(\d{2})'  # YYYY/MM/DD HH:MM:SS
    ]

    for pattern in patterns:
        match = re.search(pattern, date_text)
        if match:
            parts = match.groups()
            year, month, day = None, None, None
            if len(parts) == 3:
                if pattern.startswith(r'(\d{4})'):  # YYYY-MM-DD or YYYY/MM/DD
                    year, month, day = parts[0], parts[1], parts[2]
                else:  # DD-MM-YYYY or DD/MM/YYYY
                    day, month, year = parts[0], parts[1], parts[2]
            elif len(parts) == 6:  # For the full datetime with time
                year, month, day = parts[0], parts[1], parts[2]

            # print(f'{year, month, day}')

            if month in SINHALA_MONTHS:
                sinhala_month = SINHALA_MONTHS[month]

                # print(date_text.replace('/', ' ').replace(':', ' ').replace(f'{year} {month} {day}' , f'{year} {sinhala_month} {day}'))
                return date_text.replace('/', ' ').replace(':', ' ').replace(f'{year} {month} {day}' , f'{year} {sinhala_month} {day}')
    
    return date_text

def normalize_sinhala_text(text):
    """
    Normalizes Sinhala text by:
    - Replacing multiple spaces with a single space
    - Removing unwanted symbols
    - Retaining '/' and ':' if the text is a valid date or time, otherwise removing them
    """
    text = re.sub(r'\s+', ' ', text.strip())  # Replace multiple spaces
    unwanted_symbols = r'[!"#$%&*+;<=@\[\\\]^_`{|}~]'
    text = re.sub(unwanted_symbols, ' ', text)
    # print("roman contains date or time" , text)
    if not contains_date_or_time(text):
        text = text.replace('/', ' ').replace(':', ' ')  # Remove '/' and ':'
    return text

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def convert_number_to_sinhala(driver, number):
    """
    Converts a number to Sinhala words using the TrackerDisk website.
    """
    try:
        # Navigate to the conversion page
        driver.get("https://trackerdisk.com/calculators/conversions/numbers-to-sinhala-words")

        # Wait for the input field to be visible
        input_field = WebDriverWait(driver, 15).until(
            EC.visibility_of_element_located((By.NAME, 'input-number'))
        )
        
        # Enter the number to be converted
        input_field.clear()
        input_field.send_keys(str(number))

        # Click the 'Convert' button
        convert_button = driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
        convert_button.click()

        # Wait for the output field to contain non-empty text
        output_field = WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.ID, 'number-to-word'))
        )

        # Ensure output field is not empty by checking its text or value attribute
        WebDriverWait(driver, 15).until(
            lambda d: output_field.text.strip() or output_field.get_attribute("value").strip()
        )

        # Extract the result
        sinhala_words = output_field.get_attribute("value") or output_field.text.strip()
        return sinhala_words

    except Exception as e:
        logging.error(f"Error converting number {number} to Sinhala words: {e}")
        return None

def text_to_roman(driver, text):
    """
    Converts Sinhala text to Roman script using Selenium and an online tool.
    """
    try:
        driver.get("https://pitaka.lk/tools/converter.html")
        input_field = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.ID, 'box1'))
        )
        output_field = driver.find_element(By.ID, 'box2')
        input_field.clear()
        input_field.send_keys(text)
        convert_button = driver.find_element(By.CSS_SELECTOR, 'div#output-buttons a.button[script="ro"]')
        convert_button.click()
        result = output_field.get_attribute("value")
        return result
    except Exception as e:
        logging.error(f"Error converting text to Roman: {text}\n{e}")
        return "Error"

def preprocess_sinhala_text(driver, text):
    """
    Preprocesses Sinhala text by handling date/time, converting numbers to Sinhala words,
    converting to Roman script, and normalizing.
    """
    # Step 1: Handle date/time mappings
    if contains_date_or_time(text):
        text = map_month_to_sinhala(text)

    # print("Text after date/time handling:", text)

    # Step 4: Normalize the Romanized text
    normalized_text = normalize_sinhala_text(text).replace('/', ' ').replace(':', ' ')
    # print("normalized " ,normalized_text)
    
    numbers_in_text = re.findall(r'\b\d+\b', normalized_text)  # Find all standalone numbers
    text = normalized_text
    for number in numbers_in_text:
        sinhala_word = convert_number_to_sinhala(driver, number)
        # print(sinhala_word)
        if sinhala_word:
            text = text.replace(f" {number} ",f" {sinhala_word} ")  # Replace number with Sinhala equivalent
            # print(text)

     # Step 3: Convert text to Roman script
    roman_text = text_to_roman(driver, text)  
  
    # print("Text after number conversion:", roman_text)

    return roman_text

def process_csv(metadata_path, output_path):
    """
    Processes a CSV file, applies text preprocessing, and saves the output.
    """
    df = pd.read_csv(metadata_path, sep='|', header=None, names=["id", "transcription"])
    cleaned_data = []

    options = Options()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    driver = webdriver.Chrome(options=options)

    print(preprocess_sinhala_text(driver, "සිවු වන සීනය 2024/12/06 12:54:23 සීනය සීනය/සීනය:"))

    # try:
    #     for _, row in tqdm(df.iterrows(), total=len(df), desc="Processing rows"):
    #         original_text = row['transcription']
    #         if pd.isna(original_text) or not original_text.strip():
    #             logging.warning("Skipping empty row")
    #             cleaned_data.append("Error")
    #             continue
    #         try:
    #             cleaned_text = preprocess_sinhala_text(driver, original_text)
    #         except Exception as e:
    #             logging.error(f"Error processing text: {original_text}\n{e}")
    #             cleaned_text = "Error"
    #         cleaned_data.append(cleaned_text)
    # finally:
    #     driver.quit()

    df['cleaned_transcription'] = cleaned_data
    df.to_csv(output_path, sep='|', index=False, header=False)
    logging.info(f"Processed CSV saved to {output_path}")

if __name__ == "__main__":
    metadata_file = "E:/UOM/FYP/TTSx/Data/OpeSLR/metadata.csv"
    output_file = "E:/UOM/FYP/TTSx/Data/OpeSLR/processed_metadata.csv"
    process_csv(metadata_file, output_file)
