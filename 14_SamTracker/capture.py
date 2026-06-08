from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})
    page.goto('https://clio.taila01894.ts.net:8443/', wait_until='networkidle')
    time.sleep(2)
    page.screenshot(path='/home/james/.gemini/antigravity/brain/5e20fafa-3242-43de-a130-58fd3b448789/samtracker_verified.png')
    browser.close()
