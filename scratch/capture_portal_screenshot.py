#!/usr/bin/env python3
import asyncio
import os
import sys
from playwright.async_api import async_playwright

async def main():
    print("[*] Starting headless Playwright screenshot capture...")
    screenshot_dir = "/home/james/sovereign_inbox/dashboards"
    os.makedirs(screenshot_dir, exist_ok=True)
    screenshot_path = os.path.join(screenshot_dir, "portal_landing_page_STRY1779918575.png")

    async with async_playwright() as p:
        # Launch browser strictly headlessly, bypassing user display entirely
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox"]
        )
        
        # ignore_https_errors=True completely bypasses HSTS self-signed cert locks
        context = await browser.new_context(
            ignore_https_errors=True,
            viewport={"width": 1280, "height": 800}
        )
        
        page = await context.new_page()
        
        url = "https://clio.taila01894.ts.net/"
        print(f"[*] Navigating to: {url}")
        
        try:
            # Navigate with a generous 10s timeout
            await page.goto(url, wait_until="networkidle", timeout=15000)
            print("[+] Page loaded successfully!")
        except Exception as e:
            print(f"[!] Warning during navigation: {e}")
            # Try to proceed even if networkidle timed out
        
        # Wait an extra 3 seconds for dynamic components and animations to settle
        await page.wait_for_timeout(3000)
        
        # Capture a premium full-page screenshot
        print(f"[*] Capturing screenshot to: {screenshot_path}")
        await page.screenshot(path=screenshot_path, full_page=True)
        print("[+] Screenshot capture completed!")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
