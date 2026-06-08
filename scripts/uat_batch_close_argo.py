#!/usr/bin/env python3
import os
import sys
import time
import subprocess
import requests

# Ensure SovereignOS path is in PYTHONPATH
sys.path.append("/home/james/SovereignOS")

from scripts.mile_in_my_shoes import generate_uat_token

TICKET_ID = "STRY-06032026-BATCHCLOSE"
UAT_SNAPSHOTS_DIR = "/home/james/sovereign_inbox/uat_snapshots"
os.makedirs(UAT_SNAPSHOTS_DIR, exist_ok=True)

def run_uat():
    print("==================================================")
    print("🤖 STARTING AUTOMATED HEADED UAT ON ARGO")
    print("==================================================")

    # 1. Create two temporary tickets for batch close UAT
    print("\n🎫 Creating temporary tickets on SDLC Ticketing Server...")
    try:
        t1_resp = requests.post("http://127.0.0.1:8095/api/tickets", json={
            "ticket_type": "Story",
            "title": "UAT Temporary Batch Close 1",
            "status": "PLANNING",
            "priority": "P3"
        }).json()
        print("⏳ Waiting for timestamp increment...")
        time.sleep(1.2)
        t2_resp = requests.post("http://127.0.0.1:8095/api/tickets", json={
            "ticket_type": "Story",
            "title": "UAT Temporary Batch Close 2",
            "status": "PLANNING",
            "priority": "P3"
        }).json()
        
        t1_id = t1_resp["id"]
        t2_id = t2_resp["id"]
        print(f"✅ Temporary Ticket 1 created: {t1_id}")
        print(f"✅ Temporary Ticket 2 created: {t2_id}")
    except Exception as e:
        print(f"❌ Failed to create temporary tickets: {e}")
        return False

    # 2. Generate UAT authenticated URL
    print("\n🔑 Generating authenticated UAT token and URL...")
    try:
        token = generate_uat_token("james")
        target_url = f"https://clio.taila01894.ts.net/?domain=ROOT&room=kanban&token={token}"
        print(f"🔗 Target URL: {target_url}")
    except Exception as e:
        print(f"❌ Failed to generate UAT token: {e}")
        return False

    # 3. Create Playwright test script that will run on argo
    remote_script_content = f"""import os
import time
from playwright.sync_api import sync_playwright

def run():
    print("📺 Waking up argo display...")
    os.system("DISPLAY=:0 XAUTHORITY=/home/james/.Xauthority xset dpms force on")
    time.sleep(1)

    print("🚀 Initializing headed chromium browser...")
    os.environ["DISPLAY"] = ":0"
    os.environ["XAUTHORITY"] = "/home/james/.Xauthority"

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            slow_mo=300,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--window-size=1920,1080",
                "--window-position=0,0"
            ]
        )
        context = browser.new_context(
            viewport={{"width": 1920, "height": 1080}},
            ignore_https_errors=True
        )
        page = context.new_page()

        print("🌍 Navigating to: {target_url}...")
        page.goto("{target_url}")
        page.wait_for_timeout(6000)

        print("📋 Toggling to List View...")
        page.click("text=List View")
        page.wait_for_timeout(3000)

        # Initial List View screenshot
        print("📸 Taking initial list view screenshot...")
        page.screenshot(path="/tmp/uat_initial_list.png")

        print("☑️ Checking boxes for test tickets {t1_id} and {t2_id}...")
        page.locator("div:has(button:has-text('{t1_id}')) input[type='checkbox']").first.click()
        page.wait_for_timeout(1000)
        page.locator("div:has(button:has-text('{t2_id}')) input[type='checkbox']").first.click()
        page.wait_for_timeout(1000)

        # Selected tickets screenshot
        print("📸 Taking selected tickets screenshot...")
        page.screenshot(path="/tmp/uat_selected_tickets.png")

        print("🔥 Clicking 'Close Selected' button...")
        page.on("dialog", lambda dialog: dialog.accept())
        page.locator("text=Close Selected").click()
        page.wait_for_timeout(4000)

        # Final list screenshot
        print("📸 Taking final list view screenshot...")
        page.screenshot(path="/tmp/uat_final_list.png")

        context.close()
        browser.close()

if __name__ == '__main__':
    run()
"""

    # 4. Write script to local file and copy to argo
    print("\n📁 Copying Playwright script to argo...")
    local_script_path = "/tmp/uat_remote_test.py"
    with open(local_script_path, "w") as f:
        f.write(remote_script_content)
    
    try:
        subprocess.run(f"scp {local_script_path} james@argo:/tmp/uat_remote_test.py", shell=True, check=True)
        print("✅ Script successfully copied to james@argo:/tmp/uat_remote_test.py")
    except Exception as e:
        print(f"❌ Failed to scp script to argo: {e}")
        return False

    # 5. Execute script on argo
    print("\n🚀 Executing headed Playwright UAT on argo DISPLAY=:0...")
    try:
        subprocess.run("ssh james@argo 'DISPLAY=:0 XAUTHORITY=/home/james/.Xauthority python3 /tmp/uat_remote_test.py'", shell=True, check=True)
        print("✅ Headed UAT script executed successfully on argo!")
    except Exception as e:
        print(f"❌ Failed to run script on argo: {e}")
        return False

    # 6. Copy screenshots back to Clio
    print("\n📸 Retrieving UAT screenshots from argo...")
    try:
        subprocess.run(f"scp james@argo:/tmp/uat_initial_list.png {UAT_SNAPSHOTS_DIR}/uat_initial_list.png", shell=True, check=True)
        subprocess.run(f"scp james@argo:/tmp/uat_selected_tickets.png {UAT_SNAPSHOTS_DIR}/uat_selected_tickets.png", shell=True, check=True)
        subprocess.run(f"scp james@argo:/tmp/uat_final_list.png {UAT_SNAPSHOTS_DIR}/uat_final_list.png", shell=True, check=True)
        print(f"✅ Screenshots successfully retrieved to {UAT_SNAPSHOTS_DIR}/")
    except Exception as e:
        print(f"❌ Failed to retrieve screenshots: {e}")
        return False

    # 7. Clean up temporary files on argo and local
    print("\n🧹 Cleaning up temporary files...")
    subprocess.run("ssh james@argo 'rm -f /tmp/uat_remote_test.py /tmp/uat_initial_list.png /tmp/uat_selected_tickets.png /tmp/uat_final_list.png'", shell=True)
    os.remove(local_script_path)
    print("✅ Cleanup complete.")

    # 8. Verify the status of the two temporary tickets is now CLOSED
    print("\n🔍 Verifying ticket state in database...")
    try:
        t1_status = requests.get(f"http://127.0.0.1:8095/api/tickets/{t1_id}").json()
        t2_status = requests.get(f"http://127.0.0.1:8095/api/tickets/{t2_id}").json()
        
        print(f"Ticket {t1_id} status: {t1_status.get('status')}")
        print(f"Ticket {t2_id} status: {t2_status.get('status')}")
        
        if t1_status.get("status") == "CLOSED" and t2_status.get("status") == "CLOSED":
            print("🎉 Batch Close Verification Successful!")
        else:
            print("❌ Verification Failed: Tickets are not closed.")
            return False
    except Exception as e:
        print(f"❌ Verification Failed to fetch status: {e}")
        return False

    # 9. Attach the final screenshot to the main BATCHCLOSE ticket
    print(f"\n📎 Attaching UAT results to ticket {TICKET_ID}...")
    try:
        filepath = f"{UAT_SNAPSHOTS_DIR}/uat_selected_tickets.png"
        with open(filepath, "rb") as f:
            files = {"file": ("uat_selected_tickets.png", f, "image/png")}
            resp = requests.post(f"http://127.0.0.1:8095/api/tickets/{TICKET_ID}/attachments", files=files)
            print(f"✅ Attached selected tickets snapshot: {resp.status_code}")
            
        filepath_final = f"{UAT_SNAPSHOTS_DIR}/uat_final_list.png"
        with open(filepath_final, "rb") as f:
            files = {"file": ("uat_final_list.png", f, "image/png")}
            resp = requests.post(f"http://127.0.0.1:8095/api/tickets/{TICKET_ID}/attachments", files=files)
            print(f"✅ Attached final list snapshot: {resp.status_code}")
    except Exception as e:
        print(f"❌ Failed to attach screenshots to ticket: {e}")

    return True

if __name__ == '__main__':
    run_uat()
