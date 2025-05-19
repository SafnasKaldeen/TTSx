import os
import shutil
import numpy as np
import librosa
import pyworld
import pysptk
from fastdtw import fastdtw
from scipy.spatial.distance import euclidean

def extract_mcep(wav_path, sr=22050, order=24, alpha=0.58, eps=1e-8):
    x, _ = librosa.load(wav_path, sr=sr)
    x = x.astype(np.float64)

    _f0, timeaxis = pyworld.harvest(x, sr)
    sp = pyworld.cheaptrick(x, _f0, timeaxis, sr)
    sp = np.clip(sp, a_min=eps, a_max=None)

    log_sp = np.log(sp).astype(np.float64)
    mcep = pysptk.mcep(log_sp, order=order, alpha=alpha, eps=eps, etype=1)
    return mcep

def calculate_mcd(mcep1, mcep2):
    distance, path = fastdtw(mcep1, mcep2, dist=euclidean)
    aligned_mcep1 = np.array([mcep1[i] for i, _ in path])
    aligned_mcep2 = np.array([mcep2[j] for _, j in path])

    diff = aligned_mcep1[:, 1:] - aligned_mcep2[:, 1:]
    sq_diff = diff ** 2
    sum_sq_diff = np.sum(sq_diff, axis=1)

    mcd = (10.0 / np.log(10)) * np.sqrt(2) * np.mean(np.sqrt(sum_sq_diff))
    return mcd

def compute_filtered_average_mcd(ground_truth_dir, synthesized_dir, gt_output_dir, syn_output_dir, lower=0, upper=7):
    os.makedirs(gt_output_dir, exist_ok=True)
    os.makedirs(syn_output_dir, exist_ok=True)

    total_mcd = 0.0
    count = 0

    filenames = sorted(os.listdir(ground_truth_dir))
    for filename in filenames:
        if filename.endswith('.wav') and os.path.exists(os.path.join(synthesized_dir, filename)):
            ref_path = os.path.join(ground_truth_dir, filename)
            syn_path = os.path.join(synthesized_dir, filename)

            try:
                ref_mcep = extract_mcep(ref_path)
                syn_mcep = extract_mcep(syn_path)
                mcd = calculate_mcd(ref_mcep, syn_mcep)
                print(f"{filename}: MCD = {mcd:.3f}")

                if lower <= mcd <= upper:
                    total_mcd += mcd
                    count += 1

                    shutil.copy2(ref_path, os.path.join(gt_output_dir, filename))
                    shutil.copy2(syn_path, os.path.join(syn_output_dir, filename))

            except Exception as e:
                print(f"Error processing {filename}: {e}")

    if count > 0:
        avg_mcd = total_mcd / count
        print(f"\nAverage MCD in range [{lower}, {upper}] over {count} file(s): {avg_mcd:.3f} dB")
    else:
        print("No valid file pairs within specified MCD range.")

if __name__ == "__main__":
    ground_truth_folder = "E:/UOM/FYP/TTSx/DAE/Clean Data - Copy copy"
    synthesized_folder = "E:/UOM/FYP/TTSx/DAE/Noisy Data copy 2"

    filtered_gt_output = "E:/UOM/FYP/TTSx/DAE/Filtered/Clean"
    filtered_syn_output = "E:/UOM/FYP/TTSx/DAE/Filtered/Noisy"

    compute_filtered_average_mcd(
        ground_truth_folder,
        synthesized_folder,
        filtered_gt_output,
        filtered_syn_output,
        lower=0,
        upper=7
    )
