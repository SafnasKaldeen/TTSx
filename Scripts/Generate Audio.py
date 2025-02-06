import os
from TTS.api import TTS

# ANSI escape codes for text color
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
RESET = "\033[0m"  
BLUE = "\033[94m"

# Specify the directory containing the checkpoints and the text input
checkpoints_dir = "E:/UOM/FYP/TTSx/Training/English/YourTTS/YourTTS-EN-VCTK-February-05-2025_01+57PM-0000000"
input_text = "This is a demo sentence I am using to generate the audios of a new model I trained"
config_path = os.path.join(checkpoints_dir, "config.json")
output_dir = "E:/UOM/FYP/TTSx/Training/English/Audios_VITS"
dataset = "VCTK"

# Ensure the output directory exists
os.makedirs(output_dir, exist_ok=True)

# Loop through each file in the checkpoints directory
print(f"{GREEN}Starting audio generation for checkpoints in: {checkpoints_dir}{RESET}\n")
for checkpoint_file in os.listdir(checkpoints_dir):
    if (checkpoint_file.endswith(".pth") and checkpoint_file != "speakers.pth"):
        checkpoint_path = os.path.join(checkpoints_dir, checkpoint_file)
        output_file = os.path.join(output_dir, f"{os.path.splitext(checkpoint_file)[0]}.wav")
        speaker_id = "VCTK_p240"  # Speaker ID for VCTK speaker comment it if the dataset is not VCTK

        print(f"{YELLOW}Processing checkpoint file: {checkpoint_file}{RESET}")
        try:    
            # Construct and execute the command
            command = (
                f'tts --text "{input_text}" '
                f'--model_path "{checkpoint_path}" '
                f'--config_path "{config_path}" '
                f'--out_path "{output_file}" '
                f'--speaker_id "{speaker_id}"' 
            )

            print(f"{BLUE}\nExecuting: {command} \n{RESET}")
            os.system(command)
            print(f"{GREEN}\nAudio saved to: {output_file}\n{RESET}")
        except Exception as e:
            print(f"{RED}\nError encountered with checkpoint {checkpoint_file}: {e}\n{RESET}")
    else:
        # Skip non-checkpoint files
        pass

print(f"{GREEN}Audio generation completed for all valid checkpoints.{RESET}")
