from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import subprocess
import os
import time
import threading
import re
import requests
import json

app = Flask(__name__)
CORS(app)

OUTPUT_DIR = "/home/james/SovereignOS/media_vault/01_Ingest"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Simple in-memory job tracker
jobs = {}

def download_video(job_id, url, include_comments=False):
    timestamp = int(time.time())
    output_filename = f"Snipe_{timestamp}.mp4"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    cmd = [
        "/home/james/SovereignOS/.venv/bin/yt-dlp",
        "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "--js-runtimes", "node",
        "--remote-components", "ejs:github",
        "-o", output_path,
    ]
    if include_comments:
        cmd.extend(["--write-comments", "--extractor-args", "youtube:max-comments=1000"])
        
    cmd.extend(["--newline"])
    cmd.append(url)
    
    try:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
        for line in process.stdout:
            match = re.search(r'\[download\]\s+(\d+\.\d+)%', line)
            if match:
                jobs[job_id]["progress"] = float(match.group(1))
        
        process.wait()
        if process.returncode == 0:
            jobs[job_id] = {
                "status": "complete",
                "file": output_path,
                "filename": output_filename,
                "progress": 100.0
            }
        else:
            jobs[job_id] = {
                "status": "error",
                "error": f"Process exited with code {process.returncode}"
            }
    except Exception as e:
        jobs[job_id] = {
            "status": "error",
            "error": str(e)
        }

def transcribe_video(job_id, filepath):
    try:
        # Call the existing transcribe script
        cmd = ["/home/james/SovereignOS/.venv/bin/python3", "/home/james/SovereignOS/scripts/transcribe_audio.py", filepath]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        output_md = filepath.rsplit('.', 1)[0] + "_transcript.md"
        if os.path.exists(output_md):
            jobs[job_id] = {
                "status": "complete",
                "file": output_md,
                "filename": os.path.basename(output_md)
            }
        else:
            jobs[job_id] = {"status": "error", "error": "Transcription script succeeded but output file not found."}
    except subprocess.CalledProcessError as e:
        jobs[job_id] = {
            "status": "error",
            "error": e.stderr.decode('utf-8', errors='ignore')
        }

def summarize_transcript(job_id, filepath, model='gemini'):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        prompt = (
            "You are a sports media analyst. Summarize this postgame show transcript into a concise "
            "TL;DR with bullet points highlighting key hot takes, analysis, and overall sentiment.\n\n"
            f"Transcript:\n{content}"
        )

        if model == 'gemini':
            try:
                import os
                import vertexai
                from vertexai.generative_models import GenerativeModel
                
                credentials_path = "/home/james/SovereignOS/config/vertex_sa.json"
                if os.path.exists(credentials_path):
                    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path
                    
                vertexai.init(project="gen-lang-client-0840454416", location="us-central1")
                
                sys_text = (
                    "You are a sports media analyst. Summarize transcripts cleanly. "
                    "ABSOLUTE RULE: Output ONLY the character's spoken words or pure analysis. "
                    "NEVER include parenthetical notes, meta-commentary, guideline references, "
                    "or any text like '(Note: ...)' or '[Note: ...]'. Your output is raw markdown summary — nothing else."
                )
                
                gemini_model = GenerativeModel("gemini-2.5-flash", system_instruction=[sys_text])
                res = gemini_model.generate_content(prompt)
                result_text = res.text.strip()
                
                output_md = filepath.rsplit('_transcript.md', 1)[0] + "_summary.md"
                with open(output_md, "w", encoding="utf-8") as f:
                    f.write(f"# Sovereign Vertex AI TL;DR (Gemini 2.5 Flash)\n\n{result_text}")
                    
                jobs[job_id] = {
                    "status": "complete",
                    "file": output_md,
                    "filename": os.path.basename(output_md)
                }
                return
            except Exception as gemini_err:
                print(f"[VERTEX FALLBACK] Vertex AI failed, falling back to local Llama 3: {gemini_err}")

        # Create sentinel lock file and start local Ollama service
        with open("/tmp/ollama_active_lock", "w") as f:
            f.write("active")
        subprocess.run(["sudo", "systemctl", "start", "ollama"], check=True)
        
        # Wait up to 10 seconds for Ollama to bind to port 11434
        for _ in range(10):
            try:
                r = requests.get("http://clio.taila01894.ts.net:11434", timeout=1)
                if r.status_code == 200:
                    break
            except:
                pass
            time.sleep(1)

        # Pipe the request to the local Ollama instance on Node .183 (Dreadnought)
        response = requests.post(
            "http://clio.taila01894.ts.net:11434/api/generate",
            json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False
            },
            timeout=900 # Allow up to 15 minutes for generation
        )
        response.raise_for_status()
        result_text = response.json().get("response", "")

        output_md = filepath.rsplit('_transcript.md', 1)[0] + "_summary.md"
        with open(output_md, "w", encoding="utf-8") as f:
            f.write(f"# Sovereign Dreadnought TL;DR (Llama 3)\n\n{result_text.strip()}")

        jobs[job_id] = {
            "status": "complete",
            "file": output_md,
            "filename": os.path.basename(output_md)
        }
    except Exception as e:
        jobs[job_id] = {
            "status": "error",
            "error": str(e)
        }
    finally:
        try:
            if os.path.exists("/tmp/ollama_active_lock"):
                os.remove("/tmp/ollama_active_lock")
        except:
            pass


