import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

from services.webdriver_manager import WebDriverManager
from Scripts.Preprocessor import preprocess_sinhala_text

TextProcessingRouter = APIRouter()

# Define request models
class TextInput(BaseModel):
    text: str

class BatchTextInput(BaseModel):
    texts: List[str]

try:
    driver = WebDriverManager.get_driver()
    print("Web Driver loaded successfully")
except Exception as e:
    print("Error occured with Loading web Driver")

# Optimized version of the preprocess function for a single text
@TextProcessingRouter.post("/preprocess")
def preprocess_text(input_data: TextInput):
    """
    API endpoint to preprocess a single Sinhala text.
    """
    print("Text Preprocessing pipeline started")
    # Initialize the WebDriver instance
    driver = WebDriverManager.get_driver()

    if driver is None:
        raise HTTPException(status_code=500, detail="Failed to initialize WebDriver instance for text processing.")

    start_time = time.time()  # Start time for processing

    try:
        # Process the input text
        processed_text = preprocess_sinhala_text(driver, input_data.text)
        if hasattr(processed_text, 'error'):  # Check if there is an error attribute
            raise HTTPException(status_code=400, detail=processed_text.error)
        
        end_time = time.time()  # End time for processing
        processing_time = end_time - start_time  # Calculate elapsed time

        try:
            WebDriverManager.close_driver()
            print("WebDriver closed successfully.")
        except Exception as e:
            print(f"Error closing WebDriver: {e}")

        return {
            "original_text": input_data.text, 
            "processed_text": processed_text,
            "processing_time_seconds": processing_time
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred during processing: {str(e)}")

# Sequential processing of batch texts
@TextProcessingRouter.post("/batch-preprocess")
def batch_preprocess_text(input_data: BatchTextInput):
    """
    API endpoint to preprocess multiple Sinhala texts in batch sequentially.
    """
    print("Batch Preprocessing pipeline started")
    processed_texts = []
    start_time = time.time()  # Start time for batch processing
    print(f"Processing {len(input_data.texts)} texts...")
    
    # Initialize the WebDriver once for the entire batch
    driver = WebDriverManager.get_driver()

    if driver is None:
        raise HTTPException(status_code=500, detail="Failed to initialize WebDriver instance for batch processing.")
    
    try:
        # Process each text sequentially
        for text in input_data.texts:
            try:
                # Process the individual text
                processed_text = preprocess_sinhala_text(driver, text)
                if hasattr(processed_text, 'error'):  # Check if there is an error attribute
                    processed_texts.append({"original_text": text, "error": processed_text.error})
                else:
                    processed_texts.append({"original_text": text, "processed_text": processed_text})
            except Exception as e:
                processed_texts.append({"original_text": text, "error": str(e)})

    finally:
        # Close the WebDriver after processing all texts
        WebDriverManager.close_driver()

    end_time = time.time()  # End time for batch processing
    processing_time = end_time - start_time  # Calculate elapsed time for the batch

    try:
        WebDriverManager.close_driver()
        print("WebDriver closed successfully.")
    except Exception as e:
        print(f"Error closing WebDriver: {e}")


    # Return the original and processed texts with the processing time
    return {
        # "original_texts": input_data.texts, 
        "processed_texts": processed_texts,
        "batch_processing_time_seconds": processing_time
    }
