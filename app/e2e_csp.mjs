import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
const cspErrors = [];
page.on('console', (m) => { if (m.text().includes('Content Security Policy')) cspErrors.push(m.text().slice(0,150)); });

await page.goto('http://localhost:3100/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'quanly@hcare.com');
await page.fill('input[type="password"]', 'hcare123');
await page.click('button[type="submit"]');
await page.waitForTimeout(2500);

// Trang projects có progress bar dùng style width inline
await page.goto('http://localhost:3100/projects', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
const bars = await page.$$eval('div[style]', (els) =>
  els.map((e) => ({ style: e.getAttribute('style'), computed: getComputedStyle(e).width }))
    .filter((x) => x.style?.includes('width'))
);
console.log('Số phần tử inline width:', bars.length);
if (bars.length) console.log('Mẫu:', bars[0].style, '→ computed:', bars[0].computed);

// Báo cáo lãi/lỗ có thanh tỷ lệ
await page.goto('http://localhost:3100/funds/report', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const reportBars = await page.$$eval('div[style*="width"]', (els) => els.length);
console.log('Thanh tỷ lệ trang báo cáo:', reportBars);
console.log('CSP violations:', cspErrors.length ? cspErrors : 'KHÔNG CÓ');
await browser.close();
