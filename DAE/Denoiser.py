import noisereduce as nr
from scipy.io import wavfile
import numpy as np

# Load the noisy audio file
rate, data = wavfile.read("E:/UOM/FYP/TTSx/Safnas3.wav")

# Apply noise reduction with optimized parameters
reduced_noise = nr.reduce_noise(
    y=data,
    sr=rate,
    prop_decrease=0.9,
    time_constant_s=3.0,
    freq_mask_smooth_hz=800,
    time_mask_smooth_ms=100,
    thresh_n_mult_nonstationary=3,
    n_std_thresh_stationary=2.0,
    use_torch=True,  # Set True if GPU is available
    device="cuda"   # Or "cpu" if no GPU
)

# Increase the volume by 30% (multiply by 1.3)
increased_volume = reduced_noise * 1.3

# Save the processed audio file with increased volume
wavfile.write("E:/UOM/FYP/TTSx/DAE/denoised_audio.wav", rate, increased_volume.astype(data.dtype))

print("Denoised audio saved successfully.")
