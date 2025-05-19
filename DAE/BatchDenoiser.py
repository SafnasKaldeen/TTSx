import os
import noisereduce as nr
from scipy.io import wavfile
import numpy as np

def batch_denoise(input_folder, output_folder):
    # Create output folder if it doesn't exist
    os.makedirs(output_folder, exist_ok=True)

    # List all wav files in the input folder
    wav_files = [f for f in os.listdir(input_folder) if f.lower().endswith('.wav')]

    for wav_file in wav_files:
        input_path = os.path.join(input_folder, wav_file)
        output_path = os.path.join(output_folder, wav_file)

        print(f"Processing {wav_file}...")

        # Load audio
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
            use_torch=True,  # Set True if GPU available
            device="cuda"   # Or "cpu" if no GPU
        )

        # Increase volume by 2x (100% increase)
        increased_volume = reduced_noise * 2

        # Avoid clipping by clipping to data type range
        dtype = data.dtype
        if np.issubdtype(dtype, np.integer):
            info = np.iinfo(dtype)
            increased_volume = np.clip(increased_volume, info.min, info.max)
        else:
            # For float audio types, clip between -1.0 and 1.0
            increased_volume = np.clip(increased_volume, -1.0, 1.0)

        # Save processed audio
        wavfile.write(output_path, rate, increased_volume.astype(dtype))

        print(f"Saved denoised and amplified audio to {output_path}")

    print("Batch processing complete.")


if __name__ == "__main__":
    input_folder = input("Enter the path to the folder containing noisy wav files: ").strip()
    output_folder = input("Enter the path to save denoised wav files: ").strip()
    batch_denoise(input_folder, output_folder)
