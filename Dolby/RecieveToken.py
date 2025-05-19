import requests
import json
import os

APP_KEY = "qe8ZAXaDYVABW4Psf5LRIA=="
APP_SECRET = "2JORR76BDVhMcu7npFopZ0VAyTkpDD7rBVopv3o2twU="

payload = { 'grant_type': 'client_credentials', 'expires_in': 1800 }
response = requests.post('https://api.dolby.io/v1/auth/token', data=payload, auth=requests.auth.HTTPBasicAuth(APP_KEY,APP_SECRET))
body = json.loads(response.content)
access_token = body['access_token']

print(access_token)