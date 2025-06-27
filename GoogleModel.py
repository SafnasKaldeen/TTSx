from gtts import gTTS

text = "මැයි මස 29 වැනිදා දිනේ සවස 3:45 ට පැවැත්වීමට නියමිත ජාත්‍යන්තර විද්‍යා සම්මන්ත්‍රණය සඳහා ඔබේ සහභාගිත්වය අප්‍රමාණ වටිනාකමකින් යුක්ත වේ."
tts = gTTS(text=text, lang='si')
tts.save("sinhala_speech.mp3")
print("Audio saved as sinhala_speech.mp3")
