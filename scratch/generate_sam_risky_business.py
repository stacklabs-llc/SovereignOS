import os
import sys
import time
import base64
import shutil
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

ref_img_path = "/home/james/sovereign_inbox/pilot_drops/sam_risky_business/sam_zoomies.png_202606161009.jpeg"

if not os.path.exists(ref_img_path):
    print(f"Error: Reference image not found at {ref_img_path}")
    sys.exit(1)

# Load reference image
with open(ref_img_path, "rb") as f:
    img_bytes = f.read()

ref_img = types.Image(imageBytes=img_bytes, mimeType="image/jpeg")
ref_images = [
    types.VideoGenerationReferenceImage(
        image=ref_img,
        referenceType="ASSET"
    )
]

CLIP_PROMPTS = [
    ("sam_risky_01.mp4", 
     "A cartoon orange tabby cat named Sam, matching the reference image (wearing a red shirt and blue pants), slides into a sunlit hallway with a grand wooden staircase on its hind legs. The cat is wearing white socks on its paws, holds a wooden candlestick like a microphone, and is lip-syncing enthusiastically with a joyful, uninhibited expression. High-contrast cinematic lighting with sharp banister shadows on the polished floor. 16:9 aspect ratio."),
    
    ("sam_risky_02.mp4",
     "Continuing the scene. Sam the cartoon orange tabby cat dances energetically in the hallway, kicking its legs high, twisting, and meowing passionately into the candlestick microphone. The camera slowly tracks Sam's movements as it slides and dances."),
    
    ("sam_risky_03.mp4",
     "Continuing the scene. Sam the cartoon orange tabby cat struts down the hallway towards the adjoining living room, continuing its energetic and funny performance. The lighting shifts from high-contrast shadows to warmer ambient lighting as it crosses the doorway."),
    
    ("sam_risky_04.mp4",
     "Continuing the scene. Sam the cartoon orange tabby cat walks up to a fireplace mantelpiece, gently adjusts a decorative figurine with its paw, and then turns to face the camera, striking a triumphant pose with its paws on its hips and a smug expression.")
]

current_resolution = "720p"

for i, (filename, prompt) in enumerate(CLIP_PROMPTS):
    clip_num = i + 1
    output_path = os.path.join(output_dir, filename)
    if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        print(f"Clip {clip_num} already exists. Skipping...")
        continue
        
    print(f"\n[+] Generating Clip {clip_num}: {filename}")
    
    video_input = None
    refs_to_use = ref_images
    if clip_num > 1:
        prev_filename = CLIP_PROMPTS[i-1][0]
        prev_output_path = os.path.join(output_dir, prev_filename)
        video_input = types.Video.from_file(location=prev_output_path)
        refs_to_use = None
        print(f"    --> Extended from: {prev_output_path}")
        
    dur = 7 if video_input else 8
    config = types.GenerateVideosConfig(
        aspect_ratio="16:9",
        resolution=current_resolution,
        duration_seconds=dur,
        reference_images=refs_to_use
    )
    
    try:
        operation = client.models.generate_videos(
            model="veo-3.1-generate-001",
            prompt=prompt,
            video=video_input,
            config=config
        )
        
        start_time = time.time()
        while True:
            resource_name = operation.name.rpartition('/operations/')[0]
            raw_dict = client.operations._fetch_predict_videos_operation(
                operation_name=operation.name,
                resource_name=resource_name
            )
            if raw_dict.get("done"):
                if "error" in raw_dict:
                    raise RuntimeError(f"API Error: {raw_dict['error']}")
                
                videos = raw_dict.get("response", {}).get("videos", [])
                if not videos:
                    raise RuntimeError("No videos in response!")
                
                video_b64 = videos[0].get("bytesBase64Encoded")
                video_bytes = base64.b64decode(video_b64)
                with open(output_path, "wb") as f:
                    f.write(video_bytes)
                print(f"    [SUCCESS] Saved Clip {clip_num} to {output_path}")
                break
                
            elapsed = time.time() - start_time
            print(f"    [Polling] Clip {clip_num} in progress (elapsed: {int(elapsed)}s)...")
            time.sleep(15)
            
    except Exception as e:
        print(f"    [ERROR] Clip {clip_num} failed: {e}")
        sys.exit(1)

# Stitch final
final_output_path = os.path.join(output_dir, "sam_risky_business_final.mp4")
last_clip_path = os.path.join(output_dir, CLIP_PROMPTS[-1][0])
shutil.copy2(last_clip_path, final_output_path)
print(f"\n[SUCCESS] Saved final cumulative sequence to: {final_output_path}")
