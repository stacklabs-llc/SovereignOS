#!/usr/bin/env python3
"""
Sovereign OS: Artifact Harvester
Description: Scans the local AI brain storage (antigravity/brain) across all historical session hashes.
Extracts any generated media artifacts and documents, and centralizes them.
- Walkthroughs (walkthrough_*.md) -> /home/james/sovereign_inbox/walkthroughs/
- Implementation plans (implementation_plan_*.md) -> /home/james/sovereign_inbox/implementation_plans/
- Media assets and fallbacks -> /home/james/SovereignOS/media_vault/03_Assets/Harvested_Artifacts/
"""
import os
import shutil
import json
import hashlib
import argparse
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Paths
BRAIN_DIR = os.path.expanduser("~/.gemini/antigravity/brain")
MEDIA_DRIVE = "/home/james/SovereignOS/media_vault/03_Assets"
MOCKUPS_DIR = os.path.join(MEDIA_DRIVE, "Harvested_Artifacts")
MANIFEST_PATH = os.path.join(MOCKUPS_DIR, "harvest_manifest.json")

WALKTHROUGHS_DIR = "/home/james/sovereign_inbox/walkthroughs"
PLANS_DIR = "/home/james/sovereign_inbox/implementation_plans"

# Supported media formats for Edge TPU / UI Archival / Docs
ALLOWED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.mp4', '.gif', '.md', '.txt', '.img'}

def initialize_directories():
    """Ensure destination directories exist."""
    os.makedirs(MOCKUPS_DIR, exist_ok=True)
    os.makedirs(WALKTHROUGHS_DIR, exist_ok=True)
    os.makedirs(PLANS_DIR, exist_ok=True)
    print(f"[*] Verified destinations exist.")

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

def harvest_artifacts(days=None, since=None):
    print("[*] Initiating Sovereign Artifact Harvest...")
    
    if not os.path.exists(BRAIN_DIR):
        print(f"[!] Brain directory not found at {BRAIN_DIR}. Aborting.")
        return

    initialize_directories()
    manifest = load_manifest()
    
    # Calculate lookback filter date
    lookback_date = None
    if days is not None:
        lookback_date = datetime.now(timezone.utc) - timedelta(days=days)
        print(f"[*] Filtering files modified within the last {days} days (since {lookback_date.isoformat()})")
    elif since is not None:
        try:
            lookback_date = datetime.strptime(since, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            print(f"[*] Filtering files modified since {since} (since {lookback_date.isoformat()})")
        except ValueError:
            print(f"[!] Invalid date format for --since. Expected YYYY-MM-DD. Ignoring filter.")

    harvest_count = 0
    # Walk through the entire brain structure
    for root, dirs, files in os.walk(BRAIN_DIR):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in ALLOWED_EXTENSIONS:
                source_path = os.path.join(root, file)
                
                # Check if we already harvested this file via absolute path
                if source_path in manifest:
                    continue
                
                # Apply time filter if active
                if lookback_date:
                    try:
                        file_mtime = datetime.fromtimestamp(os.path.getmtime(source_path), timezone.utc)
                        if file_mtime < lookback_date:
                            continue
                    except Exception as te:
                        print(f"   [!] Failed to check mtime for {file}: {te}")
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
                
                short_hash = session_id[:8]
                
                # Categorize file and determine destination directory and filename
                file_lower = file.lower()
                if file_lower.startswith("walkthrough_") and ext == ".md":
                    dest_dir = WALKTHROUGHS_DIR
                    new_file_name = file  # Keep original name without session prefix
                elif file_lower.startswith("implementation_plan_") and ext == ".md":
                    dest_dir = PLANS_DIR
                    new_file_name = file  # Keep original name without session prefix
                else:
                    dest_dir = MOCKUPS_DIR
                    new_file_name = f"{short_hash}_{file}"  # Prepend session prefix for images/fallbacks
                
                dest_path = os.path.join(dest_dir, new_file_name)
                
                # If a file technically exists (name collision), append a salt
                if os.path.exists(dest_path):
                    salt = hashlib.md5(source_path.encode()).hexdigest()[:4]
                    name_body, _ext = os.path.splitext(new_file_name)
                    new_file_name = f"{name_body}_{salt}{_ext}"
                    dest_path = os.path.join(dest_dir, new_file_name)
                
                # Copy file safely
                try:
                    shutil.copy2(source_path, dest_path)
                    print(f"   [+] Harvested: {file} -> {dest_path}")
                    
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
    print(f"\n[*] Harvest Complete. {harvest_count} new artifacts secured.")
    print(f"[*] Ledger Updated: {MANIFEST_PATH}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sovereign OS: Artifact Harvester")
    parser.add_argument("--days", type=int, help="Limit harvest to files modified within the last N days")
    parser.add_argument("--since", type=str, help="Limit harvest to files modified since YYYY-MM-DD")
    args = parser.parse_args()
    
    harvest_artifacts(days=args.days, since=args.since)
