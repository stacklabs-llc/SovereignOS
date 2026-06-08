**LAST SYNC TIME:** 2026-06-08 21:25:15 UTC

# 🧬 SOVEREIGN OS / STACKLABS SOURCE CODEBASE - PART 3
## CONSOLIDATED SOURCE CODE FOR NOTEBOOKLM INGESTION


## FILE: `scripts/maintenance/bro_decoder_portal.py`
```py
import os
import glob
import json
import time
from flask import Flask, send_from_directory, Response, jsonify

app = Flask(__name__, static_folder='/home/james/SovereignOS/13_Bro_Decoder_UI')
BRAIN_DIR = '/home/james/.gemini/antigravity/brain'
OUTPUT_DIR = '/home/james/SovereignOS/media_vault/05_Archive'

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

def parse_overview_log(file_path):
    """Generator that parses the raw JSON objects from an overview.txt file."""
    if not os.path.exists(file_path):
        return
        
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip():
                continue
            try:
                data = json.loads(line.strip())
                
                # Extract User Prompts
                if data.get('source') == 'USER_EXPLICIT' and 'content' in data:
                    text = data['content']
                    # Try to extract just the <USER_REQUEST> part if present
                    if '<USER_REQUEST>' in text and '</USER_REQUEST>' in text:
                        text = text.split('<USER_REQUEST>')[1].split('</USER_REQUEST>')[0].strip()
                    else:
                        text = text.strip()
                        
                    if len(text) > 20: 
                        yield {"type": "data", "log_type": "prompt", "content": text}
                
                # Extract Model Implementation Plans or Artifact updates
                elif data.get('source') == 'MODEL' and 'tool_calls' in data:
                    for tool_call in data['tool_calls']:
                        func_name = tool_call.get('name')
                        if func_name in ['write_to_file', 'replace_file_content']:
                            args = tool_call.get('args', {})
                            
                            # Safely handle if args is a string (JSON string) or dict
                            if isinstance(args, str):
                                try:
                                    args = json.loads(args)
                                except json.JSONDecodeError:
                                    continue
                                    
                            target_file = args.get('TargetFile', '')
                            
                            # If it's an implementation plan
                            if 'implementation_plan.md' in target_file:
                                content = args.get('CodeContent', args.get('ReplacementContent', ''))
                                if content:
                                    snippet = content[:500] + "...\n[TRUNCATED FOR RAG EFFICIENCY]"
                                    yield {"type": "data", "log_type": "plan", "content": f"Implementation Plan Updated:\n{snippet}"}
                            
                            # If it's an architectural code edit
                            elif '/apiary/' in target_file and not any(x in target_file for x in ['node_modules', '.venv', '.git', 'scratch']):
                                desc = args.get('Description', 'Modified file.')
                                yield {"type": "data", "log_type": "file", "content": f"Edited: {os.path.basename(target_file)}\nContext: {desc}"}

            except json.JSONDecodeError:
                continue

@app.route('/api/stream_history')
def stream_history():
    def generate():
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        master_payload = []
        
        session_folders = sorted(glob.glob(os.path.join(BRAIN_DIR, '*')))
        
        for folder in session_folders:
            if not os.path.isdir(folder): continue
            
            session_id = os.path.basename(folder)
            overview_path = os.path.join(folder, '.system_generated', 'logs', 'overview.txt')
            
            if os.path.exists(overview_path):
                # Notify UI of progress
                yield f"data: {json.dumps({'type': 'progress', 'session_id': session_id})}\n\n"
                
                # Notify UI we are entering a new session
                yield f"data: {json.dumps({'type': 'data', 'log_type': 'session', 'session_id': session_id})}\n\n"
                
                master_payload.append(f"\n\n======================================\nSESSION: {session_id}\n======================================\n")
                
                for item in parse_overview_log(overview_path):
                    # Stream to UI
                    yield f"data: {json.dumps(item)}\n\n"
                    # Append to master text payload
                    prefix = f"[{item['log_type'].upper()}] "
                    master_payload.append(prefix + item['content'])
                    
                    # Small delay so the user can actually read the Matrix stream
                    time.sleep(0.05)
                    
        # Write the final artifact
        final_file = os.path.join(OUTPUT_DIR, 'BRO_DECODER_RAW_HISTORY.md')
        with open(final_file, 'w', encoding='utf-8') as f:
            f.write("# SOVEREIGN OS: OMNISCIENT RAG MATRIX\n")
            f.write("Generated by the Bro-Decoder IDE Crawler.\n\n")
            f.write("\n\n".join(master_payload))
            
        yield f"data: {json.dumps({'type': 'complete', 'file': final_file})}\n\n"

    return Response(generate(), mimetype='text/event-stream')

if __name__ == '__main__':
    print("🚀 Bro-Decoder UI Portal active on Port 8085")
    app.run(host='0.0.0.0', port=8085, threaded=True)
```

