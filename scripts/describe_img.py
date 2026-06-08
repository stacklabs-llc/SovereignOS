import google.generativeai as genai
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

genai.configure(api_key=key)
model = genai.GenerativeModel('gemini-2.5-flash')
sample = genai.upload_file('/home/james/SovereignOS/dna/screenshots/artemis/2026-03-29 16_27_32-.png')
resp = model.generate_content(['Describe this image. What application is open?', sample])
print(resp.text)
