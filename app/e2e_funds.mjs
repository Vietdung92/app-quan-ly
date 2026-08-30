import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(err.message));

await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"], input[name="email"]', 'quanly@hcare.com');
await page.fill('input[type="password"], input[name="password"]', 'hcare123');
await page.click('button[type="submit"]');
await page.waitForTimeout(2500);

// Vào trang Thu Chi Quỹ
await page.goto('http://localhost:8080/funds', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const body = (await page.textContent('body'))?.replace(/\s+/g, ' ');
console.log('Tổng Thu 1.440.900.000:', body.includes('1.440.900.000') ? 'OK' : 'FAIL');
console.log('Số Dư 158.567.262:', body.includes('158.567.262') ? 'OK' : 'FAIL');
console.log('Có dữ liệu căn hộ (The Sóng):', body.includes('The Sóng') ? 'OK' : 'FAIL');
console.log('Breakdown nhóm (QLCH - Căn hộ):', body.includes('QLCH - Căn hộ') ? 'OK' : 'FAIL');
await page.screenshot({ path: '/tmp/e2e_funds.png' });

// Test form thêm giao dịch
await page.goto('http://localhost:8080/funds/new', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const formBody = (await page.textContent('body'))?.replace(/\s+/g, ' ');
console.log('Form có nhóm dropdown:', formBody.includes('Nhóm') ? 'OK' : 'FAIL');
console.log('JS errors:', errors.length ? errors : 'none');
await browser.close();