@app.route('/api/snipe', methods=['POST'])
def start_snipe():
    data = request.json
    url = data.get('url')
    include_comments = data.get('include_comments', False)
    if not url:
        return jsonify({"error": "No URL provided"}), 400
        
    job_id = f"job_{int(time.time())}"
    jobs[job_id] = {"status": "downloading", "url": url, "progress": 0.0}
    
    # Start download in a background thread
    thread = threading.Thread(target=download_video, args=(job_id, url, include_comments))
    thread.start()
    
    return jsonify({"job_id": job_id})

@app.route('/api/snipe/<job_id>', methods=['GET'])
def get_snipe_status(job_id):
    if job_id not in jobs:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(jobs[job_id])

@app.route('/api/snipe/active_jobs', methods=['GET'])
def get_active_jobs():
    return jsonify(jobs)

@app.route('/api/transcribe', methods=['POST'])
def start_transcription():
    data = request.json
    filepath = data.get('filepath')
    if not filepath:
        return jsonify({"error": "No filepath provided"}), 400
        
    # If it's just a filename, resolve to absolute path
    if not filepath.startswith('/'):
        filepath = os.path.join(OUTPUT_DIR, filepath)
        
    job_id = f"transcribe_{int(time.time())}"
    jobs[job_id] = {"status": "transcribing", "filepath": filepath}
    
    thread = threading.Thread(target=transcribe_video, args=(job_id, filepath))
    thread.start()
    
    return jsonify({"job_id": job_id})

@app.route('/api/summarize', methods=['POST'])
def start_summarization():
    data = request.json
    filepath = data.get('filepath')
    model = data.get('model', 'gemini') # Default to Vertex AI Gemini for high performance
    if not filepath:
        return jsonify({"error": "No filepath provided"}), 400
        
    if not filepath.startswith('/'):
        filepath = os.path.join(OUTPUT_DIR, filepath)
        
    job_id = f"summarize_{int(time.time())}"
    jobs[job_id] = {"status": "summarizing", "filepath": filepath}
    
    thread = threading.Thread(target=summarize_transcript, args=(job_id, filepath, model))
    thread.start()
    
    return jsonify({"job_id": job_id})