================================================================================


## FILE: `scripts/maintenance/sovereign_server.py`
```py
import http.server
import socketserver
import json
import os
import base64

PORT = 80
DIRECTORY = "/home/james/SovereignOS"
CMDB_PATH = os.path.join(DIRECTORY, "04_Sovereign_Core/sovereign_cmdb.json")
SMUGGLER_BAY_PATH = os.path.join(DIRECTORY, "dna/archives/smuggler_dropzone")

# Ensure the Smuggler Bay exists natively on the local filesystem
os.makedirs(SMUGGLER_BAY_PATH, exist_ok=True)

class SovereignHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/telemetry':
            telemetry_path = os.path.join(DIRECTORY, "04_Sovereign_Core/telemetry.json")
            if os.path.exists(telemetry_path):
                self.send_response(200)
                self._set_cors_headers()
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                with open(telemetry_path, 'r') as f:
                    self.wfile.write(f.read().encode())
            else:
                self.send_response(404)
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(b'{"error": "Telemetry not found"}')
        elif self.path == '/api/ledger':
            ledger_path = os.path.join(DIRECTORY, "master_ledger.json")
            if os.path.exists(ledger_path):
                self.send_response(200)
                self._set_cors_headers()
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                with open(ledger_path, 'r') as f:
                    self.wfile.write(f.read().encode())
            else:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b'{"error": "Ledger not found"}')
        elif self.path == '/api/gwen/sessions':
            sessions_path = os.path.join(DIRECTORY, "dna/agents/GWEN/active_sessions")
            if os.path.exists(sessions_path):
                self.send_response(200)
                self._set_cors_headers()
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                items = sorted(os.listdir(sessions_path))
                self.wfile.write(json.dumps(items).encode())
            else:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b'{"error": "Session directory not found"}')
        else:
            super().do_GET()

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)

        if self.path == '/api/save_cmdb':
            try:
                data = json.loads(post_data)
                with open(CMDB_PATH, 'w') as f:
                    json.dump(data, f, indent=4)
                self.send_response(200)
                self._set_cors_headers()
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status": "success"}')
            except Exception as e:
                self.send_response(500)
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(f'{{"error": "{str(e)}"}}'.encode())
        
        elif self.path == '/api/upload':
            try:
                # The payload has pure Base64 images to bypass multipart boundaries!
                data = json.loads(post_data)
                assets = data.get("assets", [])
                
                # Write the text payload metadata into an event log
                event_log_path = os.path.join(SMUGGLER_BAY_PATH, f"payload_{data.get('timestamp', 'unknown').replace(':', '')}.json")
                with open(event_log_path, 'w') as f:
                    json.dump(data, f, indent=4)
                
                # Extract and decode all physical Blobs
                for asset in assets:
                    name = asset.get("name", "unknown_file.bin")
                    b64_data = asset.get("data", "")
                    
                    # Split 'data:image/png;base64,iVBORw0KGg...' to get the raw bytes
                    if "," in b64_data:
                        raw_b64 = b64_data.split(",")[1]
                    else:
                        raw_b64 = b64_data
                        
                    file_path = os.path.join(SMUGGLER_BAY_PATH, name)
                    with open(file_path, "wb") as f:
                        f.write(base64.b64decode(raw_b64))

                print(f"[SMUGGLER BAY] Extracted {len(assets)} files into the zero-trust pipeline.")

                self.send_response(200)
                self._set_cors_headers()
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status": "assets_secured"}')
                
            except Exception as e:
                print(f"[API ERROR] {str(e)}")
                self.send_response(500)
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(f'{{"error": "{str(e)}"}}'.encode())

        elif self.path == '/api/mission_notes':
            try:
                data = json.loads(post_data)
                notes_path = os.path.join(DIRECTORY, "dna/ci/mission_notes.json")
                
                # Load existing or start new
                current_notes = []
                if os.path.exists(notes_path):
                    with open(notes_path, 'r') as f:
                        current_notes = json.load(f)
                
                current_notes.append(data)
                
                with open(notes_path, 'w') as f:
                    json.dump(current_notes, f, indent=4)
                
                self.send_response(200)
                self._set_cors_headers()
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status": "captured"}')
            except Exception as e:
                self.send_response(500)
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(f'{{"error": "{str(e)}"}}'.encode())
        else:
            self.send_response(404)
            self._set_cors_headers()
            self.end_headers()

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

if __name__ == '__main__':
    with ReusableTCPServer(("", PORT), SovereignHandler) as httpd:
        print(f"Sovereign Core API (Port {PORT}) online with Smuggler Bay & Ω CAST endpoints.")
        httpd.serve_forever()
```

