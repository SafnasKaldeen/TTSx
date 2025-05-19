import time
import imaplib
import email
import re
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os

# Gmail Credentials (Use environment variables for security)
GMAIL_USER = "safnasthegreat@gmail.com"
GMAIL_PASS = "vnrx knlh znov axaa"  # Use an App Password if you have 2FA enabled

# Adobe Password
ADOBE_PASSWORD = "CyberFlash2000@"

# Folder to save the downloaded files   
DOWNLOAD_FOLDER = "E:/UOM/FYP/TTSx/DAE/EnhancedFiles"

# Function to fetch OTP from Gmail
def get_latest_otp():
    try:
        # Connect to Gmail
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(GMAIL_USER, GMAIL_PASS)
        mail.select("inbox")
        
        # Search for recent emails from Adobe
        status, messages = mail.search(None, '(FROM "adobe.com")')
        mail_ids = messages[0].split()

        if not mail_ids:
            print("No email found from Adobe.")
            return None

        # Fetch the latest email
        latest_mail_id = mail_ids[-1]  # Get the last email
        status, data = mail.fetch(latest_mail_id, "(RFC822)")

        for response_part in data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])

                # Extract Subject, From, and Date
                email_subject = msg["Subject"]
                email_from = msg["From"]
                email_date = msg["Date"]

                # Print email details
                print(f"\n📧 **Last Email Details:**")
                print(f"   📌 Subject: {email_subject}")
                print(f"   🏢 From: {email_from}")
                print(f"   ⏳ Received at: {email_date}")

                # Extract email body
                email_body = ""
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == "text/plain":
                            email_body = part.get_payload(decode=True).decode()
                            break
                        elif part.get_content_type() == "text/html":  # Fallback to HTML
                            email_body = part.get_payload(decode=True).decode()
                else:
                    email_body = msg.get_payload(decode=True).decode()

                # Print the email body
                print("\n📄 **Email Body:**")
                print(email_body)

                # Find OTP using regex
                otp_match = re.search(r"\b\d{6}\b", email_body)
                if otp_match:
                    latest_otp = otp_match.group(0)
                    print(f"✅ Found OTP: {latest_otp}")
                    return latest_otp  # Return the OTP

        print("❌ No valid OTP found.")
        return None

    except Exception as e:
        print(f"❌ Error fetching OTP: {e}")
        return None


# Set up Selenium WebDriver
options = webdriver.ChromeOptions()
prefs = {
    "download.default_directory": DOWNLOAD_FOLDER,  # Set predefined download location
    "download.prompt_for_download": False,  # Disable the download prompt
    "download.directory_upgrade": True,
    "safebrowsing.enabled": True,  # Allow safe downloads
}
options.add_experimental_option("detach", True)
options.add_experimental_option("prefs", prefs)

driver = webdriver.Chrome(options=options)

# Open Adobe Podcast Enhance login page
driver.get("https://podcast.adobe.com/enhance")

