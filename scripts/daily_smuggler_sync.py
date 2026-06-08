#!/usr/bin/env python3
"""
OPERATION DAILY AIRLOCK (METAL-TO-CLOUD SUTURE)
Autonomously vacuums fragmented payloads and smuggles them to the Cloud.
"""

import os
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

# Configuration
APIARY_ROOT = "/home/james/SovereignOS"
DROPZONE_BASE = os.path.join(APIARY_ROOT, "dna/dropzone")
GDRIVE_REMOTE = "sovereign_os:Sovereign_OS_Master_Payloads/Daily_Airlock"

# Directories to vacuum
VACUUM_DIRS = [
    "/home/james/Downloads",
    "/tmp",
    os.path.join(APIARY_ROOT, "dna/agents")
]

TARGET_EXTS = {".md", ".json", ".csv", ".txt", ".mp4", ".png", ".jpg", ".jpeg", ".mp3", ".wav"}
MEDIA_EXTS = {".mp4", ".png", ".jpg", ".jpeg", ".mp3", ".wav"}

def generate_silo_path():
    date_str = datetime.now().strftime("%d%m%Y")
    silo_dir = os.path.join(DROPZONE_BASE, f"daily_{date_str}")
    os.makedirs(silo_dir, exist_ok=True)
    return silo_dir

def is_modified_today(filepath):
    try:
        mtime = os.path.getmtime(filepath)
        file_date = datetime.fromtimestamp(mtime).date()
        today = datetime.now().date()
        return file_date == today
    except Exception:
        return False

def vacuum_files(silo_dir):
    print(f"[*] Commencing File Vacuum for {datetime.now().date()}...")
    moved_count = 0
    today_files = []

    for directory in VACUUM_DIRS:
        if not os.path.exists(directory):
            continue
        
        print(f"    Scanning: {directory}")
        dir_path = Path(directory)
        
        if directory == "/tmp":
            paths = [p for p in dir_path.iterdir() if p.is_file() and p.suffix.lower() in TARGET_EXTS]
        else:
            paths = [p for p in dir_path.rglob("*") if p.is_file() and p.suffix.lower() in TARGET_EXTS]
            
        for path in paths:
            if is_modified_today(path):
                # Ensure we don't accidentally move things already in the dropzone or system files
                if "dna/dropzone" in str(path) or ".gemini" in str(path):
                    continue
                today_files.append(path)

    for file_path in today_files:
        ext = file_path.suffix.lower()
        cat_name = "media" if ext in MEDIA_EXTS else ext.lstrip(".")
        sub_silo = os.path.join(silo_dir, cat_name)
        os.makedirs(sub_silo, exist_ok=True)
        
        file_name = file_path.name
        # Rule 81: The NotebookLM Suture (.md -> .md.txt)
        if ext == ".md":
            file_name += ".txt"
            
        dest_path = os.path.join(sub_silo, file_name)
        
        # Handle naming collisions gracefully
        counter = 1
        while os.path.exists(dest_path):
            stem = file_path.stem
            dest_path = os.path.join(sub_silo, f"{stem}_{counter}{ext}{'.txt' if ext == '.md' else ''}")
            counter += 1
            
        print(f"    Moving: {file_path.name} -> {os.path.basename(silo_dir)}/{cat_name}/{file_name}")
        try:
            shutil.move(str(file_path), dest_path)
            moved_count += 1
        except Exception as e:
            print(f"    [!] Failed to move {file_path.name}: {e}")

    print(f"[*] Vacuum Complete. {moved_count} file(s) secured in {silo_dir}.")
    return silo_dir, moved_count

def rclone_bridge(silo_dir):
    print(f"[*] Initializing Rclone Cloud Bridge to {GDRIVE_REMOTE}...")
    silo_name = os.path.basename(silo_dir)
    dest_remote = f"{GDRIVE_REMOTE}/{silo_name}"
    
    cmd = ["rclone", "copy", silo_dir, dest_remote, "-P"]
    try:
        subprocess.run(cmd, check=True)
        print("[+] Rclone Sync Successful. Lore is live in the Cloud.")
    except subprocess.CalledProcessError as e:
        print(f"[!] Rclone Sync Failed. Error: {e}")
        print("    Ensure 'gdrive' remote is configured and accessible.")
    except FileNotFoundError:
        print("[!] Rclone is not installed or not found in PATH. Sync bypassed.")

if __name__ == "__main__":
    print("==================================================")
    print(" Sovereign OS - Daily Smuggler Target Sync")
    print("==================================================")
    
    silo = generate_silo_path()
    _, count = vacuum_files(silo)
    
    if count > 0:
        rclone_bridge(silo)
    else:
        print("[*] Empty haul. No files modified today.")

