import os
from TTS.api import TTS
import subprocess

# ANSI escape codes for text color
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
RESET = "\033[0m"  
BLUE = "\033[94m"

# Specify the directory containing the checkpoints and the text input
Base_Dir = "E:/UOM/FYP/TTSx/Model"
model_name = "LJ_VITS"
Training_Dir = "LJ_Dinithi"
checkpoints_dir = f"{Base_Dir}/{Training_Dir}"
input_text = "āyubōvan, obaṭa kesēda? mama hoṉdayi"
config_path = os.path.join(checkpoints_dir, "config.json")
output_dir = f"E:/UOM/FYP/TTSx/Audios/Audios_{model_name}/{Training_Dir}"
dataset = "LJ"

# Ensure the output directory exists
os.makedirs(output_dir, exist_ok=True)

# Loop through each file in the checkpoints directory
print(f"{GREEN}Starting audio generation for checkpoints in: {checkpoints_dir}{RESET}\n")
for checkpoint_file in os.listdir(checkpoints_dir):
    if (checkpoint_file.endswith(".pth") and checkpoint_file != "speakers.pth"):
        checkpoint_path = os.path.join(checkpoints_dir, checkpoint_file)
        output_file = os.path.join(output_dir, f"{os.path.splitext(checkpoint_file)[0]}.wav")
        # speaker_id = "VCTK_Oshadi"  # Speaker ID for VCTK speaker comment it if the dataset is not VCTK

        print(f"{YELLOW}Processing checkpoint file: {checkpoint_file}{RESET}")
        try:    
            # Construct and execute the command
            command = (
                f'tts --text "{input_text}" '
                f'--model_path "{checkpoint_path}" '
                f'--config_path "{config_path}" '
                f'--out_path "{output_file}" '
                # f'--speaker_id "{speaker_id}"' 
            )

            print(f"{BLUE}\nExecuting: {command} \n{RESET}")
            os.system(command)
    
            print(f"{GREEN}\nAudio saved to: {output_file}\n{RESET}")
        except Exception as e:
            print(f"{RED}\nError encountered with checkpoint {checkpoint_file}: {e}\n{RESET}")

print(f"{GREEN}Audio generation completed for all valid checkpoints.{RESET}")
