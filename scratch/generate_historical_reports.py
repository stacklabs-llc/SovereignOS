import os
import json
import glob
from datetime import datetime

brain_dir = '/home/james/.gemini/antigravity/brain'
output_dir = '/home/james/sovereign_inbox/retro_reports'
os.makedirs(output_dir, exist_ok=True)

# Find all overview.txt files
overview_files = glob.glob(os.path.join(brain_dir, '*', '.system_generated', 'logs', 'overview.txt'))
print(f"Found {len(overview_files)} session logs.")

count = 0
for file_path in overview_files:
    session_uuid = file_path.split('/')[-4]
    
    # Read the file
    lines = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    try:
                        lines.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        continue
        
    if not lines:
        continue
        
    # Get created_at from first line
    created_at_str = lines[0].get('created_at', '')
    if not created_at_str:
        continue
        
    try:
        # Format: "2026-05-16T17:11:58Z"
        dt = datetime.strptime(created_at_str, "%Y-%m-%dT%H:%M:%SZ")
        timestamp = dt.strftime("%Y%m%d_%H%M%S")
    except Exception as e:
        print(f"Error parsing date {created_at_str}: {e}")
        continue
        
    # We don't overwrite if it already exists because they may have been synced
    output_path = os.path.join(output_dir, f"SESSION_REPORT_{timestamp}.md")
    if os.path.exists(output_path):
        continue
        
    # Generate content
    markdown_lines = []
    markdown_lines.append(f"# Session Report: {timestamp}")
    markdown_lines.append(f"**Session ID:** {session_uuid}")
    markdown_lines.append(f"**Date:** {dt.strftime('%Y-%m-%d %H:%M:%S')} UTC\n")
    markdown_lines.append("## Transcript\n")
    
    for entry in lines:
        source = entry.get('source')
        if source == 'USER_EXPLICIT':
            content = entry.get('content', '')
            if content and '<USER_REQUEST>' in content:
                # Extract just the request if possible
                request = content.split('<USER_REQUEST>')[1].split('</USER_REQUEST>')[0].strip()
                markdown_lines.append(f"### USER\n{request}\n")
        elif source == 'MODEL' and entry.get('type') == 'PLANNER_RESPONSE':
            content = entry.get('content', '')
            if content:
                markdown_lines.append(f"### AGENT\n{content}\n")
                
    if len(markdown_lines) > 4: # Means we added some transcript
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(markdown_lines))
        count += 1

print(f"Generated {count} new session reports in {output_dir}")