@app.route('/api/skew/flowmercial', methods=['POST'])
def generate_flowmercial():
    try:
        data = request.json
        topic = data.get('topic', 'Unknown Topic')
        messages = data.get('messages', [])
        
        # Build the transcript string
        transcript = ""
        for msg in messages:
            author = msg.get('author', 'Unknown')
            text = msg.get('text', '')
            transcript += f"[{author}]: {text}\n"

        # Construct the Flowmercial generation prompt
        prompt = (
            "You are a Sovereign AI Director tasked with synthesizing a viral 'Flowmercial' video prompt based on a hilarious, unhinged debate from 'The Skew Studio' panel.\n"
            "Format your output EXACTLY according to the following template (do not include markdown codeblocks around the entire output, but you can use them for the prompt text):\n\n"
            "## Flowmercial: [Catchy Title based on the topic]\n\n"
            "**Persona:** [Identify the main persona from the transcript, e.g., Battery Chucker, Wardy, etc.]\n"
            "**Format:** 16:9 Cinematic Video Synthesis\n\n"
            "## The Vision\n"
            "[Write a 1-2 sentence description of the absurd, funny scene inspired by the transcript.]\n\n"
            "## Google Flow Prompts\n\n"
            "### Start Frame\n"
            "```text\n"
            "[Write a highly detailed, cinematic prompt for a video generator (like Google Flow or Luma) to create the opening shot. Focus on lighting, mood, character action, and 4k realism.]\n"
            "```\n\n"
            "### End Frame\n"
            "```text\n"
            "[Write a highly detailed prompt for the closing shot of the video.]\n"
            "```\n\n"
            "### The Transition (Director's Notes)\n"
            "[Write a brief director's note explaining how the video transitions between the Start and End frames, highlighting the comedic timing and the core joke.]\n\n"
            f"Here is the raw transcript to base this on:\n\nTopic: {topic}\n\nTranscript:\n{transcript}\n\n"
            "Generate the Flowmercial script now."
        )

        # Send to local Llama 3
        response = requests.post(
            "http://clio.taila01894.ts.net:11434/api/generate",
            json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False
            },
            timeout=300
        )
        response.raise_for_status()
        result_text = response.json().get("response", "")

        # Automatically create Storyboard folder and copy assets
        import re
        import shutil
        import json
        
        project_name = re.sub(r'[^a-zA-Z0-9]', '_', topic)
        if not project_name.startswith("The_Skew"):
            project_name = "The_Skew_S01E01_" + project_name
            
        project_dir = f"/home/james/SovereignOS/media_vault/02_Projects/{project_name}"
        os.makedirs(project_dir, exist_ok=True)
        
        with open(os.path.join(project_dir, "FLOW_PROMPTS.md"), "w") as f:
            f.write(result_text)
            
        with open(os.path.join(project_dir, "the_skew_S01E01.md"), "w") as f:
            f.write(transcript)
            
        panelists = set([msg.get('author') for msg in messages if msg.get('author') and msg.get('author') != 'SYSTEM'])
        avatar_map_path = "/home/james/SovereignOS/15_FanStack/src/avatarMap.json"
        public_dir = "/home/james/SovereignOS/15_FanStack/public"
        
        if os.path.exists(avatar_map_path):
            with open(avatar_map_path, "r") as f:
                avatar_map = json.load(f)
                
            for p in panelists:
                p_key = p.lower().replace(" ", "").replace("_", "")
                p_key_raw = p.lower()
                
                avatar_url = avatar_map.get(p_key_raw) or avatar_map.get(p_key)
                if avatar_url:
                    src_path = os.path.join(public_dir, avatar_url.lstrip("/"))
                    if os.path.exists(src_path):
                        shutil.copy(src_path, project_dir)

        return jsonify({"status": "success", "flow_prompt": result_text})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/snipe/tail', methods=['POST'])
def start_tail():
    data = request.json
    video_id = data.get('video_id')
    if not video_id:
        return jsonify({"error": "No video_id provided"}), 400
    
    # Simple regex to extract video ID if full URL is pasted
    match = re.search(r'(?:v=|\/)([0-9A-Za-z_-]{11}).*', video_id)
    if match:
        video_id = match.group(1)
        
    output_md = f"/home/james/sovereign_inbox/today/wardy_chat_tail.md"
    
    # Kill existing tail_wardy_chat processes just to be safe so we don't have multiple
    subprocess.run(["pkill", "-f", "tail_wardy_chat.py"], capture_output=True)
    
    cmd = ["/home/james/SovereignOS/.venv/bin/python3", "/home/james/SovereignOS/scripts/tail_wardy_chat.py", video_id, output_md]
    
    try:
        title = subprocess.check_output(["/home/james/SovereignOS/.venv/bin/yt-dlp", "--get-title", video_id], text=True).strip()
    except:
        title = "Live Sniper Feed"

    try:
        subprocess.Popen(cmd)
        return jsonify({"status": "success", "message": f"Started tailing chat for {video_id}", "video_id": video_id, "title": title})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/snipe/history', methods=['GET'])
def get_snipe_history():
    try:
        files = []
        for filename in os.listdir(OUTPUT_DIR):
            if not filename.endswith('.part'):
                filepath = os.path.join(OUTPUT_DIR, filename)
                files.append({
                    "filename": filename,
                    "mtime": os.path.getmtime(filepath),
                    "size": os.path.getsize(filepath)
                })
        # Sort by newest first
        files.sort(key=lambda x: x["mtime"], reverse=True)
        return jsonify({"files": files})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/snipe/history/<path:filename>', methods=['DELETE'])
