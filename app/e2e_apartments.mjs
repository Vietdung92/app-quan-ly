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

// Trang danh sách căn hộ
await page.goto('http://localhost:8080/apartments', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const body = (await page.textContent('body'))?.replace(/\s+/g, ' ');
console.log('35 căn hộ:', body.includes('35') ? 'OK' : 'FAIL');
console.log('Đã thu 1 căn (12.000.000):', body.includes('12.000.000') ? 'OK' : 'FAIL');
console.log('Còn phải thu 15.000.000:', body.includes('15.000.000') ? 'OK' : 'FAIL');
console.log('Badge Sắp hết hạn:', body.includes('Sắp hết hạn') ? 'OK' : 'FAIL');
console.log('Badge Đã thu / Chưa thu:', body.includes('Đã thu') && body.includes('Chưa thu') ? 'OK' : 'FAIL');
console.log('Có nút Thu Tiền:', body.includes('Thu Tiền') ? 'OK' : 'FAIL');
await page.screenshot({ path: '/tmp/e2e_apartments.png' });

// Trang chi tiết căn The Sóng (đã có HĐ)
const link = await page.$('a:has-text("The Sóng (C Hà)")');
if (link) {
  await link.click();
  await page.waitForTimeout(2000);
  const detail = (await page.textContent('body'))?.replace(/\s+/g, ' ');
  console.log('Chi tiết - có form HĐ (Chủ Nhà):', detail.includes('Chủ Nhà') ? 'OK' : 'FAIL');
  console.log('Chi tiết - lịch sử thu tháng 8:', detail.includes('Tháng 8/2026') ? 'OK' : 'FAIL');
  await page.screenshot({ path: '/tmp/e2e_apartment_detail.png' });
}
console.log('JS errors:', errors.length ? errors : 'none');
await browser.close();
