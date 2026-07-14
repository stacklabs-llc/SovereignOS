import asyncio
import os
import re
import sys
from urllib.parse import urlparse
from playwright.async_api import async_playwright

MD_REPORT_PATH = "/home/james/sovereign_inbox/daily_07042026/Clio_Root_UAT_Crawl_Report.md"
OUT_DIR = "/home/james/SovereignOS/scratch/clio_root_screenshots"

os.makedirs(OUT_DIR, exist_ok=True)

async def ensure_unlocked(page):
    try:
        await page.evaluate("window.localStorage.setItem('sov_auth', 'unlocked');")
        await page.evaluate("window.sessionStorage.setItem('sov_auth', 'unlocked');")
        if await page.locator("#auth-username").is_visible():
            print("🔑 Unlocking authorization interface...")
            await page.fill("#auth-username", "james")
            await page.fill("#auth-password", "!!Stella1977")
            await page.click("#auth-submit")
            await page.wait_for_timeout(2000)
    except Exception as e:
        print(f"⚠️ Auth injection warning: {e}")

async def enable_fundies_grid(page):
    try:
        await page.evaluate("""() => {
            localStorage.setItem('fundiesGrid', 'true');
            document.body.classList.add('fundies-grid-active');
            const toggleBtn = document.getElementById('fundies-grid-toggle-btn');
            if (toggleBtn) {
                const text = toggleBtn.innerText || '';
                if (text.includes('OFF') || !document.body.classList.contains('fundies-grid-active')) {
                    toggleBtn.click();
                }
            }
            const buttons = Array.from(document.querySelectorAll('button'));
            const sportsGridBtn = buttons.find(b => (b.innerText || '').includes('GRID: OFF') || (b.innerText || '').includes('📐 GRID'));
            if (sportsGridBtn) {
                const text = sportsGridBtn.innerText || '';
                if (text.includes('OFF')) {
                    sportsGridBtn.click();
                }
            }
        }""")
        await page.wait_for_timeout(500)
    except Exception as e:
        print(f"⚠️ enable_fundies_grid warning: {e}")

async def main():
    if not os.path.exists(MD_REPORT_PATH):
        print(f"❌ Markdown report not found at {MD_REPORT_PATH}")
        sys.exit(1)

    print(f"📖 Parsing {MD_REPORT_PATH}...")
    with open(MD_REPORT_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the Scanned Topology Summary table
    match = re.search(r"## 🔍 SCANNED TOPOLOGY SUMMARY.*?(?=\n\n|\Z)", content, re.DOTALL)
    if not match:
        print("❌ Could not find Scanned Topology Summary table in markdown report")
        sys.exit(1)

    table_content = match.group(0)
    rows = table_content.strip().split("\n")
    
    # Parse rows: | `url` | `status` | `depth` | [View Capture](../../SovereignOS/scratch/clio_root_screenshots/filename.png) |
    pattern = re.compile(
        r"\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*\[View Capture\]\(\.\./\.\./SovereignOS/scratch/clio_root_screenshots/([^)]+)\)"
    )

    targets = []
    for row in rows:
        m = pattern.search(row)
        if m:
            raw_url, status, depth, filename = m.groups()
            targets.append({
                "raw_url": raw_url,
                "filename": filename
            })

    print(f"📋 Found {len(targets)} screenshot targets to capture.")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-gpu"])
        context = await browser.new_context(ignore_https_errors=True)
        page = await context.new_page()

        # Pre-login on gateway to set session cookies/auth
        print("🔑 Pre-authenticating on base URL...")
        try:
            await page.goto("https://clio.taila01894.ts.net/", wait_until="load", timeout=15000)
            await page.wait_for_timeout(1000)
            await ensure_unlocked(page)
        except Exception as e:
            print(f"⚠️ Pre-auth navigation failed: {e}")

        for idx, target in enumerate(targets, 1):
            raw_url = target["raw_url"]
            filename = target["filename"]
            screenshot_path = os.path.join(OUT_DIR, filename)

            # Skip openapi.json or raw api files since they are just raw text files
            if filename.endswith("openapi.json.png"):
                print(f"[{idx}/{len(targets)}] Skipping openapi.json screenshot (handled separately or not needed)")
                continue

            # Parse out the Tab if present
            tab_name = None
            url = raw_url
            if " [Tab: " in raw_url:
                parts = raw_url.split(" [Tab: ")
                url = parts[0]
                tab_name = parts[1].rstrip("]")

            print(f"[{idx}/{len(targets)}] Capturing: {raw_url} -> {filename}")
            
            try:
                # Add vip=creator query param if appropriate
                nav_url = f"{url}&vip=creator" if "?" in url else f"{url}?vip=creator"
                
                await page.goto(nav_url, wait_until="load", timeout=20000)
                await page.wait_for_timeout(2000)
                await ensure_unlocked(page)

                # Special toggle for port 3010 dormant/interactive switch
                if "3010" in url:
                    try:
                        power_switch = page.locator("button:has-text('DORMANT'), button:has-text('INTERACTIVE')")
                        if await power_switch.count() > 0:
                            print("   ⚡ Toggling Port 3010 Playcall Desk dormant switch...")
                            await power_switch.first.click()
                            await page.wait_for_timeout(1000)
                    except Exception as toggle_err:
                        print(f"   ⚠️ Toggle switch error: {toggle_err}")

                # Tab clicking if needed
                if tab_name:
                    print(f"   🖱️ Clicking tab '{tab_name}'...")
                    regex = re.compile(rf"^\s*{tab_name}\s*$", re.I)
                    tab_btn = page.locator("button").filter(has_text=regex)
                    if await tab_btn.count() == 0:
                        tab_btn = page.locator(f"button:has-text('{tab_name}')")
                        if await tab_btn.count() == 0:
                            tab_btn = page.locator(f"button:has-text('{tab_name.lower()}')")
                            
                    if await tab_btn.count() > 0:
                        await tab_btn.first.click()
                        await page.wait_for_timeout(3000)
                    else:
                        print(f"   ⚠️ Tab button for '{tab_name}' not found.")

                await enable_fundies_grid(page)
                await page.wait_for_timeout(1000)
                
                # Take screenshot
                await page.screenshot(path=screenshot_path, full_page=True)
                print(f"   ✅ Saved: {screenshot_path}")

            except Exception as e:
                print(f"   ❌ Error capturing {raw_url}: {e}")

        await browser.close()
        print("🎉 Captures completed!")

if __name__ == "__main__":
    asyncio.run(main())
