import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

// 1. Khách đăng nhập portal
await page.goto('http://localhost:8080/portal/login');
await page.waitForSelector('text=Hcare Resident Portal', { timeout: 10000 });
await page.fill('input[type="text"]', 'test-tenant@example.com');
await page.fill('input[type="password"]', 'test123');
await page.click('button[type="submit"]');
await page.waitForURL('**/portal', { timeout: 10000 });
await page.waitForTimeout(1500);
console.log('Đăng nhập portal: OK');
console.log('Hiện tên căn:', await page.locator('text=Apt B-34.09').count() > 0 ? 'OK' : 'FAIL');
console.log('Banner nhắc tiền thuê:', await page.locator('text=Rent for').count() > 0 ? 'OK' : 'FAIL');
console.log('Cảnh báo tạm trú:', await page.locator('text=Residence registration').count() > 0 ? 'OK' : 'FAIL');
console.log('Căn trống remarketing:', await page.locator('text=Other Apartments').count() > 0 ? 'OK' : 'FAIL');
await page.screenshot({ path: '/tmp/p_home.png', fullPage: true });

// 2. Gửi báo hỏng mới
await page.click('button:has-text("New Request")');
await page.selectOption('select', 'water');
await page.fill('textarea', 'Kitchen sink is blocked, water drains very slowly');
await page.click('button:has-text("Send Request")');
await page.waitForTimeout(1500);
console.log('Gửi báo hỏng:', await page.locator('text=has been sent').count() > 0 ? 'OK' : 'FAIL');
await page.screenshot({ path: '/tmp/p_repair.png' });

// 3. Nhân viên thấy trong trang Báo Hỏng
const staff = await ctx.newPage();
await staff.goto('http://localhost:8080/login');
await staff.fill('input[type="email"]', 'quanly@hcare.com');
await staff.fill('input[type="password"]', 'hcare123');
await staff.click('button[type="submit"]');
await staff.waitForURL('**/', { timeout: 15000 });
await staff.goto('http://localhost:8080/repairs');
await staff.waitForTimeout(1500);
console.log('Nội bộ thấy yêu cầu mới:', await staff.locator('text=Kitchen sink').count() > 0 ? 'OK' : 'FAIL');
await staff.click('button:has-text("Tài khoản khách")');
await staff.waitForTimeout(1000);
console.log('Tab tài khoản khách:', await staff.locator('text=test-tenant@example.com').count() > 0 ? 'OK' : 'FAIL');
await staff.screenshot({ path: '/tmp/p_staff.png' });

const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
console.log('Portal không tràn ngang:', overflow ? 'FAIL' : 'OK');
console.log('JS errors:', errors.length ? errors.join(' | ') : 'none');
await browser.close();
