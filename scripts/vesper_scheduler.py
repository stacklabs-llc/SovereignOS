import time
import os
import subprocess

POLL_INTERVAL = 60 # Check operations every minute

def execute_discovery():
    script_path = "/home/james/SovereignOS/08_CMDB_Discovery/cmdb_discovery.py"
    if os.path.exists(script_path):
        print("\n=== [VESPER] Triggering Autonomous Discovery Sweep ===")
        subprocess.run(["python3", script_path])

def execute_smuggler_bay():
    print("\n=== [VESPER] Engaging Rclone Smuggler Bay Pipeline ===")
    dropzone_target = "/home/james/SovereignOS/dna/archives/smuggler_dropzone/"
    
    try:
        # Move files from the cloud Dropzone to local SSD, instantly deleting the cloud copies
        subprocess.run(["rclone", "move", "sovereign_os:Sovereign_Dropzone", dropzone_target, "-v", "--ignore-existing"], check=True)
    except Exception as e:
        print(f"[VESPER ERROR] Smuggler Bay Sync Failed: {str(e)}")

def execute_greenstack():
    script_path = "/home/james/SovereignOS/03_Ultron_Integration/greenstack_sync.py"
    if os.path.exists(script_path):
        print("\n=== [VESPER] Triggering GreenStack Synchronicity ===")
        subprocess.run(["python3", script_path])

if __name__ == "__main__":
    print("[VESPER KERNEL] Initializing Core Scheduler Loop...")
    cycles = 0
    while True:
        cycles += 1
        print(f"\n[VESPER KERNEL] Cycle #{cycles} commencing...")
        execute_greenstack()
        execute_smuggler_bay()
        
        # Perform discovery sweep every 5 minutes (5 cycles)
        if cycles % 5 == 1:
            execute_discovery()
            
        time.sleep(POLL_INTERVAL)