================================================================================


## FILE: `scripts/maintenance/establish_section7.sh`
```sh
#!/bin/bash
# ==============================================================================
# SOVEREIGN OS // SECTION 7 INITIALIZATION PROTOCOL
# TARGET: 64GB MicroSD (mmcblk0) -> "Smuggler's Bay / Un-Circle-Jerked Data"
# ==============================================================================

TARGET_DEVICE="/dev/mmcblk0"
MOUNT_POINT="/mnt/section7"

echo "==========================================================="
echo "[WARNING] INITIATING SECTION 7 OVERRIDE"
echo "Targeting Ghost Drive: $TARGET_DEVICE"
echo "All ambient data on this MicroSD card is about to be purged."
echo "==========================================================="
echo ""
read -p "Type 'AUTHORIZE' to proceed with the scrub: " auth

if [ "$auth" != "AUTHORIZE" ]; then
    echo "Aborting Section 7 Initialization."
    exit 1
fi

echo ""
echo "[1/4] Formatting $TARGET_DEVICE to ext4 (Wiping the Slate)..."
mkfs.ext4 -F $TARGET_DEVICE

echo "[2/4] Constructing the Section 7 physical mount point at $MOUNT_POINT..."
mkdir -p $MOUNT_POINT

echo "[3/4] Mounting the Ghost Drive..."
mount $TARGET_DEVICE $MOUNT_POINT

echo "[4/4] Assigning Sovereign Read/Write Permissions to Operator '$SUDO_USER'..."
chown -R $SUDO_USER:$SUDO_USER $MOUNT_POINT
chmod -R 775 $MOUNT_POINT

echo ""
echo "==========================================================="
echo "SECTION 7 IS ONLINE."
echo "==========================================================="
df -h $MOUNT_POINT
echo ""
echo "Next Step: Samba & Rclone configuration..."
```

================================================================================


## FILE: `scripts/maintenance/argus_node.py`
```py
import subprocess
from flask import Flask, Response

# principal architect: the sovereign ffmpeg-based MJPEG relay
# bypasses opencv-python dependencies for Pi Zero 2W mesh nodes
app = Flask(__name__)

def generate_frames():
    # -f v4l2 (input device) -> /dev/video0
    # -c:v mjpeg (codec) -> convert to mjpeg
    # -f mjpeg (format) -> stream of jpegs
    # -r 5 (frame rate) -> throttle to preserve pi zero 2w thermals
    cmd = [
        'ffmpeg', '-hide_banner', '-loglevel', 'error',
        '-f', 'v4l2', '-i', '/dev/video0', 
        '-c:v', 'mjpeg', '-f', 'mjpeg', '-r', '5', '-'
    ]
    
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=1024 * 10)
    
    try:
        buffer = b""
        while True:
            chunk = process.stdout.read(1024 * 4)
            if not chunk:
                break
            buffer += chunk
            
            # Locate JPEG frame boundaries (SOI=0xFFD8, EOI=0xFFD9)
            start = buffer.find(b'\xff\xd8')
            end = buffer.find(b'\xff\xd9', start)
            
            if start != -1 and end != -1:
                # Extract frame and clear buffer
                frame = buffer[start:end+2]
                buffer = buffer[end+2:]
                
                # Yield multipart HTTP payload
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                
            elif len(buffer) > 1024 * 500: # Safety flush
                buffer = b""
    except Exception as e:
        print(f"[!] STREAM ERROR: {e}")
    finally:
        process.terminate()

@app.route('/')
def video_feed():
    # Push the unadulterated byte stream directly into the Sovereign OS
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    print("[+] ARGUS NODE MANDO ONLINE: Streaming /dev/video0 via FFmpeg on Port 8081...")
    # Threaded=True allows multiple local/remote viewers to grab the feed
    app.run(host='0.0.0.0', port=8081, threaded=True, debug=False)
```

