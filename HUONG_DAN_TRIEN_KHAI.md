# Hướng Dẫn Triển Khai App Quản Lý Công Ty Lên Internet

Hướng dẫn này dành cho người **không biết lập trình**. Làm theo từng bước, tổng thời gian khoảng 30-45 phút. Sau khi xong, anh và nhân viên truy cập app từ điện thoại/máy tính ở bất cứ đâu qua tên miền riêng (ví dụ `quanly.congtycuaban.com`).

---

## Phần 1: Chuẩn Bị (mua 2 thứ)

### 1.1. Thuê VPS (máy chủ ảo) — khoảng 100.000-200.000đ/tháng

VPS là một máy tính chạy 24/7 trên Internet. Với quy mô 5 nhân viên, cấu hình nhỏ nhất là đủ:

- **Cấu hình cần**: 1 CPU, 1-2GB RAM, 20GB ổ cứng, hệ điều hành **Ubuntu 22.04 hoặc 24.04**
- **Nhà cung cấp Việt Nam** (dễ thanh toán, hỗ trợ tiếng Việt): Vietnix, AZDIGI, Tino, VinaHost
- Nhà cung cấp quốc tế rẻ hơn: Vultr, DigitalOcean (khoảng 6 USD/tháng, cần thẻ Visa)

Khi mua xong, nhà cung cấp gửi email cho anh 3 thông tin — **lưu lại cẩn thận**:
- Địa chỉ IP (dạng `103.x.x.x`)
- Tài khoản: `root`
- Mật khẩu

### 1.2. Mua tên miền — khoảng 200.000-700.000đ/năm

Mua ở: Matbao, PA Việt Nam, Tenten, hoặc Namecheap. Ví dụ: `hcare.vn`, `quanlyhcare.com`.

**Trỏ tên miền về VPS** (làm trong trang quản lý tên miền):
1. Tìm mục "DNS" hoặc "Quản lý DNS"
2. Thêm 2 bản ghi:

| Loại | Tên (Host) | Giá trị |
|------|-----------|---------|
| A | @ | IP của VPS (103.x.x.x) |
| A | www | IP của VPS (103.x.x.x) |

3. Đợi 5-30 phút cho DNS có hiệu lực.

---

## Phần 2: Kết Nối Vào VPS

### Trên Windows
1. Mở **PowerShell** (bấm phím Windows, gõ "powershell", Enter)
2. Gõ lệnh sau (thay IP thật của anh):
   ```
   ssh root@103.x.x.x
   ```
3. Lần đầu sẽ hỏi "Are you sure...?" → gõ `yes` → Enter
4. Nhập mật khẩu (lưu ý: **khi gõ mật khẩu màn hình không hiện gì** — cứ gõ rồi Enter)

### Trên Mac
Mở **Terminal**, làm y hệt như trên.

Kết nối thành công khi thấy dòng chữ kiểu `root@ten-may:~#`.

---

## Phần 3: Đưa Code Lên VPS

Trên **máy tính của anh** (không phải trên VPS), mở PowerShell/Terminal **mới**, đi tới thư mục chứa 2 file zip đã giải nén (backend và app), rồi chạy:

```
scp -r backend app deploy HUONG_DAN_TRIEN_KHAI.md root@103.x.x.x:/root/app-quanly/
```

(Thay `103.x.x.x` bằng IP thật. Lệnh này copy toàn bộ code lên VPS, mất 1-2 phút.)

> 💡 Nếu dùng Windows và lệnh trên báo lỗi, tải phần mềm **WinSCP** (miễn phí) — kéo thả thư mục `backend`, `app`, `deploy` vào `/root/app-quanly/` trên VPS bằng chuột.

---

## Phần 4: Cài Đặt Tự Động (1 lệnh)

Quay lại cửa sổ đang kết nối VPS, chạy 2 lệnh:

```
cd /root/app-quanly
sudo bash deploy/install.sh ten-mien-cua-ban.com
```

(Thay `ten-mien-cua-ban.com` bằng tên miền thật của anh, **không có** `www.` và `https://`)

Script tự động làm hết: cài Node.js, PostgreSQL, nginx, PM2 → tạo database với mật khẩu ngẫu nhiên → cài backend → build frontend → cấu hình nginx → khởi động app chạy 24/7. Mất khoảng 5-10 phút.

Khi thấy dòng **"✅ CÀI ĐẶT XONG!"** → mở trình duyệt vào `http://ten-mien-cua-ban.com` → thấy trang đăng nhập là thành công.

---

## Phần 5: Bật HTTPS (Bắt Buộc — 2 phút)

HTTPS mã hóa dữ liệu (mật khẩu, lương...) khi truyền trên mạng. Miễn phí, tự gia hạn:

```
sudo bash deploy/enable-https.sh ten-mien-cua-ban.com
```

