from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import time
import logging
from services.tts_model import TTSModel
from services.VoiceClone import VoiceCloner

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ModelInferenceRouter = APIRouter()

class ModelInput(BaseModel):
    preprocessed_text: str
    speakerID: str

class VoiceCloningInput(BaseModel):
    ReferenceWAV: str
    TargetWAV: str

@ModelInferenceRouter.post("/infer-tts")
def infer_tts(input_data: ModelInput):
    start_time = time.time()
    # Use the speakerID and preprocessed_text from the incoming request
    speakerID = input_data.speakerID
    preprocessed_text = input_data.preprocessed_text
    
    print("Audio synthesize started")
    try:
        # Pass speakerID and preprocessed_text dynamically
        tts_model = TTSModel(speakerID, preprocessed_text)
        if not tts_model:
            raise HTTPException(status_code=500, detail="Failed to load TTS model.")

        logger.info(f"TTS model loaded for speaker: {speakerID}")

        # Generate speech with the provided data
        response = tts_model.generate_speech()
        
        response["processing_time"] = round(time.time() - start_time, 2)

        if response["status"] == "error":
            raise HTTPException(status_code=500, detail=response["message"])

        return response

    except Exception as e:
        logger.exception("TTS inference error")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@ModelInferenceRouter.post("/Clone-tts")
def clone_tts(input_data: VoiceCloningInput):
    start_time = time.time()
    print("Voice Cloning started")
    try:
        # Correct the initialization of VoiceCloner to use the right parameters
        voice_cloner = VoiceCloner(referenceWAV=input_data.TargetWAV, targetWAV=input_data.ReferenceWAV)
        if not voice_cloner:
            raise HTTPException(status_code=500, detail="Failed to load Voice Cloner model.")

        # Removed the incorrect reference to input_data.speakerID
        response = voice_cloner.clone_speech()
        response["processing_time"] = round(time.time() - start_time, 2)

        if response["status"] == "error":
            raise HTTPException(status_code=500, detail=response["message"])

        return response

    except Exception as e:
        logger.exception("Voice Cloning inference error")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# # Example usage
# if __name__ == "__main__":
#     speaker_id = "LJ_BaseModel_Oshadi"
#     preprocessed_text = "ægē ekama aramuṇa vennet taman karana kaṭayutta tuḷa paripūrṇatvayaṭa pat vennayi"
#     tts = TTSModel(speakerID=speaker_id, preprocessed_text=preprocessed_text)
#     response = tts.generate_speech()
#     print(response)