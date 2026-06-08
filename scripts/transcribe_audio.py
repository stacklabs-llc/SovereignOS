import os
import sys
import subprocess
import time
import socket

# Sovereign Protocol: Dreadnought Offload
DREADNOUGHT_IP = "clio.taila01894.ts.net"
DREADNOUGHT_USER = "james"
MODEL_SIZE = "base"

def is_local_dreadnought():
    try:
        # Check if we are running on clio
        output = subprocess.check_output(["hostname"], text=True)
        return "clio" in output.lower()
    except:
        return False

files_to_transcribe = sys.argv[1:]
if not files_to_transcribe:
    print("Usage: python3 transcribe_audio.py <file1> [file2 ...]")
    sys.exit(1)

local_mode = is_local_dreadnought()

for file_path in files_to_transcribe:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
        
    print(f"[{DREADNOUGHT_IP}] Starting Dreadnought Transcription Pipeline...")
    try:
        start_time = time.time()
        filename = os.path.basename(file_path)
        base_name = filename.rsplit('.', 1)[0]
        output_path = file_path.rsplit('.', 1)[0] + "_transcript.md"
        
        if local_mode:
            print(f"[{DREADNOUGHT_IP}] Local execution detected. Bypassing SSH/SCP...")
            # Run Faster-Whisper directly
            print(f"[{DREADNOUGHT_IP}] Crushing media with Faster-Whisper ({MODEL_SIZE} engine)...")
            
            txt_path = os.path.join(os.path.dirname(file_path), base_name + ".txt")
            cmd = [
                "/home/james/whisper_env/bin/python", "/home/james/whisper_env/run_faster_whisper.py", 
                file_path, MODEL_SIZE, txt_path
            ]
            subprocess.run(cmd, check=True)
            
            if os.path.exists(txt_path):
                os.rename(txt_path, output_path)
        else:
            # 1. SCP the file to Node .183 /tmp/
            print(f"[{DREADNOUGHT_IP}] Transporting payload {filename} over secure LAN...")
            subprocess.run(["scp", file_path, f"{DREADNOUGHT_USER}@{DREADNOUGHT_IP}:/tmp/"], check=True)
            
            # 2. Trigger faster-whisper on Node .183
            print(f"[{DREADNOUGHT_IP}] Crushing media with Faster-Whisper ({MODEL_SIZE} engine)...")
            remote_txt_path = f"/tmp/{base_name}.txt"
            ssh_cmd = [
                "ssh", f"{DREADNOUGHT_USER}@{DREADNOUGHT_IP}",
                f"/home/james/whisper_env/bin/python /home/james/whisper_env/run_faster_whisper.py /tmp/{filename} {MODEL_SIZE} {remote_txt_path}"
            ]
            subprocess.run(ssh_cmd, check=True)
            
            # 3. SCP the transcript back
            print(f"[{DREADNOUGHT_IP}] Retrieving generated transcript artifact...")
            scp_cmd = ["scp", f"{DREADNOUGHT_USER}@{DREADNOUGHT_IP}:/tmp/{base_name}.txt", output_path]
            subprocess.run(scp_cmd, check=True)
            
            # 4. Clean up /tmp/ on Node .183
            subprocess.run(["ssh", f"{DREADNOUGHT_USER}@{DREADNOUGHT_IP}", f"rm /tmp/{filename} /tmp/{base_name}.txt"])
            
        # Clean up the output markdown slightly
        if os.path.exists(output_path):
            with open(output_path, "r", encoding="utf-8") as f:
                content = f.read()
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(f"# Sovereign Dreadnought Transcript ({MODEL_SIZE} engine)\n\n")
                f.write(content.strip())
                
        elapsed = time.time() - start_time
        print(f"[{DREADNOUGHT_IP}] Operation complete. Saved to {output_path} (took {elapsed:.1f}s)")
        
    except subprocess.CalledProcessError as e:
        print(f"Dreadnought pipeline failed for {file_path}: Subprocess Error {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error processing {file_path}: {e}", file=sys.stderr)
        sys.exit(1)

