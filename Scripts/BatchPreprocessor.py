import re
import logging
import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

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
    """Checks if the given text includes any valid date or time patterns."""
    date_patterns = [
        r"\b\d{4}-\d{2}-\d{2}\b",  # YYYY-MM-DD
        r"\b\d{2}-\d{2}-\d{4}\b",  # DD-MM-YYYY
        r"\b\d{2}/\d{2}/\d{4}\b",  # DD/MM/YYYY
        r"\b\d{4}/\d{2}/\d{2}\b",  # YYYY/MM/DD
        r"\b\d{2}:\d{2}\b",        # HH:MM
        r"\b\d{2}:\d{2}:\d{2}\b",  # HH:MM:SS
    ]
    return any(re.search(pattern, text.strip()) for pattern in date_patterns)

def convert_number_to_sinhala(driver, number):
    """Converts a number to Sinhala words using an online tool via Selenium."""
    try:
        driver.get("https://trackerdisk.com/calculators/conversions/numbers-to-sinhala-words")

        input_field = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.NAME, "input-number"))
        )
        input_field.clear()
        input_field.send_keys(str(number))

        convert_button = driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
        convert_button.click()

        output_field = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "number-to-word"))
        )

        sinhala_words = output_field.get_attribute("value") or output_field.text.strip()
        return sinhala_words if sinhala_words else number

    except Exception as e:
        logging.error(f"Error converting number {number} to Sinhala words: {e}")
        return number

def text_to_roman(driver, text):
    """Converts Sinhala text to Roman script using an online tool."""
    try:
        driver.get("https://pitaka.lk/tools/converter.html")
        input_field = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.ID, "box1"))
        )
        output_field = driver.find_element(By.ID, "box2")
        input_field.clear()
        input_field.send_keys(text)

        convert_button = driver.find_element(By.CSS_SELECTOR, 'div#output-buttons a.button[script="ro"]')
        convert_button.click()

        result = output_field.get_attribute("value")
        return result if result else "Error"

    except Exception as e:
        logging.error(f"Error converting text to Roman: {text}\n{e}")
        return "Error"

def preprocess_sinhala_text(driver, text):
    """Preprocesses Sinhala text by handling dates, numbers, normalization, and Roman script conversion."""
    # Convert numbers
    numbers_in_text = re.findall(r"\b\d+\b", text)
    for number in numbers_in_text:
        sinhala_word = convert_number_to_sinhala(driver, number)
        if sinhala_word:
            text = text.replace(number, sinhala_word)

    # Convert to Roman script
    roman_text = text_to_roman(driver, text)

    # Remove unwanted symbols except spaces, commas, and full stops
    roman_text = re.sub(r"[^\w\s,.]", "", roman_text)
    roman_text = re.sub(r"\s+", " ", roman_text).strip()

    return roman_text

def process_csv(input_csv_path, output_csv_path):
    """Processes an entire CSV file by applying Sinhala text preprocessing."""
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    
    driver = webdriver.Chrome(options=options)

    try:
        df = pd.read_csv(input_csv_path, sep="|", header=None, names=["ID", "Sinhala_Text", "Romanized_Text"])

        # Process each row
        df["Preprocessed_Text"] = df["Sinhala_Text"].apply(lambda text: preprocess_sinhala_text(driver, text))

        df.to_csv(output_csv_path, sep="|", index=False, header=False)
        logging.info(f"Processed CSV saved to {output_csv_path}")

    finally:
        driver.quit()

# Example Usage
input_csv = "E:/UOM/FYP/TTSx/Data/Dinithi/combined_transcription.csv"
output_csv = "E:/UOM/FYP/TTSx/Data/Dinithi/metadata_preprocessed.csv"

process_csv(input_csv, output_csv)
print(f"Processing completed. Saved to {output_csv}")