Certbot sẽ hỏi email (để báo khi chứng chỉ có vấn đề) → nhập email → đồng ý điều khoản. Xong thì vào `https://ten-mien-cua-ban.com` — có ổ khóa 🔒 trên trình duyệt.

---

## Phần 6: Sau Khi Cài Xong

### 6.1. Đổi mật khẩu ngay (quan trọng!)

Đăng nhập `quanly@hcare.com` / `hcare123` → Hồ Sơ Cá Nhân → Đổi Mật Khẩu.

### 6.2. Xóa dữ liệu mẫu, nhập dữ liệu thật

Hệ thống có sẵn 5 nhân viên mẫu, 3 dự án mẫu để anh khám phá. Khi dùng thật: vào Nhân Viên → sửa thông tin thành nhân viên thật của anh, xóa/sửa dự án mẫu.

### 6.3. Bật thông báo Telegram (tùy chọn, 5 phút)

1. Mở Telegram, tìm **@BotFather** → gửi `/newbot` → đặt tên bot → nhận **token**
2. Thêm bot vào nhóm Telegram công ty, nhắn 1 tin bất kỳ trong nhóm
3. Mở trình duyệt: `https://api.telegram.org/bot<TOKEN>/getUpdates` → tìm `"chat":{"id":-100...}` → đó là **chat_id**
4. Trên VPS chạy:
   ```
   nano /var/www/app-quanly/backend/.env
   ```
   Điền token và chat_id vào 2 dòng `TELEGRAM_BOT_TOKEN=` và `TELEGRAM_CHAT_ID=`
   (Lưu: Ctrl+O, Enter. Thoát: Ctrl+X)
5. Khởi động lại: `pm2 restart app-quanly-api`

Từ giờ mọi chi phí, đơn nghỉ phép, giao việc, trả lương đều báo vào nhóm.

---

## Phần 7: Vận Hành Hằng Ngày

### Các lệnh hữu ích (chạy trên VPS)

| Việc | Lệnh |
|------|------|
| Xem app có đang chạy không | `pm2 status` |
| Xem log lỗi | `pm2 logs app-quanly-api --lines 50` |
| Khởi động lại app | `pm2 restart app-quanly-api` |
| Kiểm tra sức khỏe hệ thống | `curl http://localhost:3000/health` |

### Sao lưu database (nên làm hằng tuần)

```
sudo -u postgres pg_dump app_quanly_conty > /root/backup-$(date +%Y%m%d).sql
```

Tải file backup về máy (chạy trên máy của anh):
```
scp root@103.x.x.x:/root/backup-*.sql ./
```

> 💡 Muốn tự động sao lưu hằng đêm, chạy 1 lần trên VPS:
> ```
> echo '0 2 * * * sudo -u postgres pg_dump app_quanly_conty > /root/backup-$(date +\%Y\%m\%d).sql && ls -t /root/backup-*.sql | tail -n +8 | xargs rm -f' | crontab -
> ```
> (Backup lúc 2h sáng mỗi ngày, giữ 7 bản gần nhất)

### Cập nhật phiên bản mới

Khi có code mới: upload code mới lên `/root/app-quanly-moi/`, rồi:
```
cd /root/app-quanly-moi
sudo bash deploy/update.sh
```
Database và cấu hình được giữ nguyên.

---

## Xử Lý Sự Cố Thường Gặp

**Vào tên miền thấy "502 Bad Gateway"**
→ Backend chưa chạy. Chạy: `pm2 restart app-quanly-api` rồi `pm2 logs` xem lỗi.

**Vào tên miền không thấy gì / "This site can't be reached"**
→ DNS chưa trỏ đúng hoặc chưa có hiệu lực. Kiểm tra bản ghi A trỏ đúng IP chưa, đợi thêm 30 phút.

**Đăng nhập báo "Lỗi hệ thống"**
→ Database có vấn đề. Chạy: `systemctl restart postgresql` rồi `pm2 restart app-quanly-api`.

**Quên mật khẩu tài khoản quản lý**
→ Trên VPS chạy (đặt lại về `hcare123`):
```
HASH=$(cd /var/www/app-quanly/backend && node -e "console.log(require('bcryptjs').hashSync('hcare123', 10))")
sudo -u postgres psql app_quanly_conty -c "UPDATE users SET password_hash='$HASH' WHERE email='quanly@hcare.com';"
```

**VPS hết dung lượng**
→ Xóa backup cũ: `rm /root/backup-2026*.sql` (giữ lại vài bản mới nhất)

---

## Chi Phí Duy Trì

| Khoản | Chi phí |
|-------|---------|
| VPS | ~100.000-200.000đ/tháng |
| Tên miền | ~200.000-700.000đ/năm |
| SSL (HTTPS) | Miễn phí (Let's Encrypt) |
| Telegram Bot | Miễn phí |
| **Tổng** | **~1,5-3 triệu đ/năm** |
