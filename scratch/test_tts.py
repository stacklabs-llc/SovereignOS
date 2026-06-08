import os
import sys
from google import genai
from google.genai import types

print("Setting up credentials...")
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/home/james/SovereignOS/config/vertex_sa.json"

print("Initializing Client...")
client = genai.Client(
    vertexai=True,
    project="gen-lang-client-0840454416",
    location="us-central1"
)

print("Sending API request...")
try:
    response = client.models.generate_content(
        model="gemini-2.5-flash-tts",
        contents="Yo, this is Barf. Testing the voice generation system. Flushing Queens in the house!",
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name="Enceladus",
                    )
                )
            ),
        ),
    )
    print("API Success!")
    print("Candidates:", len(response.candidates))
    part = response.candidates[0].content.parts[0]
    if part.inline_data:
        print("Audio bytes size:", len(part.inline_data.data))
        # Save a sample to test.wav
        import wave
        with wave.open("/home/james/SovereignOS/scratch/test.wav", "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(24000)
            wf.writeframes(part.inline_data.data)
        print("Saved sample to /home/james/SovereignOS/scratch/test.wav")
    else:
        print("No inline data in first part")
except Exception as e:
    print("API Error:", e)
