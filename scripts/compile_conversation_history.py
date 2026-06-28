#!/usr/bin/env python3
import os
import json
import glob
import datetime

BRAIN_DIR = "/home/james/.gemini/antigravity/brain"
OUTPUT_DIR = "/home/james/sovereign_inbox/notebook_sync/StackLabs_Internal/conversations"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def compile_conversations():
    print(f"Scanning brain directory: {BRAIN_DIR}...")
    
    # Get all subdirectories in the brain folder
    subdirs = sorted([d for d in glob.glob(os.path.join(BRAIN_DIR, "*")) if os.path.isdir(d)])
    
    transcripts = []
    
    for subdir in subdirs:
        conv_id = os.path.basename(subdir)
        overview_path = os.path.join(subdir, ".system_generated", "logs", "overview.txt")
        if not os.path.exists(overview_path):
            continue
            
        print(f"Found conversation: {conv_id}")
        
        # Read the file stats
        mtime = os.path.getmtime(overview_path)
        mtime_str = datetime.datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S")
        
        conv_log = []
        conv_log.append(f"---")
        conv_log.append(f"# 💬 CONVERSATION ID: {conv_id}")
        conv_log.append(f"**LAST MODIFIED:** {mtime_str} UTC\n")
        
        try:
            with open(overview_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                        source = data.get("source")
                        content = data.get("content")
                        created_at = data.get("created_at", "")
                        
                        if content:
                            if source == "USER_EXPLICIT":
                                conv_log.append(f"### 👤 USER ({created_at}):")
                                conv_log.append(content.strip())
                                conv_log.append("")
                            elif source == "MODEL":
                                conv_log.append(f"### 🤖 ANTIGRAVITY ({created_at}):")
                                conv_log.append(content.strip())
                                conv_log.append("")
                    except Exception as e:
                        # Skip malformed lines
                        pass
        except Exception as fe:
            print(f"Error reading conversation log {conv_id}: {fe}")
            continue
            
        transcripts.append((mtime, "\n".join(conv_log)))
        
    # Sort conversations chronologically by modification time
    transcripts.sort(key=lambda x: x[0])
    
    # Combine everything
    full_history = []
    full_history.append("# 📜 SOVEREIGN OS HISTORICAL CONVERSATION LOGS")
    full_history.append("Compiled chronological logs of all past local IDE pair programming sessions.\n")
    
    for _, text in transcripts:
        full_history.append(text)
        
    history_content = "\n".join(full_history)
    print(f"Total compiled character length: {len(history_content)}")
    
    # Remove any existing parts first
    for old_part in glob.glob(os.path.join(OUTPUT_DIR, "SOVEREIGN_OS_CONVERSATION_HISTORY_PART_*.txt")):
        try:
            os.remove(old_part)
        except Exception:
            pass
            
    # Split into chunks of under 450,000 characters
    chunk_size_limit = 450000
    chunks = []
    current_chunk = []
    current_len = 0
    
    for line in history_content.splitlines():
        line_len = len(line) + 1
        if current_len + line_len > chunk_size_limit and current_chunk:
            chunks.append("\n".join(current_chunk))
            current_chunk = [line]
            current_len = line_len
        else:
            current_chunk.append(line)
            current_len += line_len
            
    if current_chunk:
        chunks.append("\n".join(current_chunk))
        
    # Write chunks
    for i, chunk_content in enumerate(chunks, 1):
        part_path = os.path.join(OUTPUT_DIR, f"SOVEREIGN_OS_CONVERSATION_HISTORY_PART_{i}.txt")
        try:
            with open(part_path, "w", encoding="utf-8") as out_f:
                out_f.write(chunk_content)
            print(f"✅ Chunk {i} written to {part_path} (characters: {len(chunk_content)})")
        except Exception as we:
            print(f"❌ Failed to write chunk {i}: {we}")
            
    print("Done compiling conversation history!")

if __name__ == "__main__":
    compile_conversations()
