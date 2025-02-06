import os
from trainer import Trainer, TrainerArgs
from multiprocessing import freeze_support

from TTS.tts.configs.shared_configs import BaseDatasetConfig
from TTS.tts.configs.vits_config import VitsConfig
from TTS.tts.datasets import load_tts_samples
from TTS.tts.models.vits import Vits, VitsArgs, VitsAudioConfig
from TTS.tts.utils.speakers import SpeakerManager
from TTS.tts.utils.text.tokenizer import TTSTokenizer
from TTS.utils.audio import AudioProcessor

def main():
    # Define Paths
    output_path = "E:/UOM/FYP/TTSx/Training/Sinhala/VCTK_VITS"
    dataset_path = "E:/UOM/FYP/TTSx/Data/VCTK-Corpus-0.92_formatted"
    meta_file_train = "metadata.csv"  # Update with your metadata file location

    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset path {dataset_path} is missing. Please check your paths.")

    # Dataset Configuration for VCTK
    dataset_config = BaseDatasetConfig(
        formatter="vctk",  # Use 'vctk' formatter for VCTK dataset
        meta_file_train=meta_file_train,
        language="en-us",
        path=dataset_path
    )

    # Audio Configuration
    audio_config = VitsAudioConfig(
        sample_rate=22050,
        win_length=1024,
        hop_length=256,
        num_mels=80,
        mel_fmin=0,
        mel_fmax=None
    )

    # Model Arguments
    vits_args = VitsArgs(
        use_speaker_embedding=True,  # Enable speaker embedding for multi-speaker training
    )

    # **Proper Initialization of `config` here before use**
    config = VitsConfig(
        model_args=vits_args,
        audio=audio_config,
        run_name="vits_vctk",
        batch_size=10,
        eval_batch_size=2,
        batch_group_size=2,
        num_loader_workers=4,
        num_eval_loader_workers=4,
        run_eval=True,
        test_delay_epochs=-1,
        epochs=1000,
        text_cleaner="english_cleaners",
        use_phonemes=True,
        phoneme_language="en-us",
        phoneme_cache_path=os.path.join(output_path, "phoneme_cache"),
        compute_input_seq_cache=True,
        print_step=100,
        print_eval=False,
        mixed_precision=True,
        max_text_len=325,  # Adjust based on VRAM availability
        output_path=output_path,
        datasets=[dataset_config],
        cudnn_benchmark=False,
        save_step=5000,
        test_sentences=[  # Make sure these speakers exist in your metadata
            ["The quick brown fox jumps over the lazy dog.", 'VCTK_p225', "en-us"],
            ["The five boxing wizards jump quickly.", 'VCTK_p227', "en-us"],
            ["Pack my box with five dozen liquor jugs.", 'VCTK_p229', "en-us"],
            ["How razorback-jumping frogs can level six piqued gymnasts!", 'VCTK_p234', "en-us"],
            ["The vixen jumped quickly on her foe barking with zeal.", 'VCTK_p240', "en-us"],
            ["Mr. Jock, TV quiz PhD, bags few lynx.", 'VCTK_p243', "en-us"],
        ],
    )

    # INITIALIZE THE AUDIO PROCESSOR
    ap = AudioProcessor.init_from_config(config)

    # INITIALIZE THE TOKENIZER
    tokenizer, config = TTSTokenizer.init_from_config(config)

    # LOAD DATA SAMPLES
    train_samples, eval_samples = load_tts_samples(
        dataset_config,
        eval_split=True,
        eval_split_max_size=config.eval_split_max_size,
        eval_split_size=config.eval_split_size,
    )

    # INITIALIZE SPEAKER MANAGER
    speaker_manager = SpeakerManager()
    speaker_manager.set_ids_from_data(train_samples + eval_samples, parse_key="speaker_name")
    config.model_args.num_speakers = speaker_manager.num_speakers
    
    print(f"Number of speakers: {len(speaker_manager.name_to_id)}")
    for s in speaker_manager.name_to_id:
        print(f"Speaker id: {s}")

    # INITIALIZE MODEL
    model = Vits(config, ap, tokenizer, speaker_manager)

    # INITIALIZE THE TRAINER AND START TRAINING
    trainer = Trainer(
        TrainerArgs(),
        config,
        output_path,
        model=model,
        train_samples=train_samples,
        eval_samples=eval_samples,
    )
    trainer.fit()

if __name__ == "__main__":
    freeze_support()  # For Windows compatibility
    main()
