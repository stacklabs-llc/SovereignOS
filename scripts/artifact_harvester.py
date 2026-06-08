#!/usr/bin/env python3
"""
Sovereign OS: Artifact Harvester
Description: Scans the local AI brain storage (antigravity/brain) across all historical session hashes.
Extracts any generated media artifacts (.png, .mp4, .webp, .jpg) and securely centralizes them
in the persistent 1TB Media Drive hierarchy for eventual processing by the Hailo Edge TPU.
"""
import os
import shutil
import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path

# Paths
BRAIN_DIR = os.path.expanduser("~/.gemini/antigravity/brain")
MEDIA_DRIVE = "/home/james/SovereignOS/media_vault/03_Assets"
MOCKUPS_DIR = os.path.join(MEDIA_DRIVE, "Harvested_Artifacts")
MANIFEST_PATH = os.path.join(MOCKUPS_DIR, "harvest_manifest.json")

# Supported media formats for Edge TPU / UI Archival
ALLOWED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.mp4', '.gif', '.md', '.txt'}

def initialize_directories():
    """Ensure the media drive hierarchy exists."""
    os.makedirs(MOCKUPS_DIR, exist_ok=True)
    print(f"[*] Verified Media Drive Extranet: {MOCKUPS_DIR}")

def load_manifest():
    if os.path.exists(MANIFEST_PATH):
        with open(MANIFEST_PATH, 'r') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return {}
    return {}

def save_manifest(manifest):
    with open(MANIFEST_PATH, 'w') as f:
        json.dump(manifest, f, indent=4)

def harvest_artifacts():
    print("[*] Initiating Sovereign Artifact Harvest...")
    
    if not os.path.exists(BRAIN_DIR):
        print(f"[!] Brain directory not found at {BRAIN_DIR}. Aborting.")
        return

    initialize_directories()
    manifest = load_manifest()
    
    harvest_count = 0
    # Walk through the entire brain structure
    for root, dirs, files in os.walk(BRAIN_DIR):
        # We target files directly inside the artifacts folder OR root of a session
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in ALLOWED_EXTENSIONS:
                source_path = os.path.join(root, file)
                
                # Check if we already harvested this file via absolute path
                if source_path in manifest:
                    continue
                
                # Extract session ID from the path (the uuid folder name)
                # Form: ~/.gemini/antigravity/brain/<uuid>/...
                path_parts = Path(source_path).parts
                session_id = "unknown_session"
                try:
                    brain_idx = path_parts.index("brain")
                    if len(path_parts) > brain_idx + 1:
                        session_id = path_parts[brain_idx + 1]
                except ValueError:
                    pass
                
                # We need a clean, flat name. Prevent overwriting by prepending an abbreviated session hash
                short_hash = session_id[:8]
                new_file_name = f"{short_hash}_{file}"
                dest_path = os.path.join(MOCKUPS_DIR, new_file_name)
                
                # If a file technically exists (name collision), append a salt
                if os.path.exists(dest_path):
                    salt = hashlib.md5(source_path.encode()).hexdigest()[:4]
                    name_body, _ext = os.path.splitext(new_file_name)
                    new_file_name = f"{name_body}_{salt}{_ext}"
                    dest_path = os.path.join(MOCKUPS_DIR, new_file_name)
                
                # Copy file safely
                try:
                    shutil.copy2(source_path, dest_path)
                    print(f"   [+] Harvested: {file} -> {new_file_name}")
                    
                    # Log to Edge TPU manifest
                    manifest[source_path] = {
                        "dest_path": dest_path,
                        "session_id": session_id,
                        "original_name": file,
                        "harvested_at": datetime.now(timezone.utc).isoformat(),
                        "status": "pending_edge_tpu_scan"
                    }
                    harvest_count += 1
                except Exception as e:
                    print(f"   [!] Failed to copy {file}: {e}")

    save_manifest(manifest)
    print(f"\n[*] Harvest Complete. {harvest_count} new artifacts secured to persistent media drive.")
    print(f"[*] Ledger Updated: {MANIFEST_PATH}")

if __name__ == "__main__":
    harvest_artifacts()
