# App Quản Lý Công Ty - Backend API

Express + PostgreSQL. Chạy ở port 3000.

## Cài đặt

```bash
# 1. Cài dependencies
npm install

# 2. Tạo database
createdb app_quanly_conty

# 3. Seed schema + dữ liệu mẫu (thay hash mật khẩu trước)
node -e "console.log(require('bcryptjs').hashSync('hcare123', 10))"
# Copy hash vào schema.sql thay cho __BCRYPT_HASH__ rồi:
psql -U app_user -d app_quanly_conty -f schema.sql

# 4. Cấu hình
cp .env.example .env
# Sửa DB_USER, DB_PASSWORD, JWT_SECRET trong .env

# 5. Chạy
npm run dev      # có auto-reload
npm start        # production
```

## Tài khoản mẫu (mật khẩu: hcare123)

| Email | Vai trò |
|---|---|
| quanly@hcare.com | QL (Quản lý - full quyền) |
| vp@hcare.com | VP (Phó quản lý) |
| kt1@hcare.com, kt2@, kt3@ | KT (Nhân viên) |

## Phân quyền

- **QL**: toàn quyền (duyệt vay lương, tạo/sửa nhân viên, tạo bảng lương)
- **VP**: duyệt chi phí/nghỉ phép, quản lý dự án/công việc, xem nhân viên
- **KT**: chỉ thấy dữ liệu của mình (công việc được giao, đơn nghỉ phép, đơn vay, bảng lương)

## Response envelope

Thành công: `{ "success": true, "data": ... }`
Lỗi: `{ "success": false, "error": "thông báo tiếng Việt" }`

Field names trả về là camelCase (fullName, joinDate, netSalary...).
Tiền tệ là VNĐ nguyên (frontend tự chia 1 triệu để hiển thị).

## Endpoints chính

- `POST /api/auth/login|register|refresh-token|logout|change-password|verify`
- `GET|POST /api/employees`, `GET|PUT|DELETE /api/employees/:id`, `PATCH .../status|salary`
- `GET|POST /api/projects`, `GET|PUT|DELETE /api/projects/:id`, `GET .../budget`, `PATCH .../status`
- `GET|POST /api/tasks`, CRUD + `PATCH .../status|assign`
- `GET|POST /api/expenses`, CRUD + `POST .../approve|reject`, `GET /monthly/:month`
- `GET /api/leaves`, `GET /balance/:employeeId`, `POST /request`, `POST /:id/approve|reject|cancel`
- `GET /api/advances`, `GET /balance/:employeeId`, `POST /request`, `POST /:id/approve|reject|deduct`
- `GET /api/payroll`, `GET /employee/:id`, `POST /generate`, `POST /:id/approve|process|pay`
- `GET /api/attendance?month=`, `POST /check-in`, `POST /check-out`
- `GET /api/notifications`, `PUT /:id/read`, `PUT /read-all`, `DELETE /:id`
- `GET /api/dashboard/overview|stats|activities|chart/expense-trend|chart/project-status|chart/monthly`

## Thông báo Telegram (D.3)

Bot tự động gửi tin nhắn vào nhóm Telegram khi: chi phí mới chờ duyệt / được duyệt / bị từ chối, đơn nghỉ phép mới / được xử lý, đơn ứng lương mới / được xử lý, công việc được giao, bảng lương được tạo / thanh toán. Đồng thời tạo thông báo trong app (trang Notifications) cho đúng người liên quan.

### Cách bật

1. Chat với **@BotFather** trên Telegram → `/newbot` → lấy token
2. Thêm bot vào nhóm công ty, gửi 1 tin nhắn bất kỳ trong nhóm
3. Mở `https://api.telegram.org/bot<TOKEN>/getUpdates` → tìm `"chat":{"id":-100...}` → đó là chat_id
4. Điền vào `.env`:
   ```
   TELEGRAM_BOT_TOKEN=123456:ABC-xyz...
   TELEGRAM_CHAT_ID=-1001234567890
   ```
5. Restart server → test bằng `POST /api/telegram/test` (đăng nhập QL)

Để trống 2 biến trên thì tính năng tự tắt — app vẫn chạy bình thường (thông báo trong app vẫn hoạt động). Lỗi mạng Telegram không bao giờ làm hỏng API chính.

## Logic nghiệp vụ đã implement

- Duyệt chi phí có project → tự cộng vào `projects.spent` (transaction)
- Hạn mức vay lương: tối đa 50% lương trừ dư nợ hiện tại (kiểm tra server-side)
- Duyệt vay → mặc định khấu trừ đều 3 tháng
- Tạo bảng lương tháng: net = lương cơ bản + phụ cấp - khấu trừ - khấu trừ vay
- Thanh toán lương → tự trừ dư nợ vay, vay trả hết → status `completed`
- Số phép năm: 12 ngày phép năm, 5 ngày ốm, 3 ngày cá nhân
- Điểm danh sau 08:15 → tự đánh dấu đi muộn
