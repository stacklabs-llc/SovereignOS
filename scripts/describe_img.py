from google import genai
import os
import sys

try:
    with open('/home/james/SovereignOS/.env', 'r') as f:
        for line in f:
            if 'GEMINI_API_KEY' in line:
                os.environ['GEMINI_API_KEY'] = line.split('=')[1].strip()
except Exception as e:
    print("No .env found, relying on os.environ")
    
key = os.environ.get('GEMINI_API_KEY')
if not key:
    print("NO API KEY!")
    sys.exit(1)

client = genai.Client(api_key=key)
sample = client.files.upload(file='/home/james/SovereignOS/dna/screenshots/artemis/2026-03-29 16_27_32-.png')
resp = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['Describe this image. What application is open?', sample]
)
print(resp.text)
