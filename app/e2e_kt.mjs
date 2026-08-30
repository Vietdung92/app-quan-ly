import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

// KT đăng nhập
await page.goto('http://localhost:8080/login');
await page.fill('input[type="email"]', 'kt1@hcare.com');
await page.fill('input[type="password"]', 'hcare123');
await page.click('button[type="submit"]');
await page.waitForURL('**/', { timeout: 15000 });
await page.waitForTimeout(2000);

console.log('Dashboard cá nhân KT:', await page.locator('text=Chấm Công Hôm Nay').count() > 0 ? 'OK' : 'FAIL');
console.log('Nút chấm công vào:', await page.locator('button:has-text("Chấm Công Vào")').count() > 0 ? 'OK (chưa chấm)' : 'đã chấm rồi');
console.log('Card việc chưa xong:', await page.locator('text=Việc chưa xong').count() > 0 ? 'OK' : 'FAIL');
console.log('Card chi phí:', await page.locator('text=Chi phí tháng này').count() > 0 ? 'OK' : 'FAIL');
await page.screenshot({ path: '/tmp/kt_dash.png', fullPage: true });

// Chấm công
const btnIn = page.locator('button:has-text("Chấm Công Vào")');
if (await btnIn.count() > 0) {
  await btnIn.click();
  await page.waitForTimeout(1500);
  console.log('Chấm công vào:', await page.locator('button:has-text("Chấm Công Ra")').count() > 0 ? 'OK' : 'FAIL');
}

// Mở sidebar kiểm tra menu ẩn
await page.click('header button');
await page.waitForTimeout(800);
const fundsMenu = await page.locator('aside >> text=Thu Chi Quỹ').count();
const aptMenu = await page.locator('aside >> text=Căn Hộ').count();
const resMenu = await page.locator('aside >> text=Tạm Trú').count();
console.log('Menu ẩn với KT (Quỹ/Căn Hộ/Tạm Trú):', fundsMenu + aptMenu + resMenu === 0 ? 'OK' : `FAIL (${fundsMenu},${aptMenu},${resMenu})`);
await page.screenshot({ path: '/tmp/kt_menu.png' });
await page.keyboard.press('Escape');

// Bottom nav của KT
const bnChiPhi = await page.locator('nav.fixed.bottom-0 >> text=Chi Phí').count();
const bnThuChi = await page.locator('nav.fixed.bottom-0 >> text=Thu Chi').count();
console.log('Bottom nav KT (có Chi Phí, không Thu Chi):', bnChiPhi > 0 && bnThuChi === 0 ? 'OK' : 'FAIL');

// KT tạo việc
await page.goto('http://localhost:8080/tasks/new');
await page.waitForTimeout(1500);
console.log('Form tự gán:', await page.locator('text=gán cho chính bạn').count() > 0 ? 'OK' : 'FAIL');

// Trang chi tiết việc có mục ảnh
await page.goto('http://localhost:8080/tasks/6');
await page.waitForTimeout(1500);
console.log('Mục Ảnh Báo Cáo:', await page.locator('text=Ảnh Báo Cáo').count() > 0 ? 'OK' : 'FAIL');
console.log('Ảnh đã up hiện:', await page.locator('img[src*="/api/uploads/"]').count(), 'ảnh');
await page.screenshot({ path: '/tmp/kt_task.png', fullPage: true });

console.log('JS errors:', errors.length ? errors.join(' | ') : 'none');
await browser.close();
