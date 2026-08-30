import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function login(ctx, email) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://localhost:8080/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'hcare123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/', { timeout: 15000 });
  await page.waitForTimeout(2000);
  return { page, errors };
}

// ========== KT ==========
console.log('===== KỸ THUẬT =====');
const ctxKT = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const { page: kt, errors: ktErr } = await login(ctxKT, 'kt1@hcare.com');
console.log('Chấm công trên tổng quan:', await kt.locator('text=Chấm Công Hôm Nay').count() > 0 ? 'OK' : 'FAIL');
console.log('3 số việc:', await kt.locator('text=Được giao').count() > 0 ? 'OK' : 'FAIL');
console.log('Bộ lọc tháng:', await kt.locator('input[type="month"]').count() > 0 ? 'OK' : 'FAIL');
console.log('Mục Chi Phí (mở sẵn):', await kt.locator('text=Chi Phí').count() > 0 ? 'OK' : 'FAIL');
await kt.click('main button:has-text("Ứng Lương")');
await kt.waitForTimeout(600);
console.log('Mục Ứng Lương mở được:', await kt.locator('text=Xin ứng lương').count() > 0 ? 'OK' : 'FAIL');
await kt.screenshot({ path: '/tmp/r2_kt_dash.png', fullPage: true });

// KT nhập chi phí với ProjectPicker tạo dự án mới
await kt.goto('http://localhost:8080/expenses/new');
await kt.waitForTimeout(1500);
await kt.fill('input[placeholder*="sơn nước"]', 'Mua ống nước PVC test');
await kt.fill('input[placeholder*="850000"]', '350000');
await kt.fill('input[placeholder*="Gõ tên dự án"]', 'Sửa Ống Nước Q9');
await kt.waitForTimeout(600);
const createBtn = kt.locator('button:has-text("Tạo dự án mới")');
console.log('Gợi ý tạo dự án mới hiện:', await createBtn.count() > 0 ? 'OK' : 'FAIL');
await createBtn.click();
await kt.waitForTimeout(1500);
console.log('Dự án đã chọn:', await kt.locator('text=Sửa Ống Nước Q9').count() > 0 ? 'OK' : 'FAIL');
// tick hoàn trả + chọn hạng mục
await kt.locator('input[type="checkbox"]').check();
const catCount = await kt.locator('select option').count();
console.log('Hạng mục Quỹ load:', catCount > 1 ? `OK (${catCount - 1})` : 'FAIL');
await kt.locator('select').selectOption({ index: 1 });
await kt.click('button:has-text("Gửi Chi Phí")');
await kt.waitForTimeout(2000);
console.log('Gửi chi phí:', kt.url().endsWith('/expenses') ? 'OK' : 'FAIL ' + kt.url());
console.log('Lịch sử hiện khoản vừa gửi:', await kt.locator('text=Mua ống nước PVC test').count() > 0 ? 'OK' : 'FAIL');
await kt.screenshot({ path: '/tmp/r2_kt_expense.png', fullPage: true });
console.log('KT JS errors:', ktErr.length ? ktErr.join(' | ') : 'none');
await ctxKT.close();

// ========== VP ==========
console.log('===== VĂN PHÒNG =====');
const ctxVP = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const { page: vp, errors: vpErr } = await login(ctxVP, 'vp@hcare.com');
console.log('Bàn Làm Việc:', await vp.locator('text=Bàn Làm Việc').count() > 0 ? 'OK' : 'FAIL');
console.log('Ô Chờ Duyệt:', await vp.locator('text=Chờ Duyệt').count() > 0 ? 'OK' : 'FAIL');
console.log('Tiền tháng này:', await vp.locator('text=Thu khách còn thiếu').count() > 0 ? 'OK' : 'FAIL');
console.log('Sắp đến hạn:', await vp.locator('text=Sắp Đến Hạn').count() > 0 ? 'OK' : 'FAIL');
await vp.screenshot({ path: '/tmp/r2_vp_bench.png', fullPage: true });

// Duyệt chi phí KT vừa gửi
await vp.goto('http://localhost:8080/expenses');
await vp.waitForTimeout(1500);
console.log('Tab Chờ duyệt hiện khoản:', await vp.locator('text=Mua ống nước PVC test').count() > 0 ? 'OK' : 'FAIL');
await vp.screenshot({ path: '/tmp/r2_vp_approve.png', fullPage: true });
await vp.click('button:has-text("Duyệt → vào Quỹ")');
await vp.waitForTimeout(2000);
console.log('Duyệt thành công:', await vp.locator('text=Mua ống nước PVC test').count() === 0 ? 'OK (rời tab chờ)' : 'FAIL');
// Tab cần hoàn tiền
await vp.click('button:has-text("Cần hoàn tiền")');
await vp.waitForTimeout(1200);
console.log('Tab Cần hoàn tiền có khoản:', await vp.locator('text=Mua ống nước PVC test').count() > 0 ? 'OK' : 'FAIL');
vp.on('dialog', (d) => d.accept());
await vp.click('button:has-text("Đã chuyển hoàn tiền")');
await vp.waitForTimeout(1500);
console.log('Đánh dấu hoàn tiền:', await vp.locator('text=Mua ống nước PVC test').count() === 0 ? 'OK' : 'FAIL');

// Tab việc của tôi
await vp.goto('http://localhost:8080/tasks');
await vp.waitForTimeout(1500);
console.log('Tab Việc của tôi:', await vp.locator('button:has-text("Việc của tôi")').count() > 0 ? 'OK' : 'FAIL');
console.log('VP JS errors:', vpErr.length ? vpErr.join(' | ') : 'none');
await ctxVP.close();

// ========== QL ==========
console.log('===== QUẢN LÝ =====');
const ctxQL = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const { page: ql, errors: qlErr } = await login(ctxQL, 'quanly@hcare.com');
console.log('Dashboard số thật (Số Dư Quỹ):', await ql.locator('text=Số Dư Quỹ').count() > 0 ? 'OK' : 'FAIL');
console.log('Hiệu suất nhân viên:', await ql.locator('text=Hiệu Suất Nhân Viên').count() > 0 ? 'OK' : 'FAIL');
await ql.screenshot({ path: '/tmp/r2_ql_dash.png', fullPage: true });
// Bấm thẻ Doanh Thu → funds lọc Thu
await ql.click('text=Doanh Thu Tháng');
await ql.waitForURL('**/funds**', { timeout: 10000 });
console.log('Thẻ Doanh Thu → Quỹ lọc:', ql.url().includes('type=Thu') ? 'OK' : 'FAIL ' + ql.url());
await ql.waitForTimeout(1500);
await ql.screenshot({ path: '/tmp/r2_ql_funds.png' });
console.log('QL JS errors:', qlErr.length ? qlErr.join(' | ') : 'none');
await ctxQL.close();

await browser.close();
