# StudySnap — Nền Tảng BVN Đa Phương Tiện, Luyện Tập Cuối Giờ & Ôn Từ Vựng

Nền tảng học tập tương tác miễn phí (`0đ`) cho lớp học Tiếng Trung HSK & Ngoại ngữ, tối ưu phản hồi tức thì trên **Cloudflare Workers Static Assets + Cloudflare D1** kết hợp **Google Drive Media Bridge (5TB)**.

---

## Kiến Trúc & Công Nghệ

- **Frontend & Edge Hosting**: HTML5 / CSS3 / Vanilla JS phục vụ qua **Cloudflare Workers (Static Assets)** cấu hình tại [`wrangler.toml`](wrangler.toml) (cùng [`.assetsignore`](.assetsignore) và [`_headers`](_headers) cấp quyền micro/camera).
- **Database Chính (20–100ms)**: **Cloudflare D1 (SQLite tại Edge)** phục vụ qua endpoint `/api` tại [`src/worker.js`](src/worker.js) & [`functions/api.js`](functions/api.js) *(hỗ trợ cả Cloudflare Workers Builds `npx wrangler deploy` lẫn Cloudflare Pages Functions)*.
- **Kho Lưu Trữ Media (5TB)**: **Google Drive** qua **Google Apps Script Web App** ([`backend/Code.gs`](backend/Code.gs)) xử lý chuyên biệt `uploadMedia`, `deleteMediaFiles`, `getMedia` (không chờ `LockService` hay đọc Sheets), đồng thời làm fallback dự phòng nếu D1 chưa sẵn sàng.
- **Tối ưu Audio & Caching**:
  - Thu âm giọng nói nén `audioBitsPerSecond: 32000` qua `MediaRecorder API`.
  - Tải file nghe hiểu song song (tối đa 3 file/lượt) lên Google Drive khi lưu đề luyện tập.
  - Phát lại media qua Cloudflare Edge Cache (`/api?action=media&fileId=...`) + Browser Cache API (`studysnap-drive-media-v1`) + `localStorage` cho từ vựng & trạng thái.

---

## Cấu Trúc Thư Mục

```text
study-snap/
├── index.html                        # Cổng Đăng Nhập (Học sinh & Giáo viên)
├── student.html                      # Cổng Học Sinh (BVN Audio/Video, Luyện tập cuối giờ, Flashcard & Trắc nghiệm từ vựng)
├── teacher.html                      # Cổng Giáo Viên (Chữa BVN + Voice Feedback, Soạn đề Nghe/Dịch/Nối/Trắc nghiệm, Quản lý lớp)
├── _headers                          # Cấu hình header bảo mật & quyền micro/camera
├── .assetsignore                     # Ẩn mã nguồn backend/worker/tài liệu khỏi static assets công khai
├── wrangler.toml                     # Cấu hình Cloudflare Workers Static Assets + D1 binding DB
├── wrangler.workers.example.toml     # Mẫu cấu hình Cloudflare Workers Static Assets
├── wrangler.pages.example.toml       # Mẫu cấu hình nếu chuyển sang Cloudflare Pages
├── styles/
│   └── main.css                      # Hệ thống giao diện Education Teal & Coral + responsive
├── js/
│   ├── data.js                       # Store, Loading Overlay & Sync Queue (Hybrid Cloudflare D1 + GAS Drive Bridge)
│   ├── auth.js                       # Quản lý phiên đăng nhập theo vai trò
│   ├── login.js                      # Xử lý đăng nhập & chuyển cổng
│   ├── audio.js                      # Thu âm 32kbps, trình phát sóng âm & Cache API + Edge proxy cache
│   ├── student.js                    # Giao diện & nghiệp vụ Cổng Học Sinh
│   ├── teacher.js                    # Giao diện & nghiệp vụ Cổng Giáo Viên
│   ├── vocab_data.js                 # Dữ liệu khởi tạo từ vựng theo bài
│   └── vocab_suite.js                # Bộ ôn tập từ vựng (Flashcard 3D, Nối từ, Trắc nghiệm, Tổng hợp)
├── src/
│   └── worker.js                     # Entry-point Cloudflare Worker phục vụ /api và tài nguyên tĩnh ASSETS
├── functions/
│   └── api.js                        # Logic API Cloudflare D1 & Drive Media Proxy (/api)
├── backend/
│   ├── schema_d1.sql                 # Lược đồ 10 bảng SQLite & 8 index cho Cloudflare D1
│   ├── Code.gs                       # Google Apps Script Drive Media Bridge + Sheets fallback
│   └── HUONG_DAN_CAI_DAT_BACKEND.md  # Hướng dẫn cài đặt chi tiết từng bước
└── design-system/                    # Tài liệu hệ thống thiết kế StudySnap
```

---

## Cài Đặt Nhanh

Xem hướng dẫn chi tiết tại [`backend/HUONG_DAN_CAI_DAT_BACKEND.md`](backend/HUONG_DAN_CAI_DAT_BACKEND.md):

1. Cập nhật [`backend/Code.gs`](backend/Code.gs) lên Google Apps Script và xuất bản (**Deploy -> Manage deployments -> Edit -> Version: `New version` -> Deploy**).
2. Tạo D1 database trên Cloudflare Dashboard (chạy [`backend/schema_d1.sql`](backend/schema_d1.sql) trong D1 Studio) và gắn `database_id` vào `[[d1_databases]]` trong [`wrangler.toml`](wrangler.toml).
3. Push lên GitHub để Cloudflare Workers Builds chạy **`npx wrangler deploy`** tự động, sau đó mở thử `/api?action=ping`.
