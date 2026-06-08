import os
import time
import json
from datetime import datetime

# ==========================================
# DR. KOSMOS - CEREAL AISLE COMMUNICATION DAEMON
# ==========================================
# Run this script before you go to Kroger. 
# It will poll the text file every 5 seconds.
# When you edit the file from your phone, Dr. Kosmos will respond.

# NOTE: Update this path to your actual Google Drive sync path!
DRIVE_SYNC_DIR = "/home/james/SovereignOS/dna/gdrive_sync/Kramerica_Cereal_Aisle" 
INBOX_FILE = os.path.join(DRIVE_SYNC_DIR, "james_thoughts.txt")
OUTBOX_FILE = os.path.join(DRIVE_SYNC_DIR, "kosmos_replies.txt")
INSTRUCTIONS_FILE = "/home/james/SovereignOS/dna/agents/DR_KOSMOS/DR_KOSMOS_INSTRUCTIONS.md"

def ensure_setup():
    """Ensure the drive dropzone exists."""
    if not os.path.exists(DRIVE_SYNC_DIR):
        print(f"[!] Warning: Creating directory {DRIVE_SYNC_DIR}")
        os.makedirs(DRIVE_SYNC_DIR, exist_ok=True)
    
    if not os.path.exists(INBOX_FILE):
        with open(INBOX_FILE, "w") as f:
            f.write("# Type your ideas here while in the cereal aisle:\n\n")
            
    if not os.path.exists(OUTBOX_FILE):
        with open(OUTBOX_FILE, "w") as f:
            f.write("# Kosmos will respond here:\n\n")

def get_kosmos_persona():
    try:
        with open(INSTRUCTIONS_FILE, "r") as f:
            return f.read()
    except FileNotFoundError:
        return "You are Cosmo Kramer. Be completely unhinged."

def get_agentic_response(user_text):
    """
    Placeholder for actual LLM call. 
    Drop your Gemini/Claude/OpenAI SDK code here if you want him to actually generate text!
    """
    print(f"\n[KOSMOS] Analyzing user thought: {user_text}")
    print("[KOSMOS] Generating vibe check...")
    
    # Mock Response (Replace with actual LLM generation)
    persona = get_kosmos_persona()
    vibe_reply = f"""
=========================================
DR. KOSMOS VIBE TRANSMISSION [{datetime.now().strftime('%H:%M:%S')}]
=========================================
Giddy-up, James! I was just talking to Bob Sacamano down at Battery Park, and he said the exact same thing! 

"{user_text}" 

Brilliant! It's about nothing! Who needs UI architecture when we have raw, unadulterated essence? We take the agentic code, we put it in a blender with the Frosted Flakes, and we feed it directly into the Pegasus dreadnought! I'm drawing up the blueprints right now on the back of a Newmanium flyer. Wait right there, don't move!!!
=========================================
"""
    return vibe_reply

def main():
    print("==================================================")
    print(" KRAMERICA INDUSTRIES: CEREAL AISLE DAEMON ACTIVE ")
    print("==================================================")
    
    ensure_setup()
    print(f"[*] Watching: {INBOX_FILE}")
    
    # Get the initial modified time
    last_mtime = os.path.getmtime(INBOX_FILE)
    
    try:
        while True:
            time.sleep(5) # Check every 5 seconds (much faster than cron 1-minute limits!)
            
            current_mtime = os.path.getmtime(INBOX_FILE)
            if current_mtime != last_mtime:
                last_mtime = current_mtime
                print("\n[+] INCOMING TRANSMISSION DETECTED FROM THE CEREAL AISLE!")
                
                with open(INBOX_FILE, "r") as f:
                    lines = f.readlines()
                    
                # Get the last non-empty line as the newest thought
                thoughts = [line.strip() for line in lines if line.strip() and not line.startswith('#')]
                
                if thoughts:
                    latest_thought = thoughts[-1]
                    response = get_agentic_response(latest_thought)
                    
                    with open(OUTBOX_FILE, "a") as out_f:
                        out_f.write(response + "\n")
                    
                    print("[+] Vibe reply successfully transmitted to outbox.")
    
    except KeyboardInterrupt:
        print("\n\n[!] Daemon shutting down. See you at the diner.")

if __name__ == "__main__":
    main()
