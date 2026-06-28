#!/usr/bin/env python3
import os
import sys
import time
import base64
from datetime import datetime
import vertexai
from vertexai.generative_models import GenerativeModel, Part
from vertexai.preview.vision_models import ImageGenerationModel, Image as VisionImage, StyleReferenceImage

# Configuration
CREDENTIALS_PATH = "/home/james/SovereignOS/config/vertex_sa.json"
PROJECT_ID = "gen-lang-client-0840454416"
LOCATION = "us-central1"
ANCHOR_IMAGE_PATH = "/home/james/SovereignOS/work_orders/spark/media/metsy_anchor_02.png"

def setup_vertex():
    if not os.path.exists(CREDENTIALS_PATH):
        raise FileNotFoundError(f"Vertex credentials not found at {CREDENTIALS_PATH}")
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CREDENTIALS_PATH
    vertexai.init(project=PROJECT_ID, location=LOCATION)

def analyze_target_image(target_image_path):
    """Uses Gemini 2.5 Flash to analyze the target image and describe its layout and content."""
    setup_vertex()
    model = GenerativeModel("gemini-2.5-flash")
    
    with open(target_image_path, "rb") as f:
        img_bytes = f.read()
    
    image_part = Part.from_data(data=img_bytes, mime_type="image/jpeg")
    
    prompt = (
        "Identify the primary subject, pose, position, and background details in this photo. "
        "Summarize them in a single paragraph, focusing on composition and layout so that we can replicate it in a cartoon style. "
        "Keep it under 60 words and describe only the visual elements present."
    )
    
    response = model.generate_content([prompt, image_part])
    description = response.text.strip()
    print(f"[Style Transfer] Analyzed target image: {description}")
    return description

def perform_style_transfer(target_image_path, output_path):
    """Generates the stylized comic book cell matching the target image and anchor style."""
    setup_vertex()
    
    # 1. Analyze scene using Gemini
    try:
        scene_description = analyze_target_image(target_image_path)
    except Exception as e:
        print(f"[Style Transfer] Gemini analysis failed, using default description: {e}")
        scene_description = "A cat resting on a flat surface in a cozy room."
    
    # 2. Build detailed prompt for Imagen 3
    final_prompt = (
        "A 90s cartoon outline character style, hand-drawn comic book cell. "
        f"Shows Metsy, a brown striped tabby cat with green eyes, wearing a blue tactical chest harness with orange trim and a glowing multicolored LED tracker collar, {scene_description}. "
        "Perfect continuity with the reference style, solid dark background, clean lines, bold outlines, vibrant flat colors."
    )
    
    print(f"[Style Transfer] Generated Prompt: {final_prompt}")
    
    # 3. Load style reference image
    if not os.path.exists(ANCHOR_IMAGE_PATH):
        raise FileNotFoundError(f"Anchor style image not found at {ANCHOR_IMAGE_PATH}")
        
    anchor_image = VisionImage.load_from_file(ANCHOR_IMAGE_PATH)
    style_ref = StyleReferenceImage(reference_id=1, image=anchor_image)
    
    # 4. Generate image using Imagen 3
    image_model_name = "imagen-3.0-capability-001"
    image_model = ImageGenerationModel.from_pretrained(image_model_name)
    
    print(f"[Style Transfer] Generating image using {image_model_name}...")
    response = image_model._generate_images(
        prompt=final_prompt,
        number_of_images=1,
        aspect_ratio="1:1",
        safety_filter_level="block_some",
        person_generation="allow_adult",
        reference_images=[style_ref]
    )
    
    if response.images:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        response.images[0].save(location=output_path, include_generation_parameters=False)
        print(f"[Style Transfer] Stylized cell saved successfully to: {output_path}")
        return final_prompt
    else:
        raise RuntimeError("No images returned from Imagen style transfer generation.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 style_transfer.py <target_image_path> <output_path>")
        sys.exit(1)
    
    perform_style_transfer(sys.argv[1], sys.argv[2])
