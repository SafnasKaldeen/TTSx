import os
import subprocess
import logging
import torch

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ANSI colors for console output
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
RESET = "\033[0m"
BLUE = "\033[94m"

class VoiceCloner:
    def __init__(self, referenceWAV: str, targetWAV: str):
        self.original_referenceWAV = referenceWAV
        self.original_targetWAV = targetWAV

        self.target_folder = os.path.dirname(targetWAV)
        self.combined_target_path = os.path.join(self.target_folder, "combined_target.wav")
        self.downsampled_reference_path = os.path.join(self.target_folder, "ref_16k.wav")
        self.downsampled_target_path = os.path.join(self.target_folder, "tgt_16k.wav")

        self.model = self.load_model()

    def load_model(self):
        self.model_path = "E:/UOM/FYP/TTSx/Model/VoiceConversionModel/model_file.pth"
        self.config_path = "E:/UOM/FYP/TTSx/Model/VoiceConversionModel/config.json"
        self.out_path = "E:/UOM/FYP/TTSx/UI/client/public/Audios/ClonedAudio.wav"

        if not os.path.exists(self.model_path) or not os.path.exists(self.config_path):
            logger.error(f"Model or config file not found.")
            raise FileNotFoundError("Model/config file not found.")

        try:
            torch.load(self.model_path, map_location="cpu", weights_only=True)
        except Exception as e:
            logger.error(f"Model load failed: {e}")
            raise

    def downsample_audio(self, input_path, output_path, sample_rate=16000):
        try:
            cmd = [
                "ffmpeg", "-y", "-i", input_path,
                "-ar", str(sample_rate),
                output_path
            ]
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            logger.info(f"Downsampled audio saved to: {output_path}")
            return output_path
        except subprocess.CalledProcessError as e:
            logger.error(f"Downsampling failed for {input_path}: {e}")
            raise

    def combine_target_audio(self):
        try:
            all_wavs = [
                f for f in os.listdir(self.target_folder)
                if f.endswith(".wav") and
                   os.path.abspath(os.path.join(self.target_folder, f)) != os.path.abspath(self.original_referenceWAV) and
                   os.path.abspath(os.path.join(self.target_folder, f)) != os.path.abspath(self.original_targetWAV)
            ]

            if not all_wavs:
                logger.info("Only primary target audio present. Skipping combination.")
                return self.original_targetWAV

            elif len(all_wavs) == 1:
                single_file_path = os.path.join(self.target_folder, all_wavs[0])
                logger.info(f"Only one other audio file found. Using: {single_file_path}")
                return single_file_path

            else:
                filelist_path = os.path.join(self.target_folder, "files.txt")
                with open(filelist_path, "w", encoding="utf-8") as f:
                    for wav in all_wavs:
                        f.write(f"file '{os.path.join(self.target_folder, wav)}'\n")

                cmd = [
                    "ffmpeg", "-y", "-f", "concat", "-safe", "0",
                    "-i", filelist_path,
                    "-c", "copy", self.combined_target_path
                ]
                subprocess.run(cmd, check=True)

                os.remove(filelist_path)
                logger.info(f"Combined audio saved at: {self.combined_target_path}")
                return self.combined_target_path

        except Exception as e:
            logger.error(f"Combining target audio failed: {e}")
            raise

    def clone_speech(self):
        try:
            # Combine if needed and get actual targetWAV
            final_target_path = self.combine_target_audio()

            # Downsample reference and target
            downsampled_ref = self.downsample_audio(self.original_referenceWAV, self.downsampled_reference_path)
            downsampled_tgt = self.downsample_audio(final_target_path, self.downsampled_target_path)

            command = (
                f'tts --reference_wav "{downsampled_ref}" '
                f'--model_path "{self.model_path}" '
                f'--config_path "{self.config_path}" '
                f'--speaker_wav "{downsampled_tgt}" '
                f'--out_path "{self.out_path}" '
                f'--language_idx "en" '
            )

            print(f"{BLUE}\nExecuting: {command}\n{RESET}")
            result = os.system(command)

            if result != 0:
                raise Exception(f"Voice cloning command failed with exit code {result}")

            if os.path.exists(self.out_path):
                logger.info(f"Audio saved to: {self.out_path}")
                return {
                    "status": "success",
                    "message": "Voice cloning completed successfully",
                    "audio_path": self.out_path,
                }
            else:
                logger.error("Output file not found.")
                return {
                    "status": "error",
                    "message": "Failed to clone voice",
                    "audio_path": None,
                }

        except Exception as e:
            logger.error(f"Voice cloning failed: {e}")
            return {
                "status": "error",
                "message": str(e),
                "audio_path": None,
            }

# Example usage:
# referenceWAV = "E:/UOM/FYP/TTSx/APIs/Audios/InitialInference.wav"
# primary_target_audio = "E:/UOM/FYP/TTSx/APIs/Audios/SpeakerReference.wav"
# cloner = VoiceCloner(referenceWAV, primary_target_audio)
# result = cloner.clone_speech()
# print(result)
