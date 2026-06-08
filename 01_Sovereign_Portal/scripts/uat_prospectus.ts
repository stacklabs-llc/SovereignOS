import { chromium, Page } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT_DIR = '/home/james/sovereign_inbox/today';

async function ensureAuthenticated(page: Page) {
  await page.waitForTimeout(1000);
  if (await page.locator('#auth-username').isVisible().catch(() => false)) {
      console.log('   [Auth] Login screen detected. Injecting Antigravity credentials...');
      await page.fill('#auth-username', 'antigravity');
      await page.fill('#auth-password', 'lfgm2026');
      await page.click('#auth-submit');
      await page.waitForTimeout(3000);
  }
}

async function runUatSweep() {
  console.log('🚀 Initializing Sovereign ATF (Recursive Deep Crawl)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const RUN_DIR = path.join(OUT_DIR, `UAT_Run_${timestamp}`);

  if (!fs.existsSync(RUN_DIR)) {
    fs.mkdirSync(RUN_DIR, { recursive: true });
  }

  const baseUrl = 'https://clio.taila01894.ts.net';
  const appsToTest = [
    { name: 'Prospectus', url: `${baseUrl}/?domain=ROOT&room=prospectus` },
    { name: 'GardenStack', url: `${baseUrl}:3005/` },
    { name: 'FanStack', url: `${baseUrl}:3009/?vip=creator` },
    { name: 'AetherVet', url: `${baseUrl}:3015/` },
    { name: 'SamTracker', url: `${baseUrl}/sam/?role=pilot` }
  ];

  const themesToTest = [
    { value: 'sovereign-home', name: 'Sovereign_Home' },
    { value: 'espn', name: 'ESPN' },
    { value: 'linux', name: 'Linux' },
    { value: 'gardenstack', name: 'GardenStack' },
    { value: 'aethervet', name: 'AetherVet' }
  ];

  console.log('🎨 Initiating Theme Matrix Recursive Deep Crawl...');

  for (const theme of themesToTest) {
    console.log(`\n===========================================`);
    console.log(`   Applying theme: ${theme.name}`);
    console.log(`===========================================`);

    for (const app of appsToTest) {
      console.log(`   [CRAWL] Navigating to ${app.name} -> ${app.url}`);
      try {
        await page.goto(app.url, { waitUntil: 'networkidle', timeout: 30000 });
        await ensureAuthenticated(page);
        
        await page.evaluate((themeValue) => {
          localStorage.setItem('sovereign_theme', themeValue);
          window.dispatchEvent(new Event('theme_changed'));
          document.body.className = `theme-${themeValue}`;
        }, theme.value);

        await page.waitForTimeout(2000);

        const baseFilename = `${theme.name}_${app.name}_00_BASE.png`;
        await page.screenshot({ path: path.join(RUN_DIR, baseFilename), fullPage: true });
        console.log(`   ✅ Captured Base State`);

        const elements = await page.locator('button, a, [role="button"]').all();
        console.log(`   Found ${elements.length} interactive elements. Deep Crawling...`);
        
        let counter = 1;
        for (let i = 0; i < elements.length; i++) {
           const elem = page.locator('button, a, [role="button"]').nth(i);
           if (await elem.isVisible().catch(() => false)) {
              let textContent = await elem.textContent().catch(() => '') || '';
              let cleanName = textContent.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').substring(0, 20);
              if (!cleanName || cleanName === '_') cleanName = `El_${i}`;
              
              await elem.click({ force: true, timeout: 2000 }).catch(() => {});
              await page.waitForTimeout(1000); 
              
              const actionFilename = `${theme.name}_${app.name}_${String(counter).padStart(2, '0')}_${cleanName}.png`;
              await page.screenshot({ path: path.join(RUN_DIR, actionFilename), fullPage: true });
              counter++;

              // Reset state
              if (page.url() !== app.url) {
                  await page.goBack({ waitUntil: 'networkidle' }).catch(async () => {
                      await page.goto(app.url, { waitUntil: 'networkidle' });
                  });
                  await page.waitForTimeout(500);
              } else {
                  await page.keyboard.press('Escape');
                  await page.mouse.click(0, 0).catch(() => {});
                  await page.waitForTimeout(200);
              }
           }
        }
      } catch (e: any) {
        console.log(`   ❌ ERROR crawling ${app.name} with ${theme.name}: ${e.message}`);
      }
    }
  }

  console.log(`\n🎉 Recursive Deep Crawl Complete! All artifacts saved to: ${RUN_DIR}`);
  await browser.close();
}

runUatSweep().catch(console.error);
