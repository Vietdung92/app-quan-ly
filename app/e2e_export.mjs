import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
await page.goto('http://localhost:8080/login');
await page.fill('input[type="email"]', 'quanly@hcare.com');
await page.fill('input[type="password"]', 'hcare123');
await page.click('button[type="submit"]');
await page.waitForURL('**/', { timeout: 15000 });
await page.goto('http://localhost:8080/funds');
await page.waitForSelector('button:has-text("Xuất Excel")', { timeout: 10000 });
await page.waitForTimeout(2000);
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 10000 }),
  page.click('button:has-text("Xuất Excel")'),
]);
const path = await download.path();
console.log('File tải về:', download.suggestedFilename());
const fs = await import('fs');
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\r\n');
console.log('Số dòng (gồm header):', lines.length);
console.log('Header:', lines[0]);
console.log('Dòng đầu:', lines[1]);
console.log('BOM đúng:', content.charCodeAt(0) === 0xFEFF ? 'OK' : 'FAIL');
await browser.close();
