#!/home/james/SovereignOS/.venv/bin/python3
import asyncio
import os
import sys
import re
from urllib.parse import urljoin, urlparse
from playwright.async_api import async_playwright

# Configuration Constants
BASE_URL = "https://clio.taila01894.ts.net/"
MAX_DEPTH = 3
OUT_DIR = "/home/james/sovereign_inbox/today/clio_root_screenshots"
REPORT_PATH = "/home/james/sovereign_inbox/today/Clio_Root_UAT_Crawl_Report.md"

os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)

visited_urls = set()
broken_links = []
scanned_pages = []
lexicon_violations = []

async def crawl(page, url, depth):
    if depth > MAX_DEPTH or url in visited_urls:
        return
    
    parsed_base = urlparse(BASE_URL)
    parsed_url = urlparse(url)
    
    # Restrict crawling strictly to our secure tailnet domain (allow different ports on same hostname)
    if parsed_url.hostname != parsed_base.hostname:
        return
    visited_urls.add(url)
    print(f"[Depth {depth}] Scanning: {url}")
    
    try:
        response = await page.goto(url, wait_until="load", timeout=15000)
        status = response.status if response else "Unknown Status"
        
        # Check if the page loaded successfully or returned an error block
        if not response or response.status >= 400:
            print(f"❌ BROKEN LINK ENCOUNTERED: {url} (Status: {status})")
            broken_links.append((url, status, depth))
            return
            
        await page.wait_for_timeout(2000)
        
        # Clean the URL to use as a valid filename
        safe_filename = url.replace("https://", "").replace("http://", "").replace("/", "_").replace(":", "_").replace("?", "_") + ".png"
        screenshot_path = os.path.join(OUT_DIR, safe_filename)
        await page.screenshot(path=screenshot_path, full_page=True)
        
        scanned_pages.append({
            "url": url,
            "status": status,
            "depth": depth,
            "screenshot": screenshot_path
        })
        
        # Retrieve visible inner text to check for Lexicon V2.0 compliance
        visible_text = await page.evaluate("() => document.body ? document.body.innerText : ''")
        matches = re.findall(r'(?i)sausage\s+maker', visible_text)
        if matches:
            print(f"⚠️ LEXICON VIOLATION on {url}: Found {len(matches)} occurrences of 'Sausage Maker'")
            lexicon_violations.append((url, len(matches), depth))
        
        # Extract links on current page to continue the crawl
        links = await page.evaluate("""() => {
            return Array.from(document.querySelectorAll('a')).map(anchor => anchor.href);
        }""")
        
        # Automatically inject key views/external stacks if we are scanning the root gateway
        parsed_url_clean = url.split('?')[0].split('#')[0]
        if parsed_url_clean == "https://clio.taila01894.ts.net/":
            extra_urls = [
                "https://clio.taila01894.ts.net/?room=kanban",
                "https://clio.taila01894.ts.net/?room=system_config",
                "https://clio.taila01894.ts.net/?room=stack_seeder",
                "https://clio.taila01894.ts.net/?room=app_directory",
                "https://clio.taila01894.ts.net/?room=persona_center",
                "https://clio.taila01894.ts.net/?room=argus_nexus",
                "https://clio.taila01894.ts.net:3009/", # FanStack
                "https://clio.taila01894.ts.net:3015/", # AetherVet
                "https://clio.taila01894.ts.net:3004/"  # SamTracker
            ]
            links.extend(extra_urls)
        
        for link in links:
            absolute_link = urljoin(url, link)
            await crawl(page, absolute_link, depth + 1)
            
    except Exception as e:
        print(f"❌ CONNECTION FAILURE ON: {url} (Error: {e})")
        broken_links.append((url, f"Exception: {e}", depth))

async def main():
    print("🚀 INITIATING Headless Playwright UAT Audit on Clio...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--ignore-certificate-errors', '--disable-gpu'])
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            ignore_https_errors=True
        )
        # Seed local session authentication state
        await context.add_init_script("window.localStorage.setItem('sov_auth', 'unlocked');")
        page = await context.new_page()
        
        await crawl(page, BASE_URL, 0)
        await browser.close()
        
    # Compile Markdown Report
    print("✍️ Generating UAT Markdown Report...")
    report = f"# 📊 CLIO ROOT GATEWAY UAT SCAN REPORT\n\n"
    report += f"**Base Target URL**: `{BASE_URL}`  \n"
    report += f"**Scanned Depth Limit**: `{MAX_DEPTH}`  \n\n"
    
    report += "## ❌ DEPRECATED CONVICTIONS & BROKEN REDIRECTS\n"
    if broken_links:
        report += "| URL Target | Failure Reason / Status | Depth | Action Required |\n"
        report += "| :--- | :--- | :--- | :--- |\n"
        for url, reason, dep in broken_links:
            action = "Fix Port Mapping" if "Exception" in str(reason) else "Resolve Route"
            report += f"| `{url}` | `{reason}` | `{dep}` | {action} |\n"
    else:
        report += "*No broken redirect blocks detected across verified depths.*\n"
    report += "\n"
    
    report += "## ⚠️ LEXICON VIOLATIONS (Sausage Maker vs Stack Seeder)\n"
    if lexicon_violations:
        report += "| URL Target | Violations Count | Depth | Action Required |\n"
        report += "| :--- | :--- | :--- | :--- |\n"
        for url, count, dep in lexicon_violations:
            report += f"| `{url}` | `{count}` | `{dep}` | Remove legacy/joke 'Sausage Maker' nomenclature and restore 'Stack Seeder' |\n"
    else:
        report += "*No legacy/joke 'Sausage Maker' references detected. Nomenclature matches approved Lexicon V2.0.*\n"
    report += "\n"
    
    report += "## 🔍 SCANNED TOPOLOGY SUMMARY\n"
    report += "| URL Path | Status | Depth | Screenshot |\n"
    report += "| :--- | :--- | :--- | :--- |\n"
    for page_data in scanned_pages:
        rel_path = page_data['screenshot'].replace("/home/james/sovereign_inbox/today/", "")
        report += f"| `{page_data['url']}` | `{page_data['status']}` | `{page_data['depth']}` | [View Capture]({rel_path}) |\n"
        
    with open(REPORT_PATH, "w") as f:
        f.write(report)
    print(f"✅ Success: Report compiled at {REPORT_PATH}")

if __name__ == "__main__":
    asyncio.run(main())
