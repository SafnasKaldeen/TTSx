import os
import requests

# Set or replace these values

file_path = "E:/UOM/FYP/TTSx/Safnas3.wav"

# Declare your dlb:// location
url = "https://api.dolby.com/media/input"
headers = {
    "Authorization": "Bearer {0}".format("eyJ0eXAiOiJKV1QiLCJraWQiOiI1ODExQjE0RS1DQzVCLTQ4QkQtQTNEOC1DREQxQzUzQ0ZDNUMiLCJhbGciOiJSUzUxMiJ9.eyJpc3MiOiJkb2xieS5pbyIsImlhdCI6MTczOTIwMTczMSwic3ViIjoicWU4WkFYYURZVkFCVzRQc2Y1TFJJQT09IiwiYXV0aG9yaXRpZXMiOlsiUk9MRV9DVVNUT01FUiJdLCJ0YXJnZXQiOiJhcGkiLCJvaWQiOiIwMjdiZmVkNC00Yzg1LTQxOGYtOWRkMC04ZGYyOTA1YzEyNDQiLCJhaWQiOiJmYjYxNjRlNi03NGExLTQ1NjAtYjE5NS04OTEwZjMyZjNmMzgiLCJiaWQiOiI4YTM2OTZhNjk0ZGFjNjMwMDE5NGYwNjRiZjI1NjNiNCIsImV4cCI6MTczOTIwMzUzMX0.HfmPsQj6ymk_vYyWIrqTSebeNrIVfqha2UE9DlojTgsfZveqTeQ-_1CWX5nA9e2Ct-5Esa41hJPBM8Oc6azpxQCy0WepziHzs7YMGXG8BGgtsHFQXIDdkVSLByVgwkl7LmxYEYJUhgJoc26eq1mz-jVUmMBh_oFqzK3bwFgpwrwPPnfr8qjPez_Jj0sMc2hf_pTgd366EhfDic87BhF9oxrrT84C79xso8tIfCchxiKn6b7VKAu6BabfhfiBpq83zkea0TYCKYWa1NS8PRw4swk2_QnmoLCVlBMqyPhy9PaEwsrAmWaxMvfaFEX7IOC9TnrjmwF3Kt8ATRXROYH5GQ0zctI44DaBuu7BxH_skmshzwhRo36Jdp7_CJxJ8Xew_DYDSTtNCPPT1zK7JJEkogYdOCbrFtvABf-eAoYdNkI06LrXEUG-XxOxIVctyznK38St7BJGocOW7TMoIz9tPeOmYbM5sYcrd21OYsFISZV2o4zLzI9Fsfb9bCRcaBjATCkqt8h4vY18I8hZ3hBm5rr8fNDq2rP2YPubVjBNl6ahZy1aWnDsmkeCut-v0u_7spjurvE0Xnn5vb2D_Lxj2SvoujtJWjOPSm80SiiUHi3EGf232MkCJHo_4465fR-eSt-KKLMTue-94aJnPozukiPZDrkbcjtSmYl935nYHvc"),
    "Content-Type": "application/json",
    "Accept": "application/json"
}

body = {
    "url": "dlb://in/audio.mp4",
}

response = requests.post(url, json=body, headers=headers)
response.raise_for_status()
data = response.json()
presigned_url = data["url"]

# Upload your media to the pre-signed url response

print("Uploading {0} to {1}".format(file_path, presigned_url))
with open(file_path, "rb") as input_file:
  requests.put(presigned_url, data=input_file)