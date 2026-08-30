import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto('http://localhost:8080/login');
await page.waitForTimeout(2500);
const manifest = await page.locator('link[rel="manifest"]').getAttribute('href');
console.log('Manifest link:', manifest);
const swReg = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return 'not supported';
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? 'registered (' + (reg.active ? 'active' : 'installing') + ')' : 'NOT registered';
});
console.log('Service worker:', swReg);
const title = await page.title();
console.log('Title:', title);
await browser.close();