try:
    # Click "Sign in"
    sign_in_button = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'Sign in')]"))
    )
    sign_in_button.click()

    # Enter Email
    email_input = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.ID, "EmailPage-EmailField"))
    )
    email_input.send_keys(GMAIL_USER)

    # Click "Continue"
    continue_button = WebDriverWait(driver, 5).until(
        EC.element_to_be_clickable((By.XPATH, "//button[@data-id='EmailPage-ContinueButton']"))
    )
    continue_button.click()

    print("⏳ Waiting for OTP...")

    # Capture the current time when "Continue" is clicked
    start_time = time.time()

    # Wait until the "Continue" button is clicked
    continue_button = WebDriverWait(driver, 60).until(
        EC.element_to_be_clickable((By.XPATH, "//button[@data-id='Page-PrimaryButton']"))
    )
    continue_button.click()
    
    # Wait for OTP
    otp_code = None
    retry_count = 0
    time.sleep(60)  # Wait for 2 seconds
    while retry_count < 12:  # Retry every 5 seconds, for a total of 1 minute
        otp_code = get_latest_otp()
        if otp_code:
            # Fill each OTP digit in the respective input fields
            for i, digit in enumerate(otp_code):
                otp_input = WebDriverWait(driver, 10).until(
                    EC.visibility_of_element_located((By.CSS_SELECTOR, f"input[data-index='{i}']"))
                )
                otp_input.send_keys(digit)

            # # Click "Verify" or "Submit"
            # verify_button = WebDriverWait(driver, 5).until(
            #     EC.element_to_be_clickable((By.XPATH, "//button[data-id='PasswordPage-ContinueButton']"))
            # )
            # verify_button.click()

            print("✅ OTP entered and verified successfully!")
            break
        retry_count += 1
        print(f"🔄 Retrying... ({retry_count}/12)")

        # Introduce a delay before retrying
        time.sleep(5)  # Wait for 5 seconds before retrying

    else:
        print("❌ Failed to retrieve OTP.")

    # Wait until the password input field is visible
    password_input = WebDriverWait(driver, 20).until(
        EC.visibility_of_element_located((By.ID, "PasswordPage-PasswordField"))
    )

    print("🔒 Password field found")

    # Enter the password
    password_input.send_keys(ADOBE_PASSWORD)
    print("🔑 Password entered successfully!")

    # Locate and click the login button
    login_button = WebDriverWait(driver, 5).until(
        EC.element_to_be_clickable((By.XPATH, "//button[@data-id='PasswordPage-ContinueButton']"))
    )
    login_button.click()

    try:
        not_now_button = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, "//button[@data-id='spectrum-Button spectrum-Button--secondary']"))
        )
        not_now_button.click()
        print("🔓 Logged in successfully!")
    except Exception as e:
        print("⚠️ 'Not Now' button not found or not clickable. Proceeding without clicking.")


except Exception as e:
    print("❌ Error:", e)

# Keep browser open for debugging
# input("Press Enter to exit...")
# driver.quit()

# Function to upload the audio file
def Enhance(file_path):
    try:
        # Wait until the "Choose files" button is clickable and click it
        choose_files_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//sp-button[contains(text(), 'Choose files')]"))
        )
        choose_files_button.click()

        # Wait for the hidden file input field to be available
        file_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "enhance-file-upload"))
        )

        # Send the file path directly to the file input field
        file_input.send_keys(file_path)

        # Wait for download link to appear
        download_button = WebDriverWait(driver, 60).until(
            EC.element_to_be_clickable((By.XPATH, "//a[contains(@download, '.wav')]"))  # Adjust if necessary
        )
        download_button.click()

        print(f"✅ Successfully enhanced and downloaded: {file_path}")

    except Exception as e:
        print(f"❌ Error during enhancement: {e}")


# Folder Monitoring Loop (Check every 5 seconds)
MONITOR_FOLDER_PATH = "E:/UOM/FYP/TTSx/DAE/FileToBeEnhanced"

try:
    print("\n⏳ Monitoring folder... Press Ctrl+C to stop.")
    last_checked = None  # Variable to track folder changes
    while True:
        # Get list of files in the folder
        files_in_folder = os.listdir(MONITOR_FOLDER_PATH)

        # Check if folder contents have changed (simple check: whether the contents are the same as last time)
        if files_in_folder != last_checked:
            # No change in folder contents
            if last_checked is not None:
                print("🔄 Folder contents have changed!")
                new_files = set(files_in_folder) - set(last_checked)
            else:
                new_files = set(files_in_folder)
            if new_files:
                print(f"\n📁 New files detected: {new_files}")
                Enhance(os.path.join(MONITOR_FOLDER_PATH, new_files.pop()))

            # Predefined message you want to print
            print("✅ Folder contents have changed! Monitoring the folder...")
            last_checked = files_in_folder
        # Wait for 5 seconds before checking again
        time.sleep(5)

except KeyboardInterrupt:
    driver.quit()
    print("\n❌ Monitoring stopped by user.")

