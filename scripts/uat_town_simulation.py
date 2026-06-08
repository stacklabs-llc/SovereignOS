#!/usr/bin/env python3
import sys
import os
import time
from playwright.sync_api import sync_playwright

def run():
    print("📺 Sending DPMS signal to wake up the HDMI display...")
    os.system("DISPLAY=:0 XAUTHORITY=/home/james/.Xauthority xset dpms force on")
    time.sleep(1)

    print("🚀 Initializing headed Chrome browser on DISPLAY=:0...")
    os.environ["DISPLAY"] = ":0"
    os.environ["XAUTHORITY"] = "/home/james/.Xauthority"

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            slow_mo=150,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--window-size=3840,2160",
                "--window-position=0,0",
                "--kiosk"
            ]
        )
        
        context = browser.new_context(
            viewport={"width": 3840, "height": 2160},
            ignore_https_errors=True
        )
        
        page = context.new_page()
        
        url = "https://localhost:3000/?room=town_simulation"
        print(f"🌍 Navigating to Town Simulation: {url}...")
        page.goto(url)
        page.wait_for_timeout(6000)
        
        # 1. Click "Run Next Tick" button three times to trigger some ticks
        print("⚡ Triggering simulation tick 1...")
        page.click("text=Run Next Tick")
        page.wait_for_timeout(2000)
        
        print("⚡ Triggering simulation tick 2...")
        page.click("text=Run Next Tick")
        page.wait_for_timeout(2000)
        
        print("⚡ Triggering simulation tick 3...")
        page.click("text=Run Next Tick")
        page.wait_for_timeout(2000)
        
        # 2. Type a message as Pilot to trigger reactive replies
        print("✍️ Injecting prompt as Pilot...")
        page.fill('input[placeholder="Inject a prompt or speak as the Pilot (e.g. \'How is AetherVet doing today?\')..."]', "How is AetherVet doing today? Is Dr. Rox online?")
        page.wait_for_timeout(1000)
        
        print("📤 Sending message...")
        page.press('input[placeholder="Inject a prompt or speak as the Pilot (e.g. \'How is AetherVet doing today?\')..."]', "Enter")
        page.wait_for_timeout(4000)  # Wait for reactive reply
        
        # 3. Walk through all the individual Brand Page tabs
        print("🏪 Clicking Gonzo Convenience brand tab...")
        page.click("button:has-text('conve')")
        page.wait_for_timeout(1500)
        
        print("🛠️ Clicking Anvil Twine brand tab...")
        page.click("button:has-text('hardw')")
        page.wait_for_timeout(1500)
        
        print("🩺 Clicking AetherVet brand tab...")
        page.click("button:has-text('vet')")
        page.wait_for_timeout(1500)
        
        print("🌿 Clicking WeedStack brand tab...")
        page.click("button:has-text('vape')")
        page.wait_for_timeout(1500)
        
        print("🌲 Clicking Catnip Wars brand tab...")
        page.click("button:has-text('catni')")
        page.wait_for_timeout(1500)
        
        # Save UAT verification screenshot
        screenshot_path = "/home/james/sovereign_inbox/walkthrough_STRY1780048941_screenshot.png"
        page.screenshot(path=screenshot_path)
        print(f"📸 Screenshot saved to: {screenshot_path}")
        
        # Keep window open for Pilot inspection on screen
        print("👀 Keeping the browser window open on your HDMI TV screen for 20 seconds for inspection...")
        page.wait_for_timeout(20000)
        
        context.close()
        browser.close()
        print("🎉 Headed UAT simulation execution finished successfully!")

if __name__ == "__main__":
    run()
