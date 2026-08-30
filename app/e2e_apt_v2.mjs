import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'quanly@hcare.com');
await page.fill('input[type="password"]', 'hcare123');
await page.click('button[type="submit"]');
await page.waitForTimeout(2500);

await page.goto('http://localhost:8080/apartments', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const body = (await page.textContent('body'))?.replace(/\s+/g, ' ');
console.log('34 căn Eureka:', body.includes('34') ? 'OK' : 'FAIL');
console.log('B-34.09 hiện:', body.includes('B-34.09') ? 'OK' : 'FAIL');
console.log('Khách HOÀNG HỒNG NHUNG:', body.includes('HOÀNG HỒNG NHUNG') ? 'OK' : 'FAIL');
console.log('Cột Trả Chủ Nhà:', body.includes('Trả Chủ Nhà') || body.includes('TRẢ CHỦ') ? 'OK' : 'FAIL');
console.log('Có căn Quản lý hộ:', body.includes('Quản lý hộ') ? 'OK' : 'FAIL');
await page.screenshot({ path: '/tmp/e2e_apt_v2_list.png' });

// Chi tiết B-34.09
await page.click('a:has-text("B-34.09")');
await page.waitForTimeout(2500);
const detail = (await page.textContent('body'))?.replace(/\s+/g, ' ');
console.log('HĐ Chủ Nhà (HA SEUNG LYONG):', detail.includes('HA SEUNG LYONG') ? 'OK' : 'FAIL');
console.log('Section 2 HĐ:', detail.includes('Hợp Đồng Với Chủ Nhà') && detail.includes('Hợp Đồng Với Khách Thuê') ? 'OK' : 'FAIL');
console.log('Lịch sử trả chủ (19.000.000):', detail.includes('19.000.000') ? 'OK' : 'FAIL');
console.log('Lịch sử thu khách import:', detail.includes('Lịch Sử Thu Khách') ? 'OK' : 'FAIL');
await page.screenshot({ path: '/tmp/e2e_apt_v2_detail.png', fullPage: false });
console.log('JS errors:', errors.length ? errors : 'none');
await browser.close();
