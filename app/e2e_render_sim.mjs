import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto('http://localhost:3100/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'quanly@hcare.com');
await page.fill('input[type="password"]', 'hcare123');
await page.click('button[type="submit"]');
await page.waitForTimeout(3000);
const body = (await page.textContent('body'))?.replace(/\s+/g, ' ');
console.log('Login + dashboard:', body.includes('Xin chào, Bùi Viết Dũng') ? 'OK' : 'FAIL');

await page.goto('http://localhost:3100/funds', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
const funds = (await page.textContent('body'))?.replace(/\s+/g, ' ');
console.log('Thu Chi Quỹ 174 GD:', funds.includes('1.440.900.000') ? 'OK' : 'FAIL');
// Kiểm tra progress bar/style inline có render (CSP check)
const hasInlineStyleWidth = await page.$$eval('[style*="width"]', (els) => els.length);
console.log('Inline styles render (CSP OK):', hasInlineStyleWidth > 0 ? 'OK' : 'FAIL');
console.log('Console errors:', errors.length ? errors.slice(0,3) : 'none');
await browser.close();
