import os
from TTS.api import TTS
import subprocess

# ANSI escape codes for text color
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
RESET = "\033[0m"  
BLUE = "\033[94m"

# Specify the directory containing the checkpoint and the text input
Base_Dir = "E:/UOM/FYP/TTSx/Training/Sinhala"
model_name = "LJ_VITS"
Training_Dir = "LJ_BaseModel_Oshadi"
checkpoints_dir = f"{Base_Dir}/{model_name}/{Training_Dir}"
checkpoint_file = "checkpoint_70000.pth"  # Specify the exact checkpoint file
checkpoint_path = os.path.join(checkpoints_dir, checkpoint_file)
config_path = os.path.join(checkpoints_dir, "config.json")
output_dir = f"E:/UOM/FYP/TTSx/Training/Sinhala/Audios/Audios_Samples"

# Ensure the output directory exists
os.makedirs(output_dir, exist_ok=True)

# Define the list of sentences you want to synthesize
input_texts = [
    "ehet dharmasiri seneviratna mahatā inne් beාheා් duraṭa mīṭa prativiruddha adahasakaya​.",
    "matpæn samājayaṭa praśnayak nam eya strī saha puruşa depārśavayaṭama eya tahanam karanna.",
    "tavada nilavaraṇa kamiṭuva saṉdahā edina yeා්janā vūye් dedenakuge් nam pamaṇi.",
    "gas‌ keාlanvala avaśyatāva sælakū maha isivarun saha budurajāṇan vahanse් vaneා්dyāna ætikirīme් vædagatkama penvā dunha.",
    "ættaṭama kiyanavanam jaṁgama durakathana alutvæḍiyāva apaṭa gedara idan unat igena ganna puḷuvan.",
    "ema āyeා්jakayan mehi pæmiṇīmaṭa pradhānama he්tuva nam śramaya saṉdahā yana aḍu pirivæyayi.",
    "janapriya kāntāvak yam vilāsitāvak kala viṭa an aya ēvā anugamanaya karannaṭa paṭan gannavā.	",
    "upul śānta sannasgala mahatā saha fe්sbuk kriyākārīn ræsak sahabhāgī vū ema sādaye් jāyārūpa pahatin dækve්.",
    "mema śārīrika vadhahiṁsāvan hæruṇukeාṭa mānasika saha sāmājīya vaśayen ætivana avadhānama eyaṭa devani neාve්.",
    "mema kāraṇaya pilibadava pæhædili karana lipiyak yahamaṉga aḍaviya tula laṉgadīma balāpeාreාttu vanna."
]

# Ensure that the checkpoint exists
if not os.path.exists(checkpoint_path):
    print(f"{RED}Checkpoint file not found: {checkpoint_path}{RESET}")
    exit()

print(f"{GREEN}Starting audio generation for checkpoint: {checkpoint_path}{RESET}\n")

id = 0 

for input_text in input_texts:
    id = id + 1
    output_file = os.path.join(output_dir, f"{os.path.splitext(checkpoint_file)[0]}_{id}.wav")

    try:
        # Construct and execute the command
        command = (
            f'tts --text "{input_text}" '
            f'--model_path "{checkpoint_path}" '
            f'--config_path "{config_path}" '
            f'--out_path "{output_file}" '
        )

        print(f"{BLUE}\nExecuting: {command} \n{RESET}")
        os.system(command)

        print(f"{GREEN}\nAudio saved to: {output_file}\n{RESET}")
    except Exception as e:
        print(f"{RED}\nError encountered for sentence '{input_text}': {e}\n{RESET}")

print(f"{GREEN}Audio generation completed for all sentences.{RESET}")
