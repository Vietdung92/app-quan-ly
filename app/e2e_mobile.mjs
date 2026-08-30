import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
// iPhone 13 viewport
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'quanly@hcare.com');
await page.fill('input[type="password"]', 'hcare123');
await page.click('button[type="submit"]');
await page.waitForTimeout(3000);

// 1. Dashboard: sidebar phải ĐÓNG, bottom nav phải HIỆN
const overlayVisible = await page.$eval('aside', (el) => {
  const r = el.getBoundingClientRect();
  return r.x >= 0 && r.width > 0;
}).catch(() => false);
console.log('Sidebar đóng khi vào app:', !overlayVisible ? 'OK' : 'FAIL');
const bottomNav = await page.$('nav.fixed.bottom-0');
console.log('Bottom nav hiện:', bottomNav ? 'OK' : 'FAIL');
await page.screenshot({ path: '/tmp/m_dashboard.png' });

// 2. Bấm tab Thu Chi trên bottom nav
await page.click('nav.fixed.bottom-0 a[href="/funds"]');
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/m_funds.png' });

// 3. Trang Căn Hộ qua bottom nav
await page.click('nav.fixed.bottom-0 a[href="/apartments"]');
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/m_apartments.png' });

// 4. Form thêm giao dịch (kiểm tra form 1 cột)
await page.goto('http://localhost:8080/funds/new', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const amountBox = await page.$eval('input[name="amount"]', (el) => {
  const r = el.getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height), fs: getComputedStyle(el).fontSize };
});
console.log(`Ô Số Tiền: rộng ${amountBox.w}px (1 cột nếu >300), cao ${amountBox.h}px (>=44), chữ ${amountBox.fs} (>=16px)`);
await page.screenshot({ path: '/tmp/m_form.png' });

// 5. Không tràn ngang
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
console.log('Không tràn ngang:', !overflow ? 'OK' : 'FAIL');
console.log('JS errors:', errors.length ? errors : 'none');
await browser.close();
