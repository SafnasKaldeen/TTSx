import os
import subprocess
import logging
import torch

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ANSI escape codes for text color
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
RESET = "\033[0m"  
BLUE = "\033[94m"

class VoiceCloner:
    def __init__(self, referenceWAV: str, targetWAV: str):
        self.referenceWAV = referenceWAV  
        self.targetWAV = targetWAV
        self.model = self.load_model()

    def load_model(self):
        self.model_path = f"E:/UOM/FYP/TTSx/Model/VoiceConversionModel/model_file.pth"
        self.config_path = f"E:/UOM/FYP/TTSx/Model/VoiceConversionModel/config.json"
        self.out_path = f"E:/UOM/FYP/TTSx/UI/ttsx/public/Audios/FinalInference.wav"

        if not os.path.exists(self.model_path) or not os.path.exists(self.config_path):
            logger.error(f"Model file {self.model_path} or {self.config_path} not found")
            raise FileNotFoundError("Model file not found")

        try:
            # Load the model
            torch.load(self.model_path, map_location="cpu", weights_only=True)
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise Exception(f"Failed to load TTS model: {str(e)}")

    def clone_speech(self):
        try:    
            command = (
                f'tts --reference_wav "{self.referenceWAV}" '
                f'--model_path "{self.model_path}" '
                f'--config_path "{self.config_path}" '
                f'--speaker_wav "{self.targetWAV}" '
                f'--out_path "{self.out_path}" '
                f'--language_idx "en" ' 
            )

            print(f"{BLUE}\nExecuted: {command} Successfully\n{RESET}")
            result = os.system(command)
            
            if result != 0:
                raise Exception(f"Command failed with exit code {result}")

            if os.path.exists(self.out_path):
                logger.info(f"Audio saved to: {self.out_path}")
                return {
                    "status": "success",
                    "message": "Voice cloning completed successfully",
                    "audio_path": self.out_path,
                }
            else:
                logger.error("Failed to clone voice, output file not found.")
                return {
                    "status": "error",
                    "message": "Failed to clone voice",
                    "audio_path": None,
                }
        except Exception as e:
            logger.error(f"Error during voice cloning: {e}")
            return {
                "status": "error",
                "message": f"Exception occurred: {str(e)}",
                "audio_path": None,
                "logs": None
            }

# if __name__ == "__main__":
#     referenceWAV = "E:/UOM/FYP/TTSx/APIs/Audios/InitialInference.wav"
#     targetWAV = "E:/UOM/FYP/TTSx/APIs/Audios/SpeakerReference.wav" 
#     voice_cloner = VoiceCloner(referenceWAV=referenceWAV, targetWAV=targetWAV)
#     voice_cloner.clone_speech()
