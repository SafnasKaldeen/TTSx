import os
from trainer import Trainer, TrainerArgs
from multiprocessing import freeze_support

from TTS.tts.configs.shared_configs import BaseDatasetConfig, CharactersConfig
CharactersConfig
from TTS.tts.configs.vits_config import VitsConfig
from TTS.tts.datasets import load_tts_samples
from TTS.tts.models.vits import Vits, VitsArgs, VitsAudioConfig
from TTS.tts.utils.speakers import SpeakerManager
from TTS.tts.utils.text.tokenizer import TTSTokenizer
from TTS.utils.audio import AudioProcessor

def main():
    # Define Paths
    output_path = "E:/UOM/FYP/TTSx/Training/Sinhala/VCTK_VITS"
    dataset_path = "E:/UOM/FYP/TTSx/Data/Mettananda Voice_VCTK"
    meta_file_train = "metadata.csv"  # Update with your metadata file location

    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset path {dataset_path} is missing. Please check your paths.")

    # Dataset Configuration for VCTK
    dataset_config = BaseDatasetConfig(
        formatter="vctk",  # Use 'vctk' formatter for VCTK dataset
        meta_file_train=meta_file_train,
        # language="en-us",
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
        # text_cleaner="english_cleaners",
        use_phonemes=False,
        # phoneme_language="en-us",
        # phoneme_cache_path=os.path.join(output_path, "phoneme_cache"),
        compute_input_seq_cache=True,
        print_step=100,
        print_eval=False,
        mixed_precision=True,
        max_text_len=325,  # Adjust based on VRAM availability
        output_path=output_path,
        datasets=[dataset_config],
        cudnn_benchmark=False,
        save_step=5000,
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
        test_sentences=[  # Make sure these speakers exist in your metadata
            ["mema tīraṇaya piḷibada podu janatāva tuḷa pæhædiḷi sākacchāvak tavamat goḍa nægī næhæ", 'VCTK_Mettananda'],
            ["oya hindi sinduva maṁ issellama æhuvē ēka andha ḷamayā kiyana viṭayi", 'VCTK_Mettananda'],
            ["ægen pasu ægē bāla soyuriyaṭa uruma vū æṉdumakin itiri vū redi kaḍak æya duṭuvā ya", 'VCTK_Mettananda'],
            ["peraharē mulinma gaman karannē polis pera gaman rathayak vīmada tavat viśēşatvayaki", 'VCTK_Oshadi'],
            ["ægē ekama aramuṇa vennet taman karana kaṭayutta tuḷa paripūrṇatvayaṭa pat vennayi.", 'VCTK_Oshadi'],
            ["mul kopi miladī aragena tamangē nama gahagena ēvā vināśa karanavā", 'VCTK_Oshadi'],
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
