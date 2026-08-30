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

await page.goto('http://localhost:8080/taxes');
await page.waitForSelector('h1:has-text("Thuế Hộ Chủ Nhà")', { timeout: 10000 });
await page.waitForTimeout(1500);
console.log('Trang Thuế tải: OK');

const cards = await page.locator('div.bg-white.rounded-lg.shadow').count();
console.log('Số thẻ hồ sơ (cần >=11):', cards);

// Mở checklist Sadora (thẻ thứ 2)
await page.click('text=Sadora_C1104');
await page.waitForTimeout(1200);
const chips = await page.locator('button:has-text("T9/2026")').count();
console.log('Checklist tháng hiện:', chips > 0 ? 'OK' : 'FAIL');
await page.screenshot({ path: '/tmp/t_checklist.png' });

// Đóng thuế T9/2026 (pending)
await page.click('button:has-text("T9/2026")');
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/t_modal.png' });
await page.click('button:has-text("Đã Đóng Thuế")');
await page.waitForTimeout(1500);
const paid = await page.locator('button:has-text("T9/2026"):has-text("✓")').count();
console.log('Đánh dấu đóng T9/2026:', paid > 0 ? 'OK' : 'FAIL');

// Hoàn tác (QL): mở lại chip đã đóng
page.on('dialog', (d) => d.accept());
await page.click('button:has-text("T9/2026")');
await page.waitForTimeout(600);
await page.click('button:has-text("Hoàn Tác")');
await page.waitForTimeout(1500);
const reverted = await page.locator('button:has-text("T9/2026"):has-text("✓")').count();
console.log('Hoàn tác:', reverted === 0 ? 'OK' : 'FAIL');
await page.screenshot({ path: '/tmp/t_final.png' });

const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
console.log('Không tràn ngang:', overflow ? 'FAIL' : 'OK');
console.log('JS errors:', errors.length ? errors.join(' | ') : 'none');
await browser.close();
