from pydub import AudioSegment, silence

# Load the audio file
audio = AudioSegment.from_wav("E:/UOM/FYP/TTSx/DAE/random_noisy.wav")

# Detect silence based on a 10-second gap (10000 milliseconds)
silence_chunks = silence.detect_nonsilent(audio, 
                                           min_silence_len=5000,  # 10 seconds gap
                                           silence_thresh=-40,  # Consider any sound quieter than -40 dB as silence
                                           seek_step=1)

# Split the audio into segments based on the silence chunks
segments = []
for start, end in silence_chunks:
    segment = audio[start:end]
    segments.append(segment)

# Save each segment as a separate file
for i, segment in enumerate(segments):
    segment.export(f"E:/UOM/FYP/TTSx/DAE/split_segment_{i+1}.wav", format="wav")

print(f"Audio split into {len(segments)} segments.")
