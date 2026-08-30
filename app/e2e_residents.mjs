import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto('http://localhost:8080/login');
await page.fill('input[type="email"]', 'quanly@hcare.com');
await page.fill('input[type="password"]', 'hcare123');
await page.click('button[type="submit"]');
await page.waitForURL('**/', { timeout: 15000 });

// Vào trang Tạm Trú
await page.goto('http://localhost:8080/residents');
await page.waitForSelector('h1:has-text("Tạm Trú")', { timeout: 10000 });
await page.waitForTimeout(1200);
console.log('Trang Tạm Trú tải: OK');

// Cảnh báo hết hạn có hiện không (2 khách expired)
const warn = await page.locator('text=đã hết hạn tạm trú').count();
console.log('Cảnh báo hết hạn hiện:', warn > 0 ? 'OK' : 'FAIL');

// Tab Đã hết hạn
await page.click('button:has-text("Đã hết hạn")');
await page.waitForTimeout(800);
const cards = await page.locator('div.bg-white.rounded-lg.shadow.p-4').count();
console.log('Số thẻ khách tab Đã hết hạn:', cards);
await page.screenshot({ path: '/tmp/r_list.png' });

// Form thêm mới
await page.goto('http://localhost:8080/residents/new');
await page.waitForSelector('h1:has-text("Thêm Khách Tạm Trú")', { timeout: 10000 });
await page.waitForTimeout(1000);
const aptOptions = await page.locator('select[name="objectId"] option').count();
console.log('Dropdown căn hộ có', aptOptions, 'lựa chọn (cần >30)');
await page.screenshot({ path: '/tmp/r_form.png' });

// Điền và lưu
await page.selectOption('select[name="objectId"]', { index: 2 });
await page.fill('input[name="fullName"]', 'E2E TEST KIM');
await page.fill('input[name="nationality"]', 'KR');
await page.fill('input[name="residenceStart"]', '2026-08-15');
await page.fill('input[name="residenceExpiry"]', '2026-09-10');
await page.click('button[type="submit"]');
await page.waitForURL('**/residents', { timeout: 10000 });
await page.waitForTimeout(1200);
const found = await page.locator('text=E2E TEST KIM').count();
console.log('Thêm khách thành công:', found > 0 ? 'OK' : 'FAIL');
await page.screenshot({ path: '/tmp/r_after_add.png' });

// Không tràn ngang
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
console.log('Không tràn ngang:', overflow ? 'FAIL' : 'OK');
console.log('JS errors:', errors.length ? errors.join(' | ') : 'none');
await browser.close();
