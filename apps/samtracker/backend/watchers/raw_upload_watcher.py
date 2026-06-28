#!/usr/bin/env python3
import os
import sys
import time
import sqlite3
import requests
import shutil
import base64
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Ensure services are importable
SERVICES_PATH = "/home/james/SovereignOS/apps/samtracker/backend/services"
if SERVICES_PATH not in sys.path:
    sys.path.append(SERVICES_PATH)

from style_transfer import perform_style_transfer, setup_vertex
from context_compiler import compile_companion_prompts

WATCH_DIR = "/home/james/SovereignOS/apps/samtracker/storage/raw_uploads"
DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
ANCHOR_IMAGE_PATH = "/home/james/SovereignOS/work_orders/spark/media/metsy_anchor_02.png"
PUBLIC_MEDIA_DIR = "/home/james/SovereignOS/14_SamTracker/public/media"
DIST_MEDIA_DIR = "/home/james/SovereignOS/14_SamTracker/dist/media"

class RawUploadHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return
        
        filepath = event.src_path
        filename = os.path.basename(filepath)
        
        # Only process image files
        if not filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            return
            
        print(f"\n[Watcher] New raw upload detected: {filepath}")
        
        # Prevent double processing (wait a moment for file write to complete)
        time.sleep(1)
        
        try:
            self.process_image_pipeline(filepath, filename)
        except Exception as e:
            print(f"[Watcher] ERROR processing image pipeline: {e}")

    def process_image_pipeline(self, filepath, filename):
        print(f"[Watcher] Running Comic Factory generation for {filename}...")
        
        # Paths
        stylized_filename = f"stylized_{filename}"
        dest_stylized_public = os.path.join(PUBLIC_MEDIA_DIR, stylized_filename)
        dest_stylized_dist = os.path.join(DIST_MEDIA_DIR, stylized_filename)
        
        # Ensure target directories exist
        os.makedirs(PUBLIC_MEDIA_DIR, exist_ok=True)
        os.makedirs(DIST_MEDIA_DIR, exist_ok=True)
        
        # 1. Pipeline A: Style Transfer
        panel1_prompt = perform_style_transfer(filepath, dest_stylized_public)
        
        # Copy style-transferred image to dist directory if dist exists
        if os.path.exists(os.path.dirname(DIST_MEDIA_DIR)):
            shutil.copy2(dest_stylized_public, dest_stylized_dist)
            
        # 2. Pipeline B: Context Compiler
        print("[Watcher] Compiling 4 contextual companion panels...")
        panels = compile_companion_prompts()
        
        # Initialize Vertex AI vision models
        setup_vertex()
        from vertexai.preview.vision_models import ImageGenerationModel, Image as VisionImage, StyleReferenceImage
        
        anchor_image = VisionImage.load_from_file(ANCHOR_IMAGE_PATH)
        style_ref = StyleReferenceImage(reference_id=1, image=anchor_image)
        image_model = ImageGenerationModel.from_pretrained("imagen-3.0-capability-001")
        
        panel_prompts = {}
        panel_paths_public = {}
        panel_paths_db = {}
        
        # Generate the companion panels
        for p in panels:
            p_num = p["panel_number"]
            prompt = p["prompt"]
            theme = p["theme"]
            
            p_filename = f"panel{p_num}_{filename}"
            p_dest_public = os.path.join(PUBLIC_MEDIA_DIR, p_filename)
            p_dest_dist = os.path.join(DIST_MEDIA_DIR, p_filename)
            
            print(f"[Watcher] Generating Panel {p_num} (Theme: {theme})...")
            
            response = image_model._generate_images(
                prompt=prompt,
                number_of_images=1,
                aspect_ratio="1:1",
                safety_filter_level="block_some",
                person_generation="allow_adult",
                reference_images=[style_ref]
            )
            
            if response.images:
                response.images[0].save(location=p_dest_public, include_generation_parameters=False)
                if os.path.exists(os.path.dirname(DIST_MEDIA_DIR)):
                    shutil.copy2(p_dest_public, p_dest_dist)
                
                panel_prompts[p_num] = prompt
                panel_paths_public[p_num] = p_dest_public
                panel_paths_db[p_num] = f"/media/{p_filename}"
                print(f"[Watcher] Saved Panel {p_num} to {p_dest_public}")
            else:
                raise RuntimeError(f"Failed to generate panel {p_num} image.")
                
        # 3. Save to database table `samtracker_comic_strips`
        print("[Watcher] Logging comic strip metadata in SQLite...")
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO samtracker_comic_strips (
                raw_image_path, stylized_image_path, panel1_prompt,
                panel2_prompt, panel2_image_path,
                panel3_prompt, panel3_image_path,
                panel4_prompt, panel4_image_path,
                panel5_prompt, panel5_image_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            filepath, f"/media/{stylized_filename}", panel1_prompt,
            panel_prompts[2], panel_paths_db[2],
            panel_prompts[3], panel_paths_db[3],
            panel_prompts[4], panel_paths_db[4],
            panel_prompts[5], panel_paths_db[5]
        ))
        
        # 4. Save to `sam_tracker_log` SIGHTING events
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        comic_msg = (
            f"Metsy's Daily Adventures: Smyrna Patrol Comic Strip. "
            f"||| IMG:/media/{stylized_filename} "
            f"||| IMG:{panel_paths_db[2]} "
            f"||| IMG:{panel_paths_db[3]} "
            f"||| IMG:{panel_paths_db[4]} "
            f"||| IMG:{panel_paths_db[5]}"
        )
        
        cur.execute(
            "INSERT INTO sam_tracker_log (timestamp, type, message) VALUES (?, 'SIGHTING', ?)",
            (timestamp, comic_msg)
        )
        conn.commit()
        conn.close()
        
        print("[Watcher] SQLite metadata and log entries saved.")
        
        # 5. Broadcast to websocket clients by hitting local endpoint
        try:
            print("[Watcher] Triggering websocket state reload broadcast...")
            resp = requests.post("http://localhost:8083/api/internal/reload_state", timeout=5)
            if resp.status_code == 200:
                print("[Watcher] WebSockets broadcast triggered successfully.")
            else:
                print(f"[Watcher] State reload endpoint returned status code {resp.status_code}")
        except Exception as e:
            print(f"[Watcher] Failed to signal server to reload state: {e}")

def main():
    os.makedirs(WATCH_DIR, exist_ok=True)
    
    event_handler = RawUploadHandler()
    observer = Observer()
    observer.schedule(event_handler, WATCH_DIR, recursive=False)
    observer.start()
    
    print(f"===========================================================")
    print(f"👀 Comic Factory Watcher daemon watching {WATCH_DIR}...")
    print(f"===========================================================")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == "__main__":
    main()
