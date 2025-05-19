from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import WebDriverException
import time

class WebDriverManager:
    _driver = None  # Singleton WebDriver instance

    @classmethod
    def get_driver(cls):
        """
        Returns a singleton instance of the WebDriver.
        If it's not initialized, create a new one with retry logic.
        """
        if cls._driver is None:
            retries = 3
            for attempt in range(retries):
                try:
                    options = Options()
                    options.add_argument("--headless")
                    options.add_argument("--disable-gpu")
                    options.add_argument("--no-sandbox")
                    options.add_argument("--disable-dev-shm-usage")
                    # options.add_argument("--enable-unsafe-swiftshader")  # Forces using SwiftShader for WebGL rendering
                    cls._driver = webdriver.Chrome(options=options)

                    # cls._driver.implicitly_wait(60)
                    print("WebDriver initialized successfully.")
                    break
                except WebDriverException as e:
                    print(f"Attempt {attempt + 1} failed: {e}")
                    time.sleep(2)  # Wait before retrying
            else:
                print("Failed to initialize WebDriver after multiple attempts.")
        return cls._driver

    @classmethod
    def close_driver(cls):
        """Closes and resets the WebDriver instance."""
        if cls._driver:
            try:
                cls._driver.quit()
                print("WebDriver closed successfully.")
            except Exception as e:
                print(f"Error closing WebDriver: {e}")
            finally:
                cls._driver = None
