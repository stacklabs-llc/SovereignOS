#!/usr/bin/env python3
import os
import sys
import shutil
import vertexai
from vertexai.preview.vision_models import ImageGenerationModel

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/james/SovereignOS/config/vertex_sa.json'
DEST_DIR = "/home/james/SovereignOS/01_Sovereign_Portal/public/avatars/cmdb"
os.makedirs(DEST_DIR, exist_ok=True)

targets = {
    "clio_owl": "A dapper, classical scholar owl reading a glowing digital scroll. Realistic headshot style, cinematic lighting, dark background, detailed feathers.",
    "argo_vessel": "A sleek, high-tech explorer vessel navigating a dark neon grid. Futuristic sci-fi concept art, glowing lines, synthwave vibe.",
    "artemis_huntress": "A futuristic huntress drawing a bow made of glowing blue code lines. Cyberpunk style, glowing neon elements, epic pose.",
    "hobbes_tiger": "A dapper, sarcastic orange tiger lounging on top of a server rack. Cartoon comic style, vibrant colors, relaxed expression.",
    "calvin_kid": "A hyperactive, spiky-haired kid typing furiously on a terminal. Retro cartoon comic style, spiky blonde hair, energetic vibe.",
    "grogu_pod": "A big-eared space child sitting in a hover-pod sipping a mug of green coolant. Cute cartoon style, futuristic pod, big eyes.",
    "mando_sentinel": "A silent, silver-armored bounty hunter sentinel scanning the perimeter. Metallic armor reflections, cinematic dramatic lighting, detailed helmet.",
}

# Metsy prime is already generated, we copy it from cache
shutil.copy2("/home/james/SovereignOS/scripts/event_media_cache/metsy_soaked_rain.png", os.path.join(DEST_DIR, "metsy_prime.png"))
print("Copied metsy_prime.png from cache.")

try:
    vertexai.init(project='gen-lang-client-0840454416', location='us-central1')
    model = ImageGenerationModel.from_pretrained('imagen-3.0-generate-002')
    
    for name, prompt in targets.items():
        out_path = os.path.join(DEST_DIR, f"{name}.png")
        if os.path.exists(out_path):
            print(f"File {out_path} already exists, skipping.")
            continue
            
        print(f"Generating avatar for {name}...")
        try:
            response = model.generate_images(
                prompt=prompt,
                number_of_images=1,
                aspect_ratio="1:1",
                safety_filter_level="block_some",
                person_generation="allow_adult"
            )
            response.images[0].save(location=out_path, include_generation_parameters=False)
            print(f"Successfully generated {out_path}")
        except Exception as e:
            print(f"Failed to generate {name}: {e}")
            # Fallback to copying metsy_prime as placeholder
            shutil.copy2(os.path.join(DEST_DIR, "metsy_prime.png"), out_path)
            print(f"Copied placeholder to {out_path}")
except Exception as e:
    print(f"Vertex initialization failed: {e}")
    # Fallback all
    for name in targets.keys():
        out_path = os.path.join(DEST_DIR, f"{name}.png")
        if not os.path.exists(out_path):
            shutil.copy2(os.path.join(DEST_DIR, "metsy_prime.png"), out_path)
            print(f"Fallback placeholder copied to {out_path}")
