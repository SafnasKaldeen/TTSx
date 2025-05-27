import re
import logging
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from datetime import datetime

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
    """
    Checks if the given text includes any valid date or time patterns.
    """
    date_patterns = [
        r"\b\d{4}-\d{2}-\d{2}\b",  # YYYY-MM-DD
        r"\b\d{2}-\d{2}-\d{4}\b",  # DD-MM-YYYY
        r"\b\d{2}/\d{2}/\d{4}\b",  # DD/MM/YYYY
        r"\b\d{4}/\d{2}/\d{2}\b",  # YYYY/MM/DD
        r"\b\d{2}:\d{2}\b",        # HH:MM
        r"\b\d{2}:\d{2}:\d{2}\b",  # HH:MM:SS
    ]
    
    for pattern in date_patterns:
        if re.search(pattern, text.strip()):
            return True
    return False

def map_month_to_sinhala(date_text):
    """
    Replaces the month in the date string with its Sinhala equivalent.
    """
    patterns = [
        r"(\d{4})-(\d{2})-(\d{2})",  # YYYY-MM-DD
        r"(\d{2})-(\d{2})-(\d{4})",  # DD-MM-YYYY
        r"(\d{4})/(\d{2})/(\d{2})",  # YYYY/MM/DD
        r"(\d{2})/(\d{2})/(\d{4})",  # DD/MM/YYYY
    ]

    for pattern in patterns:
        match = re.search(pattern, date_text)
        if match:
            parts = match.groups()
            year, month, day = None, None, None
            if len(parts) == 3:
                if pattern.startswith(r"(\d{4})"):  # YYYY-MM-DD or YYYY/MM/DD
                    year, month, day = parts[0], parts[1], parts[2]
                else:  # DD-MM-YYYY or DD/MM/YYYY
                    day, month, year = parts[0], parts[1], parts[2]

            if month in SINHALA_MONTHS:
                sinhala_month = SINHALA_MONTHS[month]
                return date_text.replace(f"{year}/{month}/{day}", f"{year} {sinhala_month} {day}").replace("/", " ").replace("-", " ")
    
    return date_text

def normalize_sinhala_text(text, driver):
    """
    Normalizes Sinhala text:
    - Replaces multiple spaces with a single space
    - Removes unwanted symbols
    - Retains '/' and ':' only if it's a valid date or time
    """
    text = re.sub(r"\s+", " ", text.strip())  # Remove extra spaces
    unwanted_symbols = r'[!"#$%&*+;<=@\[\\\]^_`{|}~]'
    text = re.sub(unwanted_symbols, " ", text)

    if not contains_date_or_time(text):
        text = text.replace("/", " ").replace(":", " ")

    # Handle time conversion (HH:MM or HH:MM:SS format)
    time_patterns = [r"(\d{2}):(\d{2}):(\d{2})", r"(\d{2}):(\d{2})"]
    for pattern in time_patterns:
        match = re.search(pattern, text)
        if match:
            time_parts = match.groups()
            if len(time_parts) == 2:  # HH:MM format
                hour, minute = time_parts
                hour_sinhala = convert_number_to_sinhala(driver, hour)
                minute_sinhala = convert_number_to_sinhala(driver, minute)
                text = text.replace(f"{hour}:{minute}", f"පැය {hour_sinhala} විනාඩි {minute_sinhala}")
            elif len(time_parts) == 3:  # HH:MM:SS format
                hour, minute, second = time_parts
                hour_sinhala = convert_number_to_sinhala(driver, hour)
                minute_sinhala = convert_number_to_sinhala(driver, minute)
                second_sinhala = convert_number_to_sinhala(driver, second)
                text = text.replace(f"{hour}:{minute}:{second}", f"පැය {hour_sinhala} විනාඩි {minute_sinhala} තත්පර {second_sinhala}")

    return text

def convert_number_to_sinhala(driver, number):
    """
    Converts a number to Sinhala words using the TrackerDisk website.
    """
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

        WebDriverWait(driver, 10).until(
            lambda d: output_field.text.strip() or output_field.get_attribute("value").strip()
        )

        sinhala_words = output_field.get_attribute("value") or output_field.text.strip()
        return sinhala_words

    except Exception as e:
        logging.error(f"Error converting number {number} to Sinhala words: {e}")
        return number  # Return original number if conversion fails

def text_to_roman(driver, text):
    """
    Converts Sinhala text to Roman script using Selenium and an online tool.
    """
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
    """
    Preprocesses Sinhala text by:
    - Handling dates and months in Sinhala
    - Converting numbers to Sinhala words
    - Normalizing text
    - Converting to Roman script
    """
    if contains_date_or_time(text):
        text = map_month_to_sinhala(text)

    # Time conversion: Keep HH:MM and force seconds to 23
    text = re.sub(r"\b(\d{2}):(\d{2}):(\d{2})\b", lambda match: f"{match.group(1)}:{match.group(2)}:23", text)

    normalized_text = normalize_sinhala_text(text, driver)

    numbers_in_text = re.findall(r"\b\d+\b", normalized_text)
    for number in numbers_in_text:
        sinhala_word = convert_number_to_sinhala(driver, number)
        if sinhala_word:
            normalized_text = normalized_text.replace(f" {number} ", f" {sinhala_word} ")

    roman_text = text_to_roman(driver, normalized_text)

    # remove unwanted symbols except spaces, commas and full stops then collapse multiple spaces and trim
    roman_text = re.sub(r"[^\w\s,.]", "", roman_text)
    roman_text = re.sub(r"\s+", " ", roman_text).strip()

    return roman_text


# Run single-line Sinhala text processing
def process_sinhala_text(driver, input_text):
    """
    Runs the text preprocessing pipeline for a single Sinhala line.
    """

    try:
        processed_text = preprocess_sinhala_text(driver, input_text)
    except Exception as e:
        return f"Error: {e}"

    return processed_text

options = Options()
options.add_argument("--headless")
options.add_argument("--disable-gpu")

driver = webdriver.Chrome(options=options)

# Example Usage
input_text = "සිවු වන සීනය 2024/12/06 12:54:23 සීනය සීනය/සීනය:"
output_text = process_sinhala_text(driver, input_text)
print("Processed Text:", output_text)
