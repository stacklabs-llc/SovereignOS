import asyncio
from playwright.async_api import async_playwright
import os

OUT_DIR = "/home/james/SovereignOS/uat_screenshots"
REPORT_PATH = os.path.join(OUT_DIR, "dom_architecture_report.md")

async def run():
    os.makedirs(OUT_DIR, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Using a high-res viewport
        page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
        
        await page.goto("http://127.0.0.1:3000", wait_until="networkidle")
        
        print("> Accessing Level 4: UHF Studio...")
        # Since button has text "Level 4: UHF Studio"
        await page.click("text=Level 4: UHF Studio")
        await page.wait_for_timeout(2000) # give time to render the roster CMDB API fetch
        
        await page.screenshot(path=os.path.join(OUT_DIR, "uhf_studio.png"), full_page=True)
        print("> Captured uhf_studio.png")
        
        print("> Accessing Level 5: DVR Deck...")
        await page.click("text=Level 5: DVR Deck")
        await page.wait_for_timeout(1000)
        
        await page.screenshot(path=os.path.join(OUT_DIR, "dvr_deck.png"), full_page=True)
        print("> Captured dvr_deck.png")
        
        # Write the DOM Architecture Report
        report = """# Sovereign Oracle DOM State Report (Level 4 & Level 5)

## [Level 4: UHF Studio] -> `RoomConfigurator.tsx`
- **Telemetry Anchor**: 
  - Input: `text` | Binding: `gamePk` state
  - Input: `range` (min:0.5, max:10) | Binding: `playbackSpeed` state
- **The Active Roster**:
  - API Fetch: `GET http://127.0.0.1:8000/api/now/table/cmdb_ci` 
  - Container: Scrollable div with multi-select buttons parsing CMDB result.
- **Boggs Reactivity Baseline**:
  - Input: `range` (1-5) | Binding: `boggsLevel`
- **Cadence Matrix**:
  - Inputs: `button` toggles ['Lurker', 'Balanced', 'Yapper']
- **Ambient Entropy (Injection)**:
  - Input: `textarea` | Binding: `ambientEntropy`
- **Trigger**:
  - Action: "ARM THE ENGINE" button
  - API Call: `POST http://127.0.0.1:5055/api/admin/override` -> Transmits `action: "set_boggs"`, `protocol_string: boggsLevel`, `global_context: ambientEntropy`.

## [Level 5: DVR Deck] -> `DvrRomLoader.tsx`
- **Target Game PK**:
  - Input: `text` | Binding: `gamePk`
- **Playback Speed Multiplier**:
  - Input: `select` dropdown (1.0x, 2.0x, 5.0x, 10.0x) | Binding: `speed`
- **Controls**:
  - Button: "Download Statcast ROM"
    - API Call: `POST http://127.0.0.1:5055/api/admin/download_rom`
  - Button: "Ignite Simulation Mesh"
    - API Call: `POST http://127.0.0.1:5055/api/admin/ignite_sim` -> Executes Python subprocess natively.
"""
        with open(REPORT_PATH, "w") as f:
            f.write(report)
        print(f"> Generated DOM structural mapping at {REPORT_PATH}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
