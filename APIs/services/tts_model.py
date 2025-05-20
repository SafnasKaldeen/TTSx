import os
import subprocess
import sys
import io
from TTS.api import TTS
import torch
import subprocess

# ANSI escape codes for text color
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
RESET = "\033[0m"  
BLUE = "\033[94m"

# Set the default encoding to UTF-8 for better handling of Unicode characters
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class TTSModel:
    def __init__(self, speakerID: str, preprocessed_text: str):
        """
        Initialize or load your pre-trained TTS model using Coqui TTS.
        speakerID is used to select the appropriate model.
        """
        self.speakerID = speakerID  # Store speakerID
        self.preprocessed_text = preprocessed_text
        self.model = self.load_model()

    def load_model(self):
        """
        Load the pre-trained TTS model using Coqui TTS based on the speakerID.
        Here, you should modify this to select the appropriate model file.
        """
        # self.model_path = f"E:/UOM/FYP/TTSx/Model/{self.speakerID}/best_model.pth"
        # self.config_path = f"E:/UOM/FYP/TTSx/Model/{self.speakerID}/config.json"
        self.model_path = f"E:/UOM/FYP/TTSx/Model/LJ_Dinithi/best_model.pth"
        self.config_path = f"E:/UOM/FYP/TTSx/Model/LJ_Dinithi/config.json"
        self.out_path = f"E:/UOM/FYP/TTSx/UI/client/public/Audios/InitialInference.wav"
    
        try:
            # Check if the model and config files exist
            if not os.path.exists(self.model_path) or not os.path.exists(self.config_path):
                print(f"Model file {self.model_path} or {self.config_path} not found")
                raise FileNotFoundError("Model file not found")
            
            # Avoid the torch.load warning by setting weights_only=True
            torch.load(self.model_path, map_location="cpu", weights_only=True)

        except FileNotFoundError as e:
            raise Exception(f"Failed to load TTS model: {str(e)}")

    def generate_speech(self):
        """
        Generates speech from the input text using the loaded TTS model.
        Returns the audio as bytes (e.g., WAV format).
        """
        
        try:    
            # Construct and execute the command
            command = (
                f'tts --text "{self.preprocessed_text}" '
                f'--model_path "{self.model_path}" '
                f'--config_path "{self.config_path}" '
                f'--out_path "{self.out_path}" '
                # f'--speaker_id "{speaker_id}"' 
            )

            print(f"{BLUE}\nExecuted: {command} Successfully\n{RESET}")

            os.system(command)    
            
            if os.path.exists(self.out_path):
                print(f"{GREEN}\nAudio saved to: {self.out_path}\n{RESET}")
                return {
                    "status": "success",
                    "message": "TTS generation completed successfully",
                    "audio_path": self.out_path,
                }
            else:
                return {
                    "status": "error",
                    "message": "TTS failed; output file not created",
                    "audio_path": None,
                }
        except Exception as e:
            print(f"{RED}\nError encountered with checkpoint {self.model_path}: {e}\n{RESET}")
            return {
                "status": "error",
                "message": f"Exception occurred: {str(e)}",
                "audio_path": None,
                "logs": None
            }

# # Example usage
# if __name__ == "__main__":
#     speaker_id = "LJ_BaseModel_Oshadi"  
#     preprocessed_text = "ægē ekama aramuṇa vennet taman karana kaṭayutta tuḷa paripūrṇatvayaṭa pat vennayi" 
#     tts = TTSModel(speakerID=speaker_id, preprocessed_text=preprocessed_text)
#     tts.generate_speech()
