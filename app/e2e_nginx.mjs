import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(err.message));

await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
await page.fill('input[type="email"], input[name="email"]', 'quanly@hcare.com');
await page.fill('input[type="password"], input[name="password"]', 'hcare123');
await page.click('button[type="submit"]');
await page.waitForTimeout(3000);

const body = (await page.textContent('body'))?.replace(/\s+/g, ' ');
console.log('Login qua nginx:', body.includes('Xin chào, Bùi Viết Dũng') ? 'OK' : 'FAIL');
console.log('Dashboard có số liệu thật:', body.includes('Nhân Viên5người') || body.includes('5người') ? 'OK' : 'FAIL');
console.log('JS errors:', errors.length ? errors : 'none');
await browser.close();
