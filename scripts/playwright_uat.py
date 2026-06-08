from playwright.sync_api import sync_playwright
import time
import os

def run_uat():
    # Make sure output directory exists
    output_dir = "/home/james/SovereignOS/uat_screenshots/"
    os.makedirs(output_dir, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # High resolution
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        
        print("=> Navigating to Main Command Center (Port 3000)...")
        page.goto("http://clio.taila01894.ts.net:3000/")
        
        # In case there's an access code
        # Wait a bit for React to hydrate
        time.sleep(4)
        
        # Check for access code prompt
        if page.locator("text=SOV2026").count() > 0 or "access code" in page.content().lower():
            try:
                page.fill("input[type='password']", "SOV2026")
                page.keyboard.press("Enter")
                time.sleep(2)
            except:
                pass
                
        # Wait for hydration
        time.sleep(5)
        page.screenshot(path=os.path.join(output_dir, "command_center_uat.png"), full_page=True)
        print("=> Captured Main Command Center.")

        print("=> Navigating to Persona Console...")
        # Typically the persona console is a tab or route. Let's force the route by clicking the Persona Console button.
        # Alternatively, we can just navigate to the explicit URL if it has one? Actually it's probably standard router. 
        # Click the node that says "Persona Console" or has a bot logo.
        try:
           # Assuming the tab uses text "Persona Console" or "Persona Matrix"
           page.locator("button:has-text('Persona Console'), a:has-text('Persona Console'), div:has-text('Persona Console')").first.click(timeout=3000)
        except Exception as e:
           print("Could not find Persona Console button. Trying URL direct or fallback:", e)
        
        time.sleep(5)
        # Click the edit modal to verify it works
        try:
           # Double click or single click card
           page.locator("text=gemini-flash").first.click(timeout=2000)
           time.sleep(2)
        except:
           pass
           
        page.screenshot(path=os.path.join(output_dir, "persona_console_uat.png"), full_page=True)
        print("=> Captured Persona Console.")
        
        browser.close()

if __name__ == "__main__":
    run_uat()
