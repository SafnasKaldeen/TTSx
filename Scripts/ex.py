# Example 1: Text with a valid date and time pattern (date should be mapped to Sinhala month)
input_text_1 = "2025-01-09 12:34:56"
print(f"Processing input: {input_text_1}")
preprocessed_text_1 = preprocess_sinhala_text(driver, input_text_1)
# Expected Output:
# [INFO] Found a date/time in text: 2025-01-09 12:34:56
# [INFO] Date mapped to Sinhala months: 2025-01-09 12:34:56

# Example 2: Text without date/time (normal Sinhala text)
input_text_2 = "මහේෂ් මට කෝපි දෙන්න"
print(f"Processing input: {input_text_2}")
preprocessed_text_2 = preprocess_sinhala_text(driver, input_text_2)
# Expected Output:
# [INFO] No date/time found. Converting text to Roman: මහේෂ් මට කෝපි දෙන්න
# [INFO] Text converted to Roman: Mahesh mata kopi denna
# [INFO] Normalized Roman text: Mahesh mata kopi denna

# Example 3: Another normal Sinhala sentence
input_text_3 = "ආයුබෝවන්, කුමාර"
print(f"Processing input: {input_text_3}")
preprocessed_text_3 = preprocess_sinhala_text(driver, input_text_3)
# Expected Output:
# [INFO] No date/time found. Converting text to Roman: ආයුබෝවන්, කුමාර
# [INFO] Text converted to Roman: Ayubowan, Kumara
# [INFO] Normalized Roman text: Ayubowan, Kumara

# Example 4: Text with multiple date/time values (should be handled correctly)
input_text_4 = "2025-01-09 10:15:30 and 2024-12-31 08:45:00"
print(f"Processing input: {input_text_4}")
preprocessed_text_4 = preprocess_sinhala_text(driver, input_text_4)
# Expected Output:
# [INFO] Found a date/time in text: 2025-01-09 10:15:30
# [INFO] Date mapped to Sinhala months: 2025-01-09 10:15:30
# [INFO] Found a date/time in text: 2024-12-31 08:45:00
# [INFO] Date mapped to Sinhala months: 2024-12-31 08:45:00

# Example 5: Error in Roman conversion (simulate an issue with a random string)
input_text_5 = "invalid text"
print(f"Processing input: {input_text_5}")
preprocessed_text_5 = preprocess_sinhala_text(driver, input_text_5)
# Expected Output:
# [INFO] No date/time found. Converting text to Roman: invalid text
# [ERROR] Error converting text to Roman: invalid text

# Example 6: CSV processing loop (processing multiple rows from CSV)
csv_input = [
    ("1", "මහේෂ් මට කෝපි දෙන්න"),
    ("2", "2025-01-09 12:34:56"),
    ("3", "ආයුබෝවන්, කුමාර")
]
for index, (row_id, transcription) in enumerate(csv_input):
    print(f"Processing row {index + 1}/{len(csv_input)}: {transcription}")
    processed_text = preprocess_sinhala_text(driver, transcription)
    print(f"Processed text: {processed_text}")
# Expected Output:
# [INFO] Processing row 1/3: මහේෂ් මට කෝපි දෙන්න
# [INFO] No date/time found. Converting text to Roman: මහේෂ් මට කෝපි දෙන්න
# [INFO] Text converted to Roman: Mahesh mata kopi denna
# [INFO] Normalized Roman text: Mahesh mata kopi denna
# [INFO] Processing row 2/3: 2025-01-09 12:34:56
# [INFO] Found a date/time in text: 2025-01-09 12:34:56
# [INFO] Date mapped to Sinhala months: 2025-01-09 12:34:56
# [INFO] Processing row 3/3: ආයුබෝවන්, කුමාර
# [INFO] No date/time found. Converting text to Roman: ආයුබෝවන්, කුමාර
# [INFO] Text converted to Roman: Ayubowan, Kumara
# [INFO] Normalized Roman text: Ayubowan, Kumara

# Example 7: Empty row (should be skipped and logged)
input_text_6 = "   "
print(f"Processing input: {input_text_6}")
preprocessed_text_6 = preprocess_sinhala_text(driver, input_text_6)
# Expected Output:
# [INFO] Skipping empty row:  
