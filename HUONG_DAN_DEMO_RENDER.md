# Chạy Demo Online MIỄN PHÍ (Render.com) — Chưa Cần Mua VPS Hay Tên Miền

Sau khi làm xong, anh có một đường link dạng `https://app-quanly-demo.onrender.com` — mở được từ điện thoại/máy tính ở bất cứ đâu, gửi cho nhân viên dùng thử được. **Hoàn toàn miễn phí, không cần thẻ ngân hàng.** Tổng thời gian khoảng 20-30 phút.

## Trước khi bắt đầu — 2 điều cần biết về bản miễn phí

1. **App "ngủ" sau 15 phút không ai dùng.** Người đầu tiên mở lại sẽ đợi khoảng 30-60 giây cho app "thức dậy", sau đó chạy bình thường. Với demo thì hoàn toàn chấp nhận được.
2. **Database miễn phí bị Render xóa sau ~30 ngày.** Đủ dài để dùng thử và cho nhân viên làm quen. Khi ưng ý và muốn dùng thật lâu dài thì chuyển sang VPS theo `HUONG_DAN_TRIEN_KHAI.md` — dữ liệu nhập trong lúc demo có thể xuất ra mang theo (nhắn tôi hướng dẫn khi cần).

Vì vậy: cứ thoải mái bấm thử mọi thứ trong demo, đừng nhập dữ liệu quan trọng duy nhất vào đây.

---

## Bước 1: Tạo tài khoản GitHub (nơi chứa code) — 5 phút

1. Vào **github.com** → Sign up → đăng ký bằng email (miễn phí)
2. Sau khi đăng nhập, bấm nút **"+"** góc trên phải → **New repository**
3. Đặt tên: `app-quan-ly` — chọn **Private** (riêng tư) → bấm **Create repository**

## Bước 2: Đưa code lên GitHub — 5 phút

Giải nén file `app-quan-ly-full.zip` ra một thư mục trên máy tính. Bên trong có các thư mục `app`, `backend`, `deploy` và vài file lẻ.

Trên trang repository vừa tạo:

1. Bấm link **"uploading an existing file"** (trong dòng chữ Quick setup)
2. Mở thư mục đã giải nén, **kéo thả nguyên thư mục `app`** vào trang web → đợi tải lên xong → bấm nút xanh **Commit changes**
3. Bấm **Add file → Upload files** → kéo thả nốt: thư mục `backend`, thư mục `deploy`, và các file `render.yaml`, `.gitignore`, `HUONG_DAN_TRIEN_KHAI.md` → **Commit changes**

> ⚠️ Phải tách 2 lần tải như trên vì GitHub giới hạn 100 file mỗi lần. Quan trọng nhất là file **`render.yaml` phải nằm ở gốc** repository (nhìn thấy ngay khi mở trang repo).

## Bước 3: Tạo demo trên Render — 5 phút thao tác + ~10 phút chờ máy chạy

1. Vào **render.com** → **Get Started** → chọn **Sign in with GitHub** (đăng nhập bằng chính tài khoản GitHub vừa tạo, bấm Authorize khi được hỏi)
2. Trong trang quản lý, bấm **New +** (góc trên phải) → chọn **Blueprint**
3. Chọn repository **app-quan-ly** → bấm **Connect**
4. Render tự đọc file `render.yaml` và hiện ra danh sách sẽ tạo (1 web service + 1 database) → bấm **Apply** / **Deploy**
5. Đợi build — khoảng 5-10 phút (theo dõi log chạy trên màn hình, thấy dòng "Server running" là xong)

Lần chạy đầu tiên, app **tự động** tạo toàn bộ database: tài khoản mẫu, danh mục, 174 giao dịch thu chi thật, 35 căn hộ — không cần làm gì thêm.

## Bước 4: Dùng thử

1. Bấm vào đường link Render hiển thị (dạng `https://app-quanly-demo-xxxx.onrender.com`)
2. Đăng nhập: **quanly@hcare.com** / **hcare123**
3. **Đổi mật khẩu ngay** (Hồ Sơ Cá Nhân → Đổi Mật Khẩu) vì link này ai có đều mở được
4. Gửi link + tài khoản nhân viên (vp@hcare.com, kt1@hcare.com... cùng mật khẩu hcare123) cho team dùng thử trên điện thoại

## Bật Telegram cho demo (tùy chọn)

Trên Render: vào service **app-quanly-demo** → tab **Environment** → **Add Environment Variable**, thêm 2 biến `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID` (cách lấy xem trong `backend/README.md`) → Save. App tự khởi động lại và bắt đầu báo vào nhóm.

## Khi có bản cập nhật code mới

Tải các file mới lên lại GitHub (Add file → Upload files → kéo thả đè lên) → Render tự phát hiện và tự build lại. Không phải làm gì trên Render.

## Câu hỏi thường gặp

**Mở link thấy quay vòng lâu?** — App đang "thức dậy" sau khi ngủ, đợi tối đa 1 phút.

**Muốn demo chạy vĩnh viễn không bị xóa DB?** — Có 2 đường: (1) nâng cấp database Render lên gói trả phí ~7 USD/tháng, hoặc (2) chuyển sang VPS chính thức theo HUONG_DAN_TRIEN_KHAI.md — khuyên đường 2 vì cùng tiền mà được cả tên miền riêng, nhanh hơn, không ngủ.

**Có mất phí ẩn không?** — Không, gói Free của Render không yêu cầu thẻ. Chỉ khi tự tay nâng cấp mới mất phí.
