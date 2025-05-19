from phonemizer import phonemize

text = "oba kohomada?"

phonemized_text = phonemize(text, language='si', backend='espeak')
print(phonemized_text)
