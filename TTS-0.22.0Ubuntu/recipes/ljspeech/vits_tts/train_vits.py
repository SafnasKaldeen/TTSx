import os
import torch
from multiprocessing import freeze_support

from trainer import Trainer, TrainerArgs
from TTS.tts.configs.shared_configs import BaseDatasetConfig, CharactersConfig
from TTS.tts.configs.vits_config import VitsConfig
from TTS.tts.datasets import load_tts_samples
from TTS.tts.models.vits import Vits, VitsAudioConfig, VitsArgs
from TTS.tts.utils.text.tokenizer import TTSTokenizer
from TTS.utils.audio import AudioProcessor

def main():
    # Define Paths
    output_path = "E:/UOM/FYP/TTSx/Training/Sinhala"
    dataset_path = "E:/UOM/FYP/TTSx/Data/Sinhala_lady_voice"
    meta_file_train = os.path.join(dataset_path, "metadata.csv")
    checkpoint_dir = os.path.join(output_path, "vits_ljspeech-December-17-2024_01+27PM-0000000")  # Directory for checkpoints


    if not os.path.exists(dataset_path) or not os.path.exists(meta_file_train):
        raise FileNotFoundError(f"Dataset path or metadata file is missing. Please check your paths.")

    # Configure Dataset and Audio
    dataset_config = BaseDatasetConfig(
        formatter="ljspeech",
        meta_file_train=meta_file_train,
        path=dataset_path,
    )
    audio_config = VitsAudioConfig(
        sample_rate=22050, win_length=1024, hop_length=256, num_mels=80, mel_fmin=0, mel_fmax=None
    )

    print(f"CUDA is available: {torch.cuda.is_available()}")
    print(f"CUDA Device count: {torch.cuda.device_count()}")

    # Check GPU Availability
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    # device = torch.device("cpu")
    if torch.cuda.is_available():
        print(f"Using GPU: {torch.cuda.get_device_name(0)}")
    else:
        print("CUDA not available. Training will use CPU.")

    vitsArgs = VitsArgs(
        use_speaker_embedding=True,
        #num_speakers=2 # can set here or later using the speaker_manager
    )

    # Configure Training
    config = VitsConfig(
        # model_args=vitsArgs,
        audio=audio_config,
        run_name="vits_sinhala_lady",
        use_speaker_embedding=True,
        batch_size=8,
        eval_batch_size=2,
        batch_group_size=2,
        num_loader_workers=4,
        num_eval_loader_workers=2,
        run_eval=True,
        test_delay_epochs=-1,
        epochs=1000,
        text_cleaner=None,  # the text prompts were is already cleaned, remove extra whitespace, special symbols etc
        use_phonemes=False,
        compute_input_seq_cache=True,
        max_audio_len=15 * 22050,  # audio longer than this will be ignored
        add_blank=True,  # this is by default true for vits, not sure if needed, speed is not changed by much
        characters=CharactersConfig(
            characters_class="TTS.tts.models.vits.VitsCharacters",
            pad="<PAD>",
            eos="<EOS>",
            bos="<BOS>",
            blank="<BLNK>",
            characters=" !'(),-.:;=?abcdefghijklmnoprstuvyæñāēīōśşūǣḍḥḷṁṅṇṉṛṝṭ",
            punctuations=" !'(),-.:;=?",
            phonemes=None,
            is_unique=True,
            is_sorted=True,
        ),
        test_sentences=[
            "æyaṭa ohugen ahanna puḷuvan",
            "maṭa dæn tīraṇaya karanna puḷuvan",
            "maṭa obava anugamanaya karanna puḷuvan",
            "ovun katābaha kirīma pratikşēpa karanavā",
            "maṭa eya æṉdapæḷaṉda ganna puḷuvan",
            "ovuhu heṭa guvangata vannōya"
        ],
        print_step=100,
        print_eval=False,
        mixed_precision=True,  # try with false since other multilanguage training was done like that
        output_path=output_path,
        datasets=[dataset_config],
        cudnn_benchmark=False,
        eval_split_max_size=200,  # max number of eval samples 
        eval_split_size=0.1,  # 10% of the samples to eval
    )

    # Initialize Audio Processor and Tokenizer
    ap = AudioProcessor.init_from_config(config)
    tokenizer, config = TTSTokenizer.init_from_config(config)

    # Load Data Samples
    train_samples, eval_samples = load_tts_samples(
        dataset_config,
        eval_split=True,
        eval_split_max_size=config.eval_split_max_size,
        eval_split_size=config.eval_split_size,
    )

    # Initialize Model
    model = Vits(config, ap, tokenizer, speaker_manager=None)
    model.to(device)

    # Find Checkpoint
    # latest_checkpoint = "E:/UOM/FYP/TTSx/TTS-0.22.0/recipes/ljspeech/vits_tts/vits_ljspeech-January-01-2025_01+04AM-0000000/checkpoint_50000.pth"

    latest_checkpoint = False

    if os.path.exists(checkpoint_dir):
        checkpoints = [f for f in os.listdir(checkpoint_dir) if f.endswith(".pth")]
        if checkpoints:
            checkpoints.sort()  # Sort to get the latest checkpoint
            latest_checkpoint = os.path.join(checkpoint_dir, checkpoints[-1])

    # Load Checkpoint
    if latest_checkpoint:
        print(f"Resuming from checkpoint: {latest_checkpoint}")
        checkpoint = torch.load(latest_checkpoint, map_location=device)
        model.load_state_dict(checkpoint["model"])
        print("Checkpoint loaded successfully.")
    else:
        print(f"No checkpoint found in {checkpoint_dir}. Starting training from scratch.")

    # Initialize Trainer
    trainer = Trainer(
        TrainerArgs(),
        config,
        output_path,
        model=model,
        train_samples=train_samples,
        eval_samples=eval_samples,
    )

    # Start Training
    trainer.fit()

if __name__ == "__main__":
    freeze_support()
    main()
