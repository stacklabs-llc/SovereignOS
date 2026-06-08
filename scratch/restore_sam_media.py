import sqlite3
import os
import shutil
import re

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
TARGET_MEDIA_DIR = "/home/james/SovereignOS/14_SamTracker/public/media"
TARGET_DIST_DIR = "/home/james/SovereignOS/14_SamTracker/dist/media"

SEARCH_ROOTS = [
    "/home/james/sovereign_inbox",
    "/home/james/SovereignOS/media_vault",
    "/home/james/.gemini/antigravity/brain"
]

def find_file_in_roots(filename):
    for root in SEARCH_ROOTS:
        if not os.path.exists(root):
            continue
        for dirpath, _, filenames in os.walk(root):
            if filename in filenames:
                return os.path.join(dirpath, filename)
    return None

def main():
    print("Starting SamTracker Media Recovery & Migration Pipeline...")
    os.makedirs(TARGET_MEDIA_DIR, exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Query all rows containing /inbox/
    cur.execute("SELECT id, message FROM sam_tracker_log WHERE message LIKE '%/inbox/%'")
    rows = cur.fetchall()
    
    print(f"Found {len(rows)} database entries containing inbox references.")
    
    updated_count = 0
    found_count = 0
    
    for row_id, message in rows:
        # Search for pattern: IMG:/inbox/filename or VID:/inbox/filename or VID_PROCESSING:/inbox/filename
        match = re.search(r'(IMG|VID|VID_PROCESSING):/inbox/([^\s|]+)', message)
        if not match:
            continue
            
        media_type = match.group(1)
        filename = match.group(2)
        old_ref = f"/inbox/{filename}"
        new_ref = f"/media/{filename}"
        
        print(f"\nProcessing log ID {row_id}: {filename}")
        
        # 1. Locate the file on disk
        source_path = find_file_in_roots(filename)
        
        if source_path:
            print(f"  [+] Found file at: {source_path}")
            found_count += 1
            
            # Copy to public/media
            dest_public = os.path.join(TARGET_MEDIA_DIR, filename)
            shutil.copy2(source_path, dest_public)
            print(f"  [+] Copied to: {dest_public}")
            
            # Copy to dist/media if dist directory exists
            if os.path.exists(os.path.dirname(TARGET_DIST_DIR)):
                os.makedirs(TARGET_DIST_DIR, exist_ok=True)
                dest_dist = os.path.join(TARGET_DIST_DIR, filename)
                shutil.copy2(source_path, dest_dist)
                print(f"  [+] Copied to: {dest_dist}")
        else:
            print(f"  [-] WARNING: Could not find file '{filename}' anywhere on system.")
            
        # 2. Update the message in SQLite to point to /media/ instead of /inbox/
        new_message = message.replace(old_ref, new_ref)
        # Also replace VID_PROCESSING: if it was mapped as /inbox/
        new_message = new_message.replace(f"VID_PROCESSING:{old_ref}", f"VID_PROCESSING:{new_ref}")
        
        cur.execute("UPDATE sam_tracker_log SET message = ? WHERE id = ?", (new_message, row_id))
        updated_count += 1
        print(f"  [+] Updated DB log ID {row_id} with new reference.")
        
    conn.commit()
    conn.close()
    
    print("\n==========================================")
    print(f"Media Migration Pipeline finished.")
    print(f"Found and copied: {found_count}/{updated_count} files.")
    print(f"Updated DB entries: {updated_count}")
    print("==========================================")

if __name__ == "__main__":
    main()
