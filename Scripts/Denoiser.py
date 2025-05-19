import os
import noisereduce as nr
from scipy.io import wavfile
import numpy as np

def denoise_single_file(input_path, output_path):
    # Load audio
    print(f"Processing {os.path.basename(input_path)}...")
    rate, data = wavfile.read(input_path)

    # Apply noise reduction
    reduced_noise = nr.reduce_noise(
        y=data,
        sr=rate,
        prop_decrease=0.9,
        time_constant_s=3.0,
        freq_mask_smooth_hz=800,
        time_mask_smooth_ms=100,
        thresh_n_mult_nonstationary=3,
        n_std_thresh_stationary=2.0,
        use_torch=True,
        device="cuda"  # Use "cpu" if no GPU is available
    )

    # Increase volume by 2x
    increased_volume = reduced_noise * 2

    # Avoid clipping
    dtype = data.dtype
    if np.issubdtype(dtype, np.integer):
        info = np.iinfo(dtype)
        increased_volume = np.clip(increased_volume, info.min, info.max)
    else:
        increased_volume = np.clip(increased_volume, -1.0, 1.0)

    # Save the denoised and amplified audio
    wavfile.write(output_path, rate, increased_volume.astype(dtype))
    print(f"Saved denoised and amplified audio to {output_path}")


if __name__ == "__main__":
    input_path = input("Enter the path to the noisy WAV file: ").strip()
    output_path = input("Enter the path to save the denoised WAV file: ").strip()
    denoise_single_file(input_path, output_path)
