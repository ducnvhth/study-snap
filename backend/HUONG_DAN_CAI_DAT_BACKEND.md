# Hướng Dẫn Cài Đặt Backend StudySnap (Cloudflare D1 + Google Drive Media Bridge)

Tài liệu này hướng dẫn thiết lập kiến trúc lai **0đ (không cần thẻ tín dụng)**:
- **Cloudflare D1 (SQLite tại Edge)** qua [`src/worker.js`](../src/worker.js) & [`functions/api.js`](../functions/api.js) (`/api`): lưu và truy vấn toàn bộ dữ liệu có cấu trúc (học sinh, lớp học, bài tập, điểm số, từ vựng, đề luyện tập) với tốc độ ~20–100ms.
- **Google Apps Script (`backend/Code.gs`) + Google Drive**: đóng vai trò Media Bridge lưu trữ toàn bộ tệp âm thanh/video trên kho Google Drive 5TB, kết hợp proxy cache `/api?action=media` & Browser Cache API.

---

## Phần A — Cập Nhật Google Apps Script (`backend/Code.gs`) Cho Google Drive Media Bridge

1. Mở Google Sheet dự án StudySnap đang dùng -> menu **Tiện ích mở rộng (Extensions)** -> **Apps Script**.
2. Xóa toàn bộ mã cũ trong `Code.gs` và dán nguyên toàn bộ nội dung từ file [`backend/Code.gs`](Code.gs).
3. Lưu lại (`Ctrl + S`).
4. Xuất bản phiên bản mới nhất:
   - Nếu **đã có Web App URL** từ trước:
     1. Nhấn **Triển khai (Deploy)** -> **Quản lý các bản triển khai (Manage deployments)**.
     2. Nhấn biểu tượng cây bút chì (**Edit**) ở bản triển khai Web App hiện tại.
     3. Ở mục **Phiên bản (Version)**, chọn **Phiên bản mới (New version)**.
     4. Nhấn **Triển khai (Deploy)** (cấp lại quyền Drive nếu Google hỏi).
   - Nếu **cài mới từ đầu**:
     1. Nhấn **Triển khai (Deploy)** -> **Tạo bản triển khai mới (New deployment)** -> loại **Ứng dụng web (Web app)**.
     2. **Execute as**: `Me` (Tôi).
     3. **Who has access**: `Anyone` (Bất kỳ ai).
     4. Sao chép URL kết thúc bằng `/exec` và cập nhật vào hằng số `DEFAULT_GAS_WEBAPP_URL` trong [`js/data.js`](../js/data.js).

> **Lợi ích bản `Code.gs` mới:** Các request `uploadMedia` và `deleteMediaFiles` đi thẳng tới Google Drive và Cache ID thư mục upload — **không mở `SpreadsheetApp` và không chờ `LockService`**, giúp tốc độ tải file ghi âm/video nhanh hơn rõ rệt. `getMedia` cho file nhỏ cũng được cache trên `CacheService`.

---

## Phần B — Cấu Hình Cloudflare D1 & Deploy Cloudflare Workers (`npx wrangler deploy`)

### Bước 1: Tạo Database D1 (Miễn phí, không cần thẻ)
1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Chọn menu bên trái **Storage & Databases** -> **D1 SQL Database** -> nhấn **Create database** (ví dụ `studysnap-db`).
3. Vào tab **Studio** của database vừa tạo -> dán và chạy toàn bộ [`backend/schema_d1.sql`](schema_d1.sql) *(hoặc để [`functions/api.js`](../functions/api.js) tự chạy `ensureSchema` ở lần gọi `/api` đầu tiên)*.
4. Copy **`Database ID`** (chuỗi UUID) ngay ở trang **Overview / Settings** của database đó.

### Bước 2: Khai Báo Trong `wrangler.toml`
Project đang sử dụng Cloudflare Workers Builds (`npx wrangler deploy`) nên mọi Binding được khai báo trực tiếp trong [`wrangler.toml`](../wrangler.toml) (cùng [`.assetsignore`](../.assetsignore) để ẩn thư mục `backend/`, `functions/`, `src/`, `.agent/` khỏi thư mục tĩnh công khai):

```toml
name = "study-snap"
main = "src/worker.js"
compatibility_date = "2024-11-01"

[assets]
directory = "."
binding = "ASSETS"
run_worker_first = ["/api", "/api/*"]

[[d1_databases]]
binding = "DB"
database_name = "studysnap-db"
database_id = "<DATABASE_ID_CUA_BAN>"
```

*(Lưu ý: Không thêm `pages_build_output_dir` vào `wrangler.toml` khi chạy `npx wrangler deploy`, vì Wrangler sẽ hiểu nhầm sang chế độ Cloudflare Pages).*

### Bước 3: Deploy & Kiểm Tra Endpoint `/api`
1. Push thay đổi lên nhánh `main` của GitHub (Cloudflare tự chạy `npx wrangler deploy`), hoặc chạy thủ công `npx wrangler deploy`.
2. Mở trình duyệt truy cập:
   ```text
   https://<ten-mien-worker-cua-ban>/api?action=ping
   ```
3. Kết quả trả về `"ok":true,"backend":"cloudflare-d1"` là đã kết nối D1 thành công.

*(Nếu sau này muốn chuyển sang **Cloudflare Pages**, xem mẫu [`wrangler.pages.example.toml`](../wrangler.pages.example.toml)).*

---

## Phần C — Di Trú Tự Động Từ Google Sheets & Quản Trị Dữ Liệu

1. **Chuyển dữ liệu tự động 1 lần (Auto-Migration):**
   - Khi mở web lần đầu tiên sau khi gắn `DB` (D1 còn trống), [`js/data.js`](../js/data.js) tự động tải dữ liệu hiện có từ Google Sheets và gọi `POST /api` (`action: "importFromBootstrapData"`) để đưa toàn bộ Lớp học, Học sinh, Bài tập, Bài nộp, Điểm luyện tập, Từ vựng và Đề thi vào Cloudflare D1.
   - Sau khi `app_meta.d1_bootstrapped = '1'`, mọi thao tác đọc/ghi dữ liệu cấu trúc sẽ đi thẳng qua `/api` (~20–100ms), không còn phụ thuộc Google Sheets.
2. **Nếu cài mới hoàn toàn (Sheets cũng chưa có dữ liệu):**
   - Khi đăng nhập giáo viên hoặc gửi `POST /api` với `{"action":"setupDatabase"}` (hoặc chạy hàm `setupDatabase` trên Apps Script Editor trước khi mở web), hệ thống sẽ khởi tạo tài khoản Giáo viên mặc định (`gv_uyennhi` / `123456`). Hãy đổi mật khẩu ngay sau khi đăng nhập.
3. **Quản trị & Làm sạch dữ liệu test:**
   - Theo nguyên tắc an toàn hệ thống, nút xóa sạch toàn bộ dữ liệu không hiển thị trên giao diện Web Giáo viên và `action: "clearAllData"` trên `/api` bị khóa.
   - Khi cần dọn sạch dữ liệu thử nghiệm, quản trị viên thao tác trực tiếp trên **Cloudflare D1 Console / Studio** và/hoặc chạy hàm `clearAllData` / `clearAllDataCompletely` trong **Apps Script Editor**.
