from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from services.denoise_service import clean_audio_service
from pydantic import BaseModel

AudioEnhancingRouter = APIRouter()

class AudioInput(BaseModel):
    file_path: str

@AudioEnhancingRouter.post("/clean_audio")
def cleanAudio(input_data: AudioInput):
    # Call the function to clean the audio
    print("Audio Enhancing procedure initiated")
    result = clean_audio_service(input_data.file_path)

    if result['status'] == 'success':
        return JSONResponse(content={
            "status": "success",
            "message": result['message'],
            "download_path": result['download_path']
        })
    else:
        return JSONResponse(content={"status": "error", "message": result['message']}, status_code=500)
