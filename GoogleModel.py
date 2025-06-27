from gtts import gTTS

text = "ඔව්, මට සිංහලෙන් කතා කරන්න පුළුවන්! ඔබට කොහොමද හෙට දවස?"
tts = gTTS(text=text, lang='si')
tts.save("sinhala_speech.mp3")
print("Audio saved as sinhala_speech.mp3")
