"""
Speech Quality Estimation Using Voice Activity Detection (VAD) and Signal-to-Noise Ratio (SNR)

What this script does:
----------------------
- Processes a folder of WAV audio files (mono or stereo).
- For each file, reads the audio waveform and converts stereo to mono if needed.
- Uses WebRTC VAD to classify short audio frames as either speech or noise.
- Separates the audio into two signals: one containing all speech frames, the other containing all noise frames.
- Computes the Signal-to-Noise Ratio (SNR) in decibels, which quantifies the clarity of speech relative to background noise.
- Aggregates and outputs SNR values for all audio files or error messages if processing fails.

Why this is useful:
-------------------
- SNR is a fundamental metric in speech processing, reflecting audio quality and noise conditions.
- Using VAD to separate speech and noise allows automatic estimation of SNR without manual annotation.
- This aids in dataset quality assessment, filtering noisy audio, or pre-processing in speech synthesis or recognition projects.
- WebRTC VAD is lightweight and widely adopted, making it suitable for real-time or batch analysis.

How it works in detail:
-----------------------
1. Audio Loading (`read_audio`):
   - Loads audio file with SoundFile.
   - Converts multi-channel audio to mono by averaging channels, simplifying downstream processing.

2. Frame Splitting (`frame_generator`):
   - Splits audio into 30 ms frames (or user-specified duration).
   - Frames are required because WebRTC VAD expects short, fixed-length chunks.

3. Voice Activity Detection (`apply_vad`):
   - Each frame is converted to 16-bit PCM bytes (WebRTC VAD input format).
   - WebRTC VAD classifies each frame as speech or non-speech (noise).
   - Speech and noise frames are aggregated into separate arrays.

4. SNR Calculation (`compute_snr_db`):
   - Power of speech and noise signals is computed as mean squared amplitude.
   - SNR is calculated as 10 * log10(signal_power / noise_power), expressed in decibels.
   - Small epsilon added to noise power to avoid division by zero.

5. Batch Processing (`batch_snr_estimation`):
   - Iterates over all `.wav` files in the specified folder.
   - Applies the entire pipeline on each file.
   - Stores results in a dictionary mapping filenames to SNR values or error messages.
   - Prints out the results for easy inspection.

Error Handling:
---------------
- Tries to catch and report errors gracefully (e.g., file read issues or empty audio).
- Uses small epsilon arrays if no speech/noise frames are detected to avoid crashes.

Parameters & Customization:
---------------------------
- VAD aggressiveness mode can be adjusted (default 3 = most aggressive noise filtering).
- Frame duration can be modified to 10 or 20 ms if desired (WebRTC VAD supports these).
- Folder path should be updated to point to your dataset directory.

Dependencies:
-------------
- numpy
- soundfile
- webrtcvad

Example usage:
--------------
Set the `folder` variable to your audio files directory and run the script.  
Output will list each WAV file and its estimated SNR value.

"""
import os
import numpy as np
import soundfile as sf
import webrtcvad
from scipy.signal import resample_poly
from tqdm import tqdm
import noisereduce as nr

def denoise_audio(data, rate, use_cuda=False):
    # Denoise using noisereduce
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
        device="cuda" if use_cuda else "cpu"
    )
    # Amplify volume by 2x and clip to valid range
    increased_volume = reduced_noise * 2
    dtype = data.dtype
    if np.issubdtype(dtype, np.integer):
        info = np.iinfo(dtype)
        increased_volume = np.clip(increased_volume, info.min, info.max)
    else:
        increased_volume = np.clip(increased_volume, -1.0, 1.0)
    return increased_volume.astype(data.dtype)

def read_audio(file_path):
    audio, sample_rate = sf.read(file_path)
    if audio.ndim > 1:
        audio = np.mean(audio, axis=1)
    return audio, sample_rate

def resample_audio(audio, orig_sr, target_sr=16000):
    if orig_sr == target_sr:
        return audio
    gcd = np.gcd(orig_sr, target_sr)
    up = target_sr // gcd
    down = orig_sr // gcd
    return resample_poly(audio, up, down)

def frame_generator(audio, sample_rate, frame_duration_ms=30):
    frame_length = int(sample_rate * frame_duration_ms / 1000)
    for start in range(0, len(audio), frame_length):
        end = start + frame_length
        if end <= len(audio):
            yield audio[start:end]

def apply_vad(audio, sample_rate, mode=3):
    vad = webrtcvad.Vad(mode)
    speech_frames = []
    noise_frames = []

    for frame in frame_generator(audio, sample_rate):
        pcm = (frame * 32768).astype(np.int16).tobytes()
        if vad.is_speech(pcm, sample_rate):
            speech_frames.append(frame)
        else:
            noise_frames.append(frame)

    speech = np.concatenate(speech_frames) if speech_frames else np.array([1e-10])
    noise = np.concatenate(noise_frames) if noise_frames else np.array([1e-10])
    return speech, noise

def compute_snr_db(signal, noise):
    signal_power = np.mean(signal ** 2)
    noise_power = np.mean(noise ** 2) + 1e-10
    return 10 * np.log10(signal_power / noise_power)

def batch_denoise_and_snr(folder_path, use_cuda=False):
    snr_results = {}
    wav_files = [f for f in os.listdir(folder_path) if f.lower().endswith(".wav")]

    for filename in tqdm(wav_files, desc="Processing WAV files"):
        file_path = os.path.join(folder_path, filename)
        try:
            # Read and convert to mono
            audio, sr = read_audio(file_path)
            # Denoise in memory
            denoised_audio = denoise_audio(audio, sr, use_cuda=use_cuda)
            # Resample to 16kHz for VAD
            audio_resampled = resample_audio(denoised_audio, sr, 16000)
            # Apply VAD on denoised audio
            speech, noise = apply_vad(audio_resampled, 16000)
            # Compute SNR
            snr = compute_snr_db(speech, noise)
            snr_results[filename] = round(snr, 2)
        except Exception as e:
            snr_results[filename] = f"Error: {str(e)}"

    # Calculate average SNR excluding errors
    valid_snrs = [v for v in snr_results.values() if isinstance(v, (int, float))]
    if valid_snrs:
        avg_snr = sum(valid_snrs) / len(valid_snrs)
        print(f"\nAverage SNR (across {len(valid_snrs)} files): {avg_snr:.2f} dB")
    else:
        print("\nNo valid SNR values to average.")

    return snr_results

if __name__ == "__main__":
    folder = "E:/UOM/FYP/TTSx/Data/Isuru/wavs"  # Change to your folder path
    use_cuda = False  # Set True if you want to use GPU for denoising and have CUDA
    results = batch_denoise_and_snr(folder, use_cuda=use_cuda)
    ttl_snr = 0 

    valid_snrs = [snr for snr in results.values() if isinstance(snr, (int, float))]
    valid_snrs.sort(reverse=True)
    top_snrs = valid_snrs[:50]
    avg_top_snr = sum(top_snrs) / len(top_snrs) if top_snrs else 0

    print(f"\nAverage SNR: {avg_top_snr:.2f} dB")