================================================================================


## FILE: `scripts/maintenance/cold_boot_gem_pro.js`
```js
// Cold Boot Gem Pro – lightweight voice synthesis for mobile
// Load this script via <script src="/cold_boot_gem_pro.js"></script>
// Usage: ColdBootGem.speak('Hello, world!');

const ColdBootGem = (function() {
  // Private helper to select a suitable voice (prefer English, fallback to default)
  function getVoice() {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    // Prefer a voice with language starting with 'en'
    const enVoice = voices.find(v => v.lang.startsWith('en'));
    return enVoice || voices[0];
  }

  // Ensure voices are loaded before speaking (some browsers need a short async delay)
  function ensureVoicesReady() {
    return new Promise(resolve => {
      if (window.speechSynthesis.getVoices().length) {
        resolve();
      } else {
        window.speechSynthesis.onvoiceschanged = () => resolve();
      }
    });
  }

  async function speak(text, options = {}) {
    if (!('speechSynthesis' in window)) {
      console.warn('ColdBootGem: Speech Synthesis API not supported in this browser.');
      return;
    }
    await ensureVoicesReady();
    const utter = new SpeechSynthesisUtterance(text);
    const voice = getVoice();
    if (voice) utter.voice = voice;
    // Default rate 1.25x as per project spec, allow override via options
    utter.rate = options.rate || 1.25;
    utter.pitch = options.pitch || 1;
    utter.volume = options.volume || 1;
    // Optional callback when finished
    if (typeof options.onEnd === 'function') {
      utter.onend = options.onEnd;
    }
    window.speechSynthesis.speak(utter);
  }

  // Expose a simple API
  return {
    speak,
    // Convenience: speak and then execute a callback (e.g., after voice finishes)
    speakThen: async function(text, callback) {
      await speak(text, { onEnd: callback });
    }
  };
})();

// Export for module environments (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ColdBootGem;
}
```

================================================================================


## FILE: `scripts/maintenance/argus_streamer.py`
```py
import cv2
from flask import Flask, Response
import time
import sys

# ultra-lean MJPEG streamer for Argus Node (Pi Zero 2W)
app = Flask(__name__)

# Try multiple indices and forcefully bypass GStreamer by using raw V4L2 backend
camera = None
active_index = -1
for idx in [0, 2, 1, 4]:
    print(f"[*] Scanning /dev/video{idx} via V4L2...")
    cap = cv2.VideoCapture(idx, cv2.CAP_V4L2)
    if cap.isOpened():
        success, _ = cap.read()
        if success:
            camera = cap
            active_index = idx
            print(f"[+] HARDWARE LOCK: Successfully engaged /dev/video{idx}")
            break
        else:
            cap.release()

if camera is None or not camera.isOpened():
    print(f"[!] ENGINES DEAD: Could not establish a pure V4L2 video stream.")
    sys.exit(1)

def generate_frames():
    while True:
        success, frame = camera.read()
        if not success:
            time.sleep(0.1)
            continue
        
        # JPEG compression (80% quality balances bandwidth and YOLOv8 accuracy)
        ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        frame_bytes = buffer.tobytes()
        
        # Yield the multipart frame payload to the HTTP stream
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/')
def video_feed():
    # Push the unadulterated byte stream directly into the Sovereign OS
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    print("[+] ARGUS NODE ONLINE: Streaming /dev/video0 on Port 8081...")
    # Threaded=True is critical so multiple viewers (you + YOLO model) can grab frames simultaneously
    app.run(host='0.0.0.0', port=8081, threaded=True)
```

================================================================================
