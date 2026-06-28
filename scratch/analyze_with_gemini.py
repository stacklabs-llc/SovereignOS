import os
import sys
import tempfile
import shutil
import subprocess
import vertexai
from vertexai.generative_models import GenerativeModel, Part

# Vertex AI setup
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/home/james/SovereignOS/config/vertex_sa.json"
vertexai.init(project="gen-lang-client-0840454416", location="us-central1")

video_path = "/home/james/SovereignOS/media_vault/01_Ingest/Snipe_1781617459.mp4"
output_md = "/home/james/SovereignOS/media_vault/01_Ingest/Snipe_1781617459_analysis.md"

if not os.path.exists(video_path):
    print(f"Error: Video not found at {video_path}")
    sys.exit(1)

tmp_dir = tempfile.mkdtemp(prefix="gemini_frames_")
try:
    print("Extracting frames from second 30 to 60...")
    # Extract 1 frame per second
    cmd = [
        "ffmpeg", "-y", "-ss", "30", "-to", "60", "-i", video_path,
        "-vf", "fps=1",
        os.path.join(tmp_dir, "frame_%03d.jpg")
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    
    frame_files = sorted([os.path.join(tmp_dir, f) for f in os.listdir(tmp_dir) if f.endswith('.jpg')])
    print(f"Extracted {len(frame_files)} frames.")
    
    parts = []
    prompt = (
        "You are an expert director and visual effects analyst. I have provided a sequence of frames from a video "
        "taken between second 30 and 60 (at 1 frame per second).\n\n"
        "Your task is to:\n"
        "1. Describe in detail the visual sequence of events occurring in these frames, chronologically.\n"
        "2. Detail Tom Cruise's actions, expressions, camera movements, lighting, and transitions.\n"
        "3. Provide concrete instructions for recreating this sequence as a 10-second Flow video (using video generation prompts, "
        "e.g. Google Flow or Luma, focusing on start/end frames and transitions) where we replace Tom Cruise with Sam the Cat.\n"
        "Sam the Cat should mimic the action and intensity of Tom Cruise in the clip but in a feline way.\n\n"
        "Here are the sequential frames:"
    )
    parts.append(prompt)
    
    # Read frames and append them as parts
    for idx, fpath in enumerate(frame_files):
        with open(fpath, "rb") as f:
            data = f.read()
        parts.append(Part.from_data(data=data, mime_type="image/jpeg"))
        parts.append(f" [Frame {idx+1}] ")
        
    print("Sending frames to Gemini 2.5 Flash for analysis...")
    model = GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(parts)
    
    analysis_text = response.text
    
    with open(output_md, "w") as out_f:
        out_f.write(analysis_text)
        
    print(f"Analysis saved to {output_md}")
    
finally:
    shutil.rmtree(tmp_dir)
