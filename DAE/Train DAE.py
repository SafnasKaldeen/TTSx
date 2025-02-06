import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import librosa
import numpy as np
from tqdm import tqdm
from torch.nn.utils.rnn import pad_sequence
import soundfile as sf  # For saving the denoised audio as a .wav file

# Hyperparameters
sample_rate = 16000  # 16 kHz sample rate
fixed_length = 16000  # Exactly 10 seconds (16000 samples)
batch_size = 8
num_epochs = 10
learning_rate = 0.0002

# Dataset Class
class AudioDataset(Dataset):
    def __init__(self, noisy_files, clean_files, transform=None):
        self.noisy_files = noisy_files
        self.clean_files = clean_files
        self.transform = transform

    def __len__(self):
        return len(self.noisy_files)

    def __getitem__(self, idx):
        # Load the noisy and clean audio files
        noisy, _ = librosa.load(self.noisy_files[idx], sr=sample_rate)
        clean, _ = librosa.load(self.clean_files[idx], sr=sample_rate)

        if self.transform:
            noisy = self.transform(noisy)
            clean = self.transform(clean)

        # Ensure the length is exactly 10 seconds (16000 samples)
        noisy = self._process_audio(noisy)
        clean = self._process_audio(clean)

        return torch.tensor(noisy, dtype=torch.float32), torch.tensor(clean, dtype=torch.float32)

    def _process_audio(self, audio):
        # Truncate or pad to the exact 10 seconds (16000 samples)
        if len(audio) > fixed_length:
            return audio[:fixed_length]  # Truncate
        else:
            pad_width = fixed_length - len(audio)
            return np.pad(audio, (0, pad_width), mode='constant')  # Pad with zeros

# WaveUNet Model Class
class WaveUNet(nn.Module):
    def __init__(self, num_channels=1):
        super(WaveUNet, self).__init__()
        self.encoders = nn.ModuleList([ 
            nn.Conv1d(num_channels, 16, kernel_size=15, stride=2, padding=7),
            nn.Conv1d(16, 32, kernel_size=15, stride=2, padding=7),
            nn.Conv1d(32, 64, kernel_size=15, stride=2, padding=7),
            nn.Conv1d(64, 128, kernel_size=15, stride=2, padding=7),
            nn.Conv1d(128, 256, kernel_size=15, stride=2, padding=7)
        ])

        self.decoders = nn.ModuleList([ 
            nn.ConvTranspose1d(256, 128, kernel_size=15, stride=2, padding=7, output_padding=1),
            nn.ConvTranspose1d(128, 64, kernel_size=15, stride=2, padding=7, output_padding=1),
            nn.ConvTranspose1d(64, 32, kernel_size=15, stride=2, padding=7, output_padding=1),
            nn.ConvTranspose1d(32, 16, kernel_size=15, stride=2, padding=7, output_padding=1),
            nn.ConvTranspose1d(16, num_channels, kernel_size=15, stride=2, padding=7, output_padding=1)
        ])

        self.activations = nn.ReLU(inplace=False)  # Non-inplace ReLU

    def forward(self, x):
        skips = []

        # Encoder path
        for encoder in self.encoders:
            x = encoder(x)
            x = self.activations(x)  # Apply ReLU activation without in-place operation
            skips.append(x)

        # Decoder path
        for i, decoder in enumerate(self.decoders):
            x = decoder(x)
            x = self.activations(x)  # Apply ReLU activation without in-place operation
            if i < len(self.decoders) - 1:  # Skip connections
                x = x + skips[-(i + 2)]  # Skip connections; avoid in-place

        return x

# Custom Collate Function for Padding
def collate_fn(batch):
    noisy, clean = zip(*batch)
    noisy = [torch.tensor(n, dtype=torch.float32) for n in noisy]
    clean = [torch.tensor(c, dtype=torch.float32) for c in clean]

    # Pad sequences to the same length (although they should already be the same length now)
    noisy = pad_sequence(noisy, batch_first=True)
    clean = pad_sequence(clean, batch_first=True)
    return noisy, clean

# DataLoader Preparation
def prepare_data(noisy_dir, clean_dir):
    noisy_files = sorted([os.path.join(noisy_dir, f) for f in os.listdir(noisy_dir) if f.endswith('.wav')])
    clean_files = sorted([os.path.join(clean_dir, f) for f in os.listdir(clean_dir) if f.endswith('.wav')])

    dataset = AudioDataset(noisy_files, clean_files)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True, collate_fn=collate_fn)
    return dataloader

# Training Loop
def train_model(model, dataloader, num_epochs, criterion, optimizer):
    model.train()
    for epoch in range(num_epochs):
        epoch_loss = 0.0
        for noisy, clean in tqdm(dataloader, desc=f"Epoch {epoch+1}/{num_epochs}"):
            noisy = noisy.unsqueeze(1)  # Add channel dimension
            clean = clean.unsqueeze(1)

            # Forward pass
            output = model(noisy)
            loss = criterion(output, clean)

            # Backward pass and optimization
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            epoch_loss += loss.item()

        print(f"Epoch {epoch+1}/{num_epochs}, Loss: {epoch_loss/len(dataloader):.4f}")

# Inference Function to Denoise Audio
def denoise_audio(model, audio_file, output_file):
    # Load the noisy audio
    noisy, _ = librosa.load(audio_file, sr=sample_rate)
    
    # Process the audio (truncate or pad to the fixed length)
    noisy = AudioDataset._process_audio(None, noisy)  # Using the same process_audio method
    
    # Convert to tensor and add batch and channel dimensions
    noisy_tensor = torch.tensor(noisy, dtype=torch.float32).unsqueeze(0).unsqueeze(0)
    
    # Switch model to evaluation mode
    model.eval()
    
    with torch.no_grad():  # Disable gradient calculation
        denoised_tensor = model(noisy_tensor)
    
    # Convert the denoised tensor back to numpy and normalize it
    denoised_audio = denoised_tensor.squeeze(0).squeeze(0).cpu().numpy()  # Remove batch and channel dims
    
    # Normalize the output audio to [-1, 1] range
    denoised_audio = np.clip(denoised_audio, -1.0, 1.0)
    
    # Save the denoised audio as a .wav file
    sf.write(output_file, denoised_audio, sample_rate)
    print(f"Denoised audio saved as {output_file}")

# Main Script
if __name__ == "__main__":
    # Paths to noisy and clean audio files
    noisy_dir = "E:/UOM/FYP/TTSx/DAE/Noisy Data"
    clean_dir = "E:/UOM/FYP/TTSx/DAE/Clean Data"

    # Prepare dataloader
    dataloader = prepare_data(noisy_dir, clean_dir)

    # Initialize model, loss function, and optimizer
    model = WaveUNet(num_channels=1)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=learning_rate)

    # Train the model
    train_model(model, dataloader, num_epochs, criterion, optimizer)

    # Save the trained model
    model_path = "wave_unet_denoising.pth"
    torch.save(model.state_dict(), model_path)
    print(f"Model saved as {model_path}")

    # Denoising a random noisy audio after training
    random_noisy_audio = "E:/UOM/FYP/TTSx/DAE/random_noisy.wav" 
    output_denoised_audio = "E:/UOM/FYP/TTSx/DAE/denoised_audio.wav"
    
    # Load the trained model
    model.load_state_dict(torch.load(model_path))
    
    # Denoise the audio
    denoise_audio(model, random_noisy_audio, output_denoised_audio)
