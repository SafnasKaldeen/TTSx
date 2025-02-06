import torch
import torch.nn as nn
import librosa
import numpy as np
import soundfile as sf

# Redefining the WaveUNet class
class WaveUNet(nn.Module):
    def __init__(self, num_channels=1):
        super(WaveUNet, self).__init__()
        
        # Encoder layers
        self.encoder1 = nn.Conv1d(num_channels, 64, kernel_size=15, stride=1, padding=7)
        self.encoder2 = nn.Conv1d(64, 128, kernel_size=15, stride=1, padding=7)
        self.encoder3 = nn.Conv1d(128, 256, kernel_size=15, stride=1, padding=7)
        self.encoder4 = nn.Conv1d(256, 512, kernel_size=15, stride=1, padding=7)

        # Decoder layers
        self.decoder4 = nn.Conv1d(512, 256, kernel_size=15, stride=1, padding=7)
        self.decoder3 = nn.Conv1d(256, 128, kernel_size=15, stride=1, padding=7)
        self.decoder2 = nn.Conv1d(128, 64, kernel_size=15, stride=1, padding=7)
        self.decoder1 = nn.Conv1d(64, num_channels, kernel_size=15, stride=1, padding=7)

        # Pooling and Unpooling layers
        self.pool = nn.MaxPool1d(2)
        self.unpool = nn.Upsample(scale_factor=2, mode='linear', align_corners=False)

    def forward(self, x):
        # Encoder forward pass
        x1 = torch.relu(self.encoder1(x))
        x2 = torch.relu(self.encoder2(self.pool(x1)))
        x3 = torch.relu(self.encoder3(self.pool(x2)))
        x4 = torch.relu(self.encoder4(self.pool(x3)))

        # Decoder forward pass
        x = self.unpool(x4)
        x = torch.relu(self.decoder4(x))
        x = self.unpool(x)
        x = torch.relu(self.decoder3(x))
        x = self.unpool(x)
        x = torch.relu(self.decoder2(x))
        x = self.unpool(x)
        x = self.decoder1(x)  # Output layer

        return x

# Load the trained model
model = WaveUNet(num_channels=1)  # Define the model
model.load_state_dict(torch.load("wave_unet_denoising.pth"))  # Load the trained weights
model.eval()  # Set the model to evaluation mode

# Audio processing function for inference
def process_audio_for_inference(audio_file, sample_rate=16000, fixed_length=16000):
    """
    Loads an audio file, pads or truncates it to the fixed length, and converts it to a tensor.
    """
    # Load the audio file (make sure it matches the training sample rate)
    audio, _ = librosa.load(audio_file, sr=sample_rate)
    
    # Pad or truncate the audio to the fixed length (e.g., 10 seconds at 16000 Hz)
    audio = np.pad(audio, (0, max(0, fixed_length - len(audio))), mode='constant')[:fixed_length]
    
    # Convert to a PyTorch tensor and add batch and channel dimensions
    return torch.tensor(audio, dtype=torch.float32).unsqueeze(0).unsqueeze(0)  # [batch, channel, length]

# Perform inference on a noisy audio file
def denoise_audio(noisy_audio_file):
    """
    Loads a noisy audio file, processes it, performs denoising, and saves the result.
    """
    # Prepare the noisy audio for inference
    noisy_input = process_audio_for_inference(noisy_audio_file)

    # Perform inference (disable gradient computation during inference)
    with torch.no_grad():
        denoised_output = model(noisy_input)

    # Convert the tensor back to a numpy array and save it as a .wav file
    denoised_audio = denoised_output.squeeze().cpu().numpy()

    # Save the denoised audio as a .wav file
    sf.write("denoised_audio.wav", denoised_audio, 16000)  # Save with the same sample rate as the input
    print("Denoised audio saved as 'denoised_audio.wav'")

# Example usage
noisy_audio_file = "E:/UOM/FYP/TTSx/Training/Sinhala/Audios/checkpoint_70000.wav"  # Path to the noisy audio file
denoise_audio(noisy_audio_file)  # Perform denoising and save the output
