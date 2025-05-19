import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.text_processing import TextProcessingRouter
from routes.ModelInference import ModelInferenceRouter
from routes.AudioEnhancing import AudioEnhancingRouter

app = FastAPI()

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    print("Root endpoint accessed")
    return {"message": "Welcome to Sinhala Text Processing API!"}

# Include the routers
app.include_router(TextProcessingRouter, prefix="/api")
app.include_router(ModelInferenceRouter, prefix="/api")
app.include_router(AudioEnhancingRouter, prefix="/api")

