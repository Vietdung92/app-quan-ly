import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(err.message));

// 1. Mở app → redirect login
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

// 2. Điền form đăng nhập
await page.fill('input[type="email"], input[name="email"]', 'quanly@hcare.com');
await page.fill('input[type="password"], input[name="password"]', 'hcare123');
await page.click('button[type="submit"]');
await page.waitForTimeout(3000);

const url = page.url();
const bodyText = (await page.textContent('body'))?.replace(/\s+/g, ' ').slice(0, 400);
console.log('URL sau login:', url);
console.log('BODY:', JSON.stringify(bodyText));
console.log('PAGE ERRORS:', errors.length ? errors : 'none');
await page.screenshot({ path: '/tmp/e2e_dashboard.png' });

// 3. Vào trang nhân viên (data thật từ DB)
await page.goto('http://localhost:5173/employees', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
const empText = (await page.textContent('body'))?.replace(/\s+/g, ' ');
console.log('EMPLOYEES chứa "Bùi Viết Dũng":', empText.includes('Bùi Viết Dũng'));
console.log('EMPLOYEES chứa "Lê Văn Cường":', empText.includes('Lê Văn Cường'));
await page.screenshot({ path: '/tmp/e2e_employees.png' });

await browser.close();
