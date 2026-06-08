import os
import time
import sqlite3
from playwright.sync_api import sync_playwright

SORA_ARCHIVE = "/home/james/SovereignOS/dna/media/hailo_dropzone/sora_archive"
LEDGER_DB = "/home/james/SovereignOS/dna/media/hailo_dropzone/sora_ledger.db"

def init_db():
    os.makedirs(SORA_ARCHIVE, exist_ok=True)
    conn = sqlite3.connect(LEDGER_DB)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sora_payloads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_name TEXT,
            prompt TEXT,
            local_path TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def execute_stacklift():
    init_db()
    with sync_playwright() as p:
        # We run headed so the Pilot can manually traverse and authenticate
        browser = p.chromium.launch(headless=False, args=['--disable-blink-features=AutomationControlled'])
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        
        print("====== THE PILOT GATE: INITIATED ======")
        print("1. Please log in to OpenAI / Sora manually when the browser opens.")
        print("2. Navigate to the page containing your EON 0 / EON 1 videos.")
        print("3. Return to this terminal and press ENTER to commence payload scraping.")
        
        page.goto("https://sora.com")
        
        input("Press ENTER when authenticated and ready on the video page...")
        
        print("Commencing Sora Stacklift extraction sequence...")
        
        # Depending on Sora UI changes, the Pilot may need to adjust these selectors.
        # This assumes videos can be directly downloaded or interacted with.
        video_elements = page.locator("video").element_handles()
        
        if not video_elements:
            print("No <video> elements found. You may need to inspect the DOM to map the correct selectors.")
            
        conn = sqlite3.connect(LEDGER_DB)
        cursor = conn.cursor()
            
        for i, video in enumerate(video_elements):
            try:
                src_url = video.get_attribute("src")
                if not src_url:
                    print(f"Skipping video {i} due to missing src attribute.")
                    continue
                
                # Fetching the prompt context typically requires reading sibling tags
                prompt_text = "EON Lore Prompt Backup"
                
                # We expect the download. We advise clicking the respective download button manually or targeting its CSS
                print(f"Intercepting download for video {i} via JS...")
                local_path = os.path.join(SORA_ARCHIVE, f"eon_lore_{i}.mp4")
                
                # We inject JS to download the video src explicitly
                with page.expect_download() as download_info:
                    video.evaluate("""(node) => {
                        const a = document.createElement('a');
                        a.href = node.src;
                        a.download = 'video.mp4';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }""")
                    
                download = download_info.value
                download.save_as(local_path)
                
                cursor.execute('INSERT INTO sora_payloads (video_name, prompt, local_path) VALUES (?, ?, ?)',
                               (f"eon_lore_{i}.mp4", prompt_text, local_path))
                conn.commit()
                print(f"Anchored: eon_lore_{i}.mp4")
            except Exception as e:
                print(f"Error scraping element {i}: {e}")
                
        conn.close()
        browser.close()
        print("Sora Stacklift Completed. Local artifacts and DB entries preserved.")

if __name__ == "__main__":
    execute_stacklift()
