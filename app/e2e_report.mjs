import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(err.message));

await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'quanly@hcare.com');
await page.fill('input[type="password"]', 'hcare123');
await page.click('button[type="submit"]');
await page.waitForTimeout(2500);

await page.goto('http://localhost:8080/funds/report', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const body = (await page.textContent('body'))?.replace(/\s+/g, ' ');
console.log('Mặc định chọn nhóm Căn hộ, tổng chi 651.978.974:', body.includes('651.978.974') ? 'OK' : 'FAIL');
console.log('Căn chi nhiều nhất T1 2706 (-184.427.954):', body.includes('184.427.954') ? 'OK' : 'FAIL');
console.log('Có dòng TỔNG CỘNG:', body.includes('TỔNG CỘNG') ? 'OK' : 'FAIL');
console.log('JS errors:', errors.length ? errors : 'none');
await page.screenshot({ path: '/tmp/e2e_report.png' });
await browser.close();