def delete_snipe_file(filename):
    try:
        # Prevent directory traversal
        clean_name = os.path.basename(filename)
        filepath = os.path.join(OUTPUT_DIR, clean_name)
        if os.path.exists(filepath):
            os.remove(filepath)
            return jsonify({"status": "success", "message": f"Deleted {clean_name}"})
        else:
            return jsonify({"error": "File not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/snipe/read/<path:filename>', methods=['GET'])
def read_snipe_file(filename):
    try:
        clean_name = os.path.basename(filename)
        filepath = os.path.join(OUTPUT_DIR, clean_name)
        if not os.path.exists(filepath):
            return jsonify({"error": "File not found"}), 404
            
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        return jsonify({"content": content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/snipe/media/<path:filename>', methods=['GET'])
def get_media_file(filename):
    clean_name = os.path.basename(filename)
    return send_from_directory(OUTPUT_DIR, clean_name)

@app.route('/api/dreadnought/status', methods=['GET'])
def dreadnought_status():
    try:
        # Check Node .183 CPU/RAM and active whisper processes via SSH
        cmd = ["ssh", "-o", "BatchMode=yes", "james@192.168.1.183", "top -b -n 1 | head -n 4; echo '---'; ps aux | grep whisper | grep -v grep || true"]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5)
        
        output = result.stdout.strip()
        status = "ACTIVE" if "whisper" in output else "IDLE"
        
        return jsonify({
            "status": status,
            "telemetry": output,
            "error": result.stderr if result.returncode != 0 else None
        })
    except subprocess.TimeoutExpired:
        return jsonify({"status": "OFFLINE", "telemetry": "SSH Timeout. Dreadnought unreachable."}), 504
    except Exception as e:
        return jsonify({"status": "ERROR", "telemetry": str(e)}), 500


def run_local_video_analysis(job_id, filepath):
    try:
        cmd = ["/home/james/SovereignOS/.venv/bin/python3", "/home/james/SovereignOS/scripts/analyze_video_local.py", filepath]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        output_md = filepath.rsplit('.', 1)[0] + "_analysis.md"
        if os.path.exists(output_md):
            jobs[job_id] = {
                "status": "complete",
                "file": output_md,
                "filename": os.path.basename(output_md)
            }
        else:
            jobs[job_id] = {"status": "error", "error": "Analysis script succeeded but output file not found."}
    except subprocess.CalledProcessError as e:
        jobs[job_id] = {
            "status": "error",
            "error": e.stderr.decode('utf-8', errors='ignore')
        }

@app.route('/api/analyze_video', methods=['POST'])
def api_analyze_video():
    data = request.json
    if not data or 'filepath' not in data:
        return jsonify({"error": "Missing filepath"}), 400
        
    filepath = data['filepath']
    # Resolve absolute path if only filename provided
    if not filepath.startswith('/'):
        filepath = os.path.join(OUTPUT_DIR, filepath)
        
    if not os.path.exists(filepath):
        return jsonify({"error": f"File not found: {filepath}"}), 404
        
    job_id = f"analyze_{int(time.time())}"
    jobs[job_id] = {"status": "analyzing", "file": filepath}
    
    thread = threading.Thread(target=run_local_video_analysis, args=(job_id, filepath))
    thread.start()
    
    return jsonify({"status": "started", "job_id": job_id})

@app.route('/api/format_comments', methods=['POST'])
def format_comments():
    try:
        data = request.json
        filepath = data.get('filepath')
        if not filepath:
            return jsonify({"error": "No filepath provided"}), 400
            
        if not filepath.startswith('/'):
            filepath = os.path.join(OUTPUT_DIR, filepath)
            
        if not os.path.exists(filepath):
            return jsonify({"error": f"File not found: {filepath}"}), 404
            
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            info_data = json.load(f)
            
        comments = info_data.get('comments', [])
        if not comments:
            return jsonify({"error": "No comments found in JSON"}), 404
            
        # Format comments into a beautiful markdown
        md_content = []
        md_content.append(f"# YouTube Comments for {info_data.get('title', 'Video')}\n\n")
        md_content.append(f"**URL:** {info_data.get('webpage_url', 'N/A')}\n")
        md_content.append(f"**Total Ingested Comments:** {len(comments)}\n\n---\n\n")
        
        # Sort comments by like count descending
        sorted_comments = sorted(comments, key=lambda x: x.get('like_count', 0), reverse=True)
        
        for c in sorted_comments:
            author = c.get('author', 'Unknown')
            text = c.get('text', '')
            likes = c.get('like_count', 0)
            time_text = c.get('time_text') or c.get('_time_text') or 'some time ago'
            
            md_content.append(f"{author}\n")
            md_content.append(f"{time_text}\n")
            md_content.append(f"{text.strip()}\n\n")
            md_content.append(f"{likes}\n\n\n")
            md_content.append("Reply\n\n\n")
            
        output_filename = os.path.basename(filepath).replace('.info.json', '_comments.md').replace('.json', '_comments.md')
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("".join(md_content))
            
        return jsonify({
            "status": "success",
            "file": output_path,
            "filename": output_filename,
            "count": len(comments)
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5056, threaded=True)
