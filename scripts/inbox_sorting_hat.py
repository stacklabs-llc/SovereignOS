#!/usr/bin/env python3
import os
import sys
import time
import subprocess
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Add scripts directory to path to import organize_inbox
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    from organize_inbox import organize_inbox
except ImportError:
    def organize_inbox():
        # Fallback to subprocess
        script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "organize_inbox.py")
        subprocess.run([sys.executable, script])

INBOX_DIR = "/home/james/sovereign_inbox"

class DecisionDerbyHandler(FileSystemEventHandler):
    def __init__(self):
        super().__init__()
        self.last_triggered = 0
        self.cooldown = 1.5  # seconds

    def on_created(self, event):
        if event.is_directory:
            return
            
        # Ignore files created inside subdirectories (tickets, reports, etc.)
        parent_dir = os.path.dirname(event.src_path)
        if os.path.abspath(parent_dir) != os.path.abspath(INBOX_DIR):
            return

        # Ignore standard system markers/symlinks
        filename = os.path.basename(event.src_path)
        if filename in ("today", "yesterday") or filename.startswith("."):
            return

        now = time.time()
        if now - self.last_triggered > self.cooldown:
            self.last_triggered = now
            print(f"[DECISION-DERBY] Ingestion detected: {filename}. Running sweep...")
            time.sleep(1.0)  # Wait for write completion
            try:
                organize_inbox()
            except Exception as e:
                print(f"[DECISION-DERBY] Error running organize_inbox: {e}")

if __name__ == "__main__":
    print(f"[DECISION-DERBY] Starting Decision Derby Daemon. Watching {INBOX_DIR}")
    
    # Run initial sweep
    try:
        organize_inbox()
    except Exception as e:
        print(f"[DECISION-DERBY] Initial sweep error: {e}")
        
    event_handler = DecisionDerbyHandler()
    observer = Observer()
    observer.schedule(event_handler, INBOX_DIR, recursive=False)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print("[DECISION-DERBY] Stopping daemon.")
    observer.join()

