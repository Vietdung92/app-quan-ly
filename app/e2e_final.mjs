import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(err.message));

await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"], input[name="email"]', 'quanly@hcare.com');
await page.fill('input[type="password"], input[name="password"]', 'hcare123');
await page.click('button[type="submit"]');
await page.waitForTimeout(3500);

const bodyText = (await page.textContent('body'))?.replace(/\s+/g, ' ');
console.log('Có biểu đồ trạng thái dự án:', bodyText.includes('Đang thực hiện:') || !bodyText.includes('Trạng Thái Dự ÁnChưa có dữ liệu'));
console.log('Xu hướng chi phí có data:', !bodyText.match(/Xu Hướng Chi Phí\s*Chưa có dữ liệu/));
console.log('PAGE ERRORS:', errors.length ? errors : 'none');
await page.screenshot({ path: '/tmp/e2e_dashboard_charts.png', fullPage: false });
await browser.close();
