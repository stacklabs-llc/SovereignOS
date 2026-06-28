import os
import sys
import time
import base64
import subprocess
from PIL import Image
from google import genai
from google.genai import types

# Setup credentials
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/home/james/SovereignOS/config/vertex_sa.json"

client = genai.Client(
    vertexai=True,
    project="gen-lang-client-0840454416",
    location="us-central1"
)

output_dir = "/home/james/sovereign_inbox/sam_risky_business"
os.makedirs(output_dir, exist_ok=True)

storyboard_path = "/home/james/sovereign_inbox/pilot_drops/sam_risky_business/Cat's_Risky_Business_dance_story…_202606161025.jpeg"

if not os.path.exists(storyboard_path):
    print(f"Error: Storyboard image not found at {storyboard_path}")
    sys.exit(1)

# 1. Crop the 4 panels using PIL
print("[+] Cropping storyboard panels...")
img = Image.open(storyboard_path)
width, height = img.size
w_half = width // 2
h_half = height // 2

panels = [
    ("panel_1.jpg", img.crop((0, 0, w_half, h_half))),
    ("panel_2.jpg", img.crop((w_half, 0, width, h_half))),
    ("panel_3.jpg", img.crop((0, h_half, w_half, height))),
    ("panel_4.jpg", img.crop((w_half, h_half, width, height)))
]

panels_data = []
for filename, p_img in panels:
    path = os.path.join(output_dir, filename)
    p_img.save(path, "JPEG")
    panels_data.append(path)

print(f"[+] Successfully cropped and saved 4 panel images in {output_dir}")

# 2. Prompts definition
prompts = [
    "A cartoon orange tabby cat wearing a white button-down shirt and white socks slides on a polished wooden floor, holding a golden candlestick. The cat has a determined, intense expression. Camera tracks the slide.",
    "A cartoon orange tabby cat wearing a white button-down shirt and white socks stands on a wooden floor, singing dramatically with its mouth wide open, holding a golden candlestick. Heartfelt performance, warm light.",
    "A cartoon orange tabby cat wearing a white button-down shirt and white socks spins rapidly in a dizzying spin in a living room, near a floral armchair. Playful animation.",
    "A cartoon orange tabby cat wearing a white button-down shirt and white socks stands on a floral couch, smiling widely with a big toothy grin, holding a golden candlestick/microphone, performing enthusiastically."
]

# 3. Submit video generation requests concurrently
print("\n[+] Submitting video generation requests in parallel...")
operations = []
for idx, panel_path in enumerate(panels_data):
    prompt = prompts[idx]
    print(f"    --> Submitting Panel {idx+1} using: {panel_path}")
    image_input = types.Image.from_file(location=panel_path)
    op = client.models.generate_videos(
        model="veo-3.1-generate-001",
        image=image_input,
        prompt=prompt,
        config=types.GenerateVideosConfig(
            aspect_ratio="16:9",
            resolution="720p",
            duration_seconds=6
        )
    )
    operations.append((idx, op, panel_path))

# 4. Concurrently poll all 4 operations
print("\n[+] Polling operations concurrently (parallel generation)...")
completed = [False] * len(operations)
start_time = time.time()
while not all(completed):
    for idx, op, panel_path in operations:
        if completed[idx]:
            continue
        try:
            resource_name = op.name.rpartition('/operations/')[0]
            raw_dict = client.operations._fetch_predict_videos_operation(
                operation_name=op.name,
                resource_name=resource_name
            )
            if raw_dict.get("done"):
                if "error" in raw_dict:
                    print(f"    [!] Panel {idx+1} failed: {raw_dict['error']}")
                else:
                    videos = raw_dict.get("response", {}).get("videos", [])
                    if videos:
                        video_b64 = videos[0].get("bytesBase64Encoded")
                        video_bytes = base64.b64decode(video_b64)
                        clip_path = os.path.join(output_dir, f"panel_clip_{idx+1}.mp4")
                        with open(clip_path, "wb") as f:
                            f.write(video_bytes)
                        print(f"    [SUCCESS] Panel {idx+1} saved to {clip_path}")
                completed[idx] = True
        except Exception as poll_err:
            print(f"    [!] Error polling Panel {idx+1}: {poll_err}")
            completed[idx] = True
            
    elapsed = time.time() - start_time
    if not all(completed):
        print(f"    [Polling] In progress (elapsed: {int(elapsed)}s)...")
        time.sleep(15)

# 5. Lossless concatenation using ffmpeg
print("\n[+] Sticking and concatenating clips lostlessly...")
concat_list_path = os.path.join(output_dir, "concat_list.txt")
with open(concat_list_path, "w") as f:
    for idx in range(4):
        f.write(f"file 'panel_clip_{idx+1}.mp4'\n")

final_output = os.path.join(output_dir, "sam_storyboard_dance_final.mp4")
ffmpeg_cmd = [
    "ffmpeg", "-y", "-f", "concat", "-safe", "0",
    "-i", concat_list_path, "-c", "copy", final_output
]

try:
    subprocess.run(ffmpeg_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"\n[SUCCESS] Final storyboard movie assembled successfully!")
    print(f"          Output path: {final_output}")
    print(f"          File size: {os.path.getsize(final_output)} bytes")
except Exception as ffmpeg_err:
    print(f"    [!] ffmpeg assembly failed: {ffmpeg_err}")
