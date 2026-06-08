import os
import shutil
import json
import requests
import re

transcript_path = "/home/james/SovereignOS/dna/dropzone/daily_01052026/the_skew_S01E01.md"
public_avatars_dir = "/home/james/SovereignOS/01_Sovereign_Portal/public/avatars"
avatar_map_path = "/home/james/SovereignOS/01_Sovereign_Portal/src/avatarMap.json"

project_dir = "/home/james/SovereignOS/media_vault/02_Projects/The_Skew_S01E01"
os.makedirs(project_dir, exist_ok=True)

shutil.copy(transcript_path, os.path.join(project_dir, "the_skew_S01E01.md"))

with open(transcript_path, "r") as f:
    transcript = f.read()

authors = set()
for line in transcript.split("\n"):
    if not line.strip() or line.startswith("[") or line.startswith("05:31"):
        continue
    if len(line.split()) == 1 and line.strip().lower() in ["dot", "barf", "battery_chucker", "7_train_terry", "uncle_stevie_stan", "wardy"]:
        authors.add(line.strip().lower())

with open(avatar_map_path, "r") as f:
    avatar_map = json.load(f)

for author in authors:
    author_key = author.replace("_", "")
    avatar_url = avatar_map.get(author) or avatar_map.get(author_key)
    if avatar_url:
        src = os.path.join("/home/james/SovereignOS/01_Sovereign_Portal/public", avatar_url.lstrip("/"))
        if os.path.exists(src):
            shutil.copy(src, project_dir)
            print(f"Copied avatar for {author}")

prompt = (
    "You are a Sovereign AI Director tasked with synthesizing a viral 'Flowmercial' video prompt based on a hilarious, unhinged debate from 'The Skew Studio' panel.\n"
    "Format your output EXACTLY according to the following template (do not include markdown codeblocks around the entire output, but you can use them for the prompt text):\n\n"
    "## Flowmercial: The 2026 METS COLLAPSE\n\n"
    "**Persona:** The Skew Panel\n"
    "**Format:** 16:9 Cinematic Video Synthesis\n\n"
    "## The Vision\n"
    "[Write a 1-2 sentence description of the absurd, funny scene inspired by the transcript.]\n\n"
    "## Google Flow Prompts\n\n"
    "### Start Frame\n"
    "```text\n"
    "[Write a highly detailed, cinematic prompt for a video generator (like Google Flow or Luma) to create the opening shot. Focus on lighting, mood, character action, and 4k realism.]\n"
    "```\n\n"
    "### End Frame\n"
    "```text\n"
    "[Write a highly detailed prompt for the closing shot of the video.]\n"
    "```\n\n"
    "### The Transition (Director's Notes)\n"
    "[Write a brief director's note explaining how the video transitions between the Start and End frames, highlighting the comedic timing and the core joke.]\n\n"
    f"Here is the raw transcript to base this on:\n\nTopic: The 2026 METS COLLAPSE and a new meaning for the term Mendoza line.\n\nTranscript:\n{transcript}\n\n"
    "Generate the Flowmercial script now."
)

try:
    response = requests.post(
        "http://192.168.1.183:11434/api/generate",
        json={
            "model": "llama3",
            "prompt": prompt,
            "stream": False
        },
        timeout=300
    )
    response.raise_for_status()
    result_text = response.json().get("response", "")
    with open(os.path.join(project_dir, "FLOW_PROMPTS.md"), "w") as f:
        f.write(result_text)
    print("Generated FLOW_PROMPTS.md")
except Exception as e:
    print("Failed to generate Flow Prompts:", str(e))
