import os
import zipfile
import re
import shutil

zip_path = "/home/james/sovereign_inbox/today/sovereign_os_notebooklm_sync/SovereignOs - Project Status_sources.zip"
output_dir = "/home/james/sovereign_inbox/today/sovereign_os_notebooklm_sync/missing_sources"
os.makedirs(output_dir, exist_ok=True)

# 1. Parse ZIP file contents and normalize names
print("[+] Reading NotebookLM ZIP file...")
zip_normalized = set()
zip_files_raw = []

with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    for name in zip_ref.namelist():
        zip_files_raw.append(name)
        # Extract base name without standard NotebookLM extensions (.txt.md, .md.txt.md, .pdf.md, etc.)
        norm = name
        norm = re.sub(r'\.md$', '', norm, flags=re.IGNORECASE)
        norm = re.sub(r'\.txt$', '', norm, flags=re.IGNORECASE)
        norm = re.sub(r'\.md$', '', norm, flags=re.IGNORECASE)
        norm = re.sub(r'\.txt$', '', norm, flags=re.IGNORECASE)
        norm = re.sub(r'\.pdf$', '', norm, flags=re.IGNORECASE)
        zip_normalized.add(norm.lower())

print(f"    Loaded {len(zip_normalized)} normalized sources from ZIP.")

# 2. Walk through sovereign_inbox recursively and find markdown/text files
print("[+] Walking through sovereign_inbox to identify local documents...")
local_files = []
ignored_patterns = ["/samtracker/", "/sam_tracker_flow/", "/archives/", "/vault/", "/.gemini/", "/.venv/", "/config/"]

for root, dirs, files in os.walk("/home/james/sovereign_inbox/"):
    # Skip ignored directories
    if any(p in root for p in ignored_patterns):
        continue
    for f in files:
        if f.endswith((".md", ".txt")):
            full_path = os.path.join(root, f)
            local_files.append((f, full_path))

# Also add the canonical SOVEREIGN_DNA.md
local_files.append(("SOVEREIGN_DNA.md", "/home/james/SovereignOS/SOVEREIGN_DNA.md"))

# 3. Filter for missing files
missing_files = []
seen_names = set()

for filename, path in local_files:
    # Normalize name
    norm = filename
    norm = re.sub(r'\.md$', '', norm, flags=re.IGNORECASE)
    norm = re.sub(r'\.txt$', '', norm, flags=re.IGNORECASE)
    norm_key = norm.lower()
    
    if norm_key not in zip_normalized and norm_key not in seen_names:
        # Check if the file size is greater than 0
        if os.path.exists(path) and os.path.getsize(path) > 0:
            missing_files.append((filename, path))
            seen_names.add(norm_key)

print(f"[+] Identified {len(missing_files)} missing source files.")

# 4. Copy missing files to the sync folder
print(f"[+] Copying missing files to {output_dir}...")
copied_count = 0
for filename, path in missing_files:
    dest_path = os.path.join(output_dir, filename)
    try:
        shutil.copy2(path, dest_path)
        print(f"    Copied: {filename} (from {os.path.basename(os.path.dirname(path))})")
        copied_count += 1
    except Exception as e:
        print(f"    [ERROR] Failed to copy {filename}: {e}")

print(f"\n=== SYNC PREPARATION COMPLETE ===")
print(f"Total files copied to missing_sources: {copied_count}")
