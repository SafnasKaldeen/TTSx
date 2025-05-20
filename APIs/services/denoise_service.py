import os
import noisereduce as nr
from scipy.io import wavfile
import numpy as np

def clean_audio_service(input_path: str) -> dict:
    try:
        if not os.path.exists(input_path):
            return {
                "status": "error",
                "message": f"Input file not found: {input_path}"
            }

        # Define output path
        base_dir = os.path.dirname(input_path)
        output_filename = "E:/UOM/FYP/TTSx/UI/client/public/Audios/cleaned_audio.wav"
        output_path = os.path.join(base_dir, output_filename)

        # Read audio
        print(f"Processing {os.path.basename(input_path)}...")
        rate, data = wavfile.read(input_path)

        # Denoise
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
            device="cuda"  # change to "cpu" if no GPU available
        )

        # Amplify
        increased_volume = reduced_noise * 2
        dtype = data.dtype
        if np.issubdtype(dtype, np.integer):
            info = np.iinfo(dtype)
            increased_volume = np.clip(increased_volume, info.min, info.max)
        else:
            increased_volume = np.clip(increased_volume, -1.0, 1.0)

        # Save
        wavfile.write(output_path, rate, increased_volume.astype(dtype))
        print(f"Saved denoised audio to {output_path}")

        return {
            "status": "success",
            "message": "Audio cleaned successfully.",
            "download_path": output_path
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Exception occurred: {str(e)}"
        }
