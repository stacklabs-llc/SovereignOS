#!/usr/bin/env python3
import sys
import os
import time
import subprocess
from playwright.sync_api import sync_playwright

# TV Projection Sandboxes on the Tailscale Mesh
TV_NODES = ["100.88.5.122", "100.104.239.107"]  # Hobbes and metsy-prime
PROJECTION_URL = "https://clio.taila01894.ts.net:3016/?view=tv_projection"

def cast_to_mesh_tvs():
    """Projects the TV Projection Dashboard view to all target sandboxes."""
    for tv_ip in TV_NODES:
        print(f"📺 Projecting TV view to sandbox node {tv_ip}...")
        
        # 1. HTTP Cast (FastAPI ADB endpoint for Android-based kiosks)
        try:
            import urllib.request
            import json
            url = f"http://127.0.0.1:8090/api/cast_tv/{tv_ip}"
            data = json.dumps({"url": PROJECTION_URL}).encode("utf-8")
            req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req, timeout=3) as res:
                print(f"  [+] ADB Cast response: {res.read().decode('utf-8')}")
        except Exception as e:
            print(f"  [-] ADB Cast to {tv_ip} skipped/failed: {e}")
            
        # 2. SSH Cast (Direct Framebuffer/Display Takeover for Linux nodes)
        try:
            ssh_cmd = (
                f"ssh -o ConnectTimeout=2 -o StrictHostKeyChecking=no -o BatchMode=yes james@{tv_ip} "
                f"\"export DISPLAY=:0 && (killall chromium-browser || killall chromium || true) && "
                f"nohup chromium --no-sandbox --kiosk '{PROJECTION_URL}' > /dev/null 2>&1 &\""
            )
            subprocess.Popen(ssh_cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(f"  [+] SSH Takeover signal triggered successfully for {tv_ip}.")
        except Exception as e:
            print(f"  [-] SSH Takeover to {tv_ip} failed: {e}")

def run():
    # Detect headless requirement or missing display (e.g., SSH environments)
    headless_mode = os.environ.get("PLAYWRIGHT_HEADLESS") == "true" or not os.environ.get("DISPLAY")
    
    # Target screenshot path for TV projection loop
    screenshot_path = "/home/james/sovereign_inbox/today/UAT_Verification_Headed_Result.png"
    os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)

    if headless_mode:
        print("🛡️ Artemis Shield Active: Dropping X11 display pointer. Running Playwright strictly HEADLESS.")
    else:
        print("📺 Waking up HDMI TV display via DPMS...")
        os.system("DISPLAY=:0 XAUTHORITY=/home/james/.Xauthority xset dpms force on")
        time.sleep(1)
        os.environ["DISPLAY"] = ":0"
        os.environ["XAUTHORITY"] = "/home/james/.Xauthority"

    # Pre-cast the UAT dashboard view to the TV mesh nodes
    cast_to_mesh_tvs()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=headless_mode,
            slow_mo=200,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--window-size=1920,1080" if headless_mode else "--window-size=3840,2160",
                "--window-position=0,0",
                "--kiosk"
            ] if not headless_mode else [
                "--ignore-certificate-errors",
                "--disable-gpu"
            ]
        )
        
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080} if headless_mode else {"width": 3840, "height": 2160},
            ignore_https_errors=True
        )
        
        # Localhost session bypass state
        context.add_init_script("window.localStorage.setItem('sov_auth', 'unlocked');")
        
        page = context.new_page()
        url = "https://localhost:3016/?room=stack_seeder"
        print(f"🌍 Navigating to local endpoint: {url}...")
        page.goto(url, wait_until="domcontentloaded")
        page.wait_for_timeout(5000)
        page.screenshot(path=screenshot_path)  # Capture initial load

        # 1. Type Brand Label Name
        print("✍️ Typing Brand Label name...")
        page.fill('input[placeholder="e.g. James\'s Bistro, WeedStack, AetherVet"]', "BistroStack_Beta")
        page.wait_for_timeout(1000)
        page.screenshot(path=screenshot_path)  # Project frame

        # 2. Type Thematic Bar Question Narrative
        print("✍️ Typing thematic Bar Question Narrative...")
        page.fill(
            'textarea[placeholder="If your brand walked into a bar — who would it be, what would it order, what would it play on the jukebox?"]',
            "An industrial cocktail lounge housed inside a converted, near-black 1920s steel foundry. It serves single-source mezcal on cold stones and dark espresso. There is an absolute ban on bright screens. A vintage vinyl jukebox plays slow jazz and retro industrial bass in the corner. The patrons are intense, zero-compromise engineers, distillers, and loose compliance watchdogs talking trades behind charcoal desks."
        )
        page.wait_for_timeout(1500)
        page.screenshot(path=screenshot_path)  # Project frame

        # Walk through the cockpit tabs for visual TV validation
        print("👥 Navigating to Advocates & Lore tab...")
        page.click("text=👥 Advocates & Lore")
        page.wait_for_timeout(1500)
        page.screenshot(path=screenshot_path)  # Project frame

        print("🎨 Navigating to Aesthetic Engine tab...")
        page.click("text=🎨 Aesthetic Engine")
        page.wait_for_timeout(1500)
        page.screenshot(path=screenshot_path)  # Project frame

        print("⚙️ Navigating to Ingestion Pipeline tab...")
        page.click("text=⚙️ Ingestion Pipeline")
        page.wait_for_timeout(1500)
        page.screenshot(path=screenshot_path)  # Project frame
        
        # 3. Check the premium avatar generator checkbox
        print("⚡ Toggling the premium 4K Imagen avatar generator checkbox...")
        checkbox = page.locator('input[type="checkbox"]')
        if not checkbox.is_checked():
            page.click("text=⚡ Procedurally Forge 4K Character Avatars via Imagen Ingestion Loop")
        page.wait_for_timeout(1500)
        page.screenshot(path=screenshot_path)  # Project frame
        
        # 4. Click Execute Ingestion Sequence
        print("🔥 Executing ingestion sequence button...")
        page.click("text=Execute Ingestion Sequence")
        page.wait_for_timeout(3000)
        page.screenshot(path=screenshot_path)  # Project frame
        
        # 5. Observe terminal logs roll
        print("⏳ Monitoring Genesis Ingestion Terminal (waiting 15 seconds)...")
        for _ in range(3):
            page.wait_for_timeout(5000)
            page.screenshot(path=screenshot_path)  # Project frame progress
        
        print(f"🎉 Headed UAT execution finished. Final screenshot projected: {screenshot_path}")
        
        context.close()
        browser.close()

if __name__ == "__main__":
    run()
