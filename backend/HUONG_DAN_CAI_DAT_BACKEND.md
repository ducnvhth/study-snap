# Hướng Dẫn Cài Đặt & Triển Khai `backend/Code.gs` (Google Sheets + Google Apps Script + Cloudflare Pages)

Tài liệu này hướng dẫn chi tiết từng bước để cài đặt file [`backend/Code.gs`](./Code.gs) lên **Google Sheets & Google Apps Script**, giúp ứng dụng **StudySnap** lưu trữ toàn bộ tài khoản Giáo viên/Học sinh, Bài tập về nhà (BVN), file ghi âm/video, phản hồi Voice của giáo viên và kho từ vựng hoàn toàn miễn phí (`0đ`).

---

## Bước 1: Tạo File Google Sheets & Mở Trình Soạn Thảo `Apps Script`

1. Truy cập [Google Sheets](https://sheets.new) bằng tài khoản Google của Giáo viên để tạo một bảng tính mới.
2. Đặt tên cho bảng tính (ví dụ: **`StudySnap_Database_LopHoc`**).
3. Trên thanh menu của Google Sheets, bấm vào:
   - **Tiện ích mở rộng (Extensions)** → **Apps Script**.
4. Một tab trình duyệt mới của **Google Apps Script** sẽ mở ra, gắn liền trực tiếp với file Google Sheets vừa tạo (nhờ vậy `SpreadsheetApp.getActiveSpreadsheet()` trong `Code.gs` sẽ tự động nhận diện đúng file Google Sheets này mà không cần cấu hình ID phức tạp).

---

## Bước 2: Dán Mã Nguồn `backend/Code.gs` & Khởi Tạo 6 Bảng Dữ Liệu

1. Trong cửa sổ **Google Apps Script**, xóa đoạn hàm `function myFunction() {}` mặc định trong file `Mã.gs` (`Code.gs`).
2. Mở file [`backend/Code.gs`](./Code.gs) trong dự án này, sao chép (**Copy**) toàn bộ nội dung và dán (**Paste**) vào trình soạn thảo Apps Script.
3. Nhấn **`Ctrl + S`** (hoặc biểu tượng đĩa mềm **Lưu dự án**).
4. Trên thanh công cụ phía trên của Apps Script:
   - Tại ô chọn hàm (bên cạnh nút **Chạy / Run**), chọn hàm **`setupDatabase`**.
   - Nhấn nút **Chạy (Run)**.
5. **Cấp quyền lần đầu (Authorization)**:
   - Google sẽ hiện hộp thoại yêu cầu cấp quyền để Script tạo bảng trong Google Sheets và tạo thư mục lưu file ghi âm/video trên Google Drive (`StudySnap_Media_Uploads`).
   - Bấm **Xem lại quyền (Review permissions)** → Chọn tài khoản Google của bạn → Bấm **Nâng cao (Advanced)** → Bấm **Đi tới ... (không an toàn) / Go to ... (unsafe)** → Bấm **Cho phép (Allow)**.
6. Quay lại tab **Google Sheets**, bạn sẽ thấy hệ thống đã tự động tạo sẵn **8 Sheet chuẩn** và khởi tạo **duy nhất 1 tài khoản Giáo viên**:
   - `Teachers`: Tài khoản đăng nhập Giáo viên **Hồ Châu Uyển Nhi** (`gv_uyennhi` / `123456`).
   - `Students`, `Assignments`, `Submissions`, `ExitTickets`, `Vocabulary`, `PracticeExercises`, `PracticeSubmissions`: Để trống hoàn toàn (chỉ có dòng tiêu đề cột) để sẵn sàng nhận dữ liệu lớp học thật.

---

## Bước 3: Deploy `Code.gs` Thành Web App API URL

1. Tại góc trên bên phải của cửa sổ **Google Apps Script**, bấm nút màu xanh **Triển khai (Deploy)** → chọn **Tùy chọn triển khai mới (New deployment)**.
2. Bấm vào biểu tượng **Bánh răng (Chọn loại / Select type)** → chọn **Ứng dụng web (Web app)**.
3. Điền thông tin cấu hình **BẮT BUỘC** như sau:
   - **Mô tả (Description)**: `StudySnap Backend v1`
   - **Thực thi dưới dạng (Execute as)**: Chọn **`Tôi (Me)`** *(để học sinh nộp bài hoặc ghi âm sẽ lưu vào Google Sheets & Google Drive của giáo viên mà học sinh không cần đăng nhập tài khoản Google)*.
   - **Ai có quyền truy cập (Who has access)**: Chọn **`Bất kỳ ai (Anyone)`** *(để web trên Cloudflare Pages gọi được API không bị chặn quyền)*.
4. Bấm **Triển khai (Deploy)**.
5. Sao chép (**Copy**) đường dẫn **URL ứng dụng web (Web app URL)** có dạng:
   ```text
   https://script.google.com/macros/s/AKfycb.../exec
   ```

> **Lưu ý khi chỉnh sửa `Code.gs` về sau**: Mỗi khi bạn sửa code trong `Code.gs`, hãy bấm **Triển khai (Deploy)** → **Quản lý các tùy chọn triển khai (Manage deployments)** → Bấm biểu tượng **Cây bút (Chỉnh sửa)** → Ở mục **Phiên bản (Version)** chọn **Phiên bản mới (New version)** → Bấm **Triển khai (Deploy)** để giữ nguyên đường dẫn URL cũ.

---

## Bước 4: Kết Nối Web App URL Vào Giao Diện StudySnap

Bạn có **2 cách** để kết nối URL vừa lấy vào ứng dụng:

### Cách 1: Dán trực tiếp trên giao diện Web (Nhanh nhất)
1. Mở trang [`index.html`](../index.html), [`teacher.html`](../teacher.html) hoặc [`student.html`](../student.html).
2. Bấm nút **Kết nối Google Sheets** trên góc phải thanh điều hướng.
3. Dán đường dẫn `https://script.google.com/macros/s/.../exec` vào ô **Google Apps Script Web App URL** và bấm **Lưu kết nối**.

### Cách 2: Cố định sẵn URL cho toàn bộ học sinh khi đưa lên Cloudflare Pages
Nếu muốn mọi học sinh khi truy cập web đều tự động kết nối thẳng vào Google Sheets của lớp mà không cần dán lại URL:
1. Mở file [`js/data.js`](../js/data.js).
2. Tìm hàm `getGasUrl()` (khoảng dòng `506`) và điền URL Web App mặc định của bạn vào:
   ```javascript
   const DEFAULT_GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycb.../exec';

   function getGasUrl() {
     return (localStorage.getItem(GAS_URL_KEY) || DEFAULT_GAS_WEBAPP_URL).trim();
   }
   ```

---

## Bước 5: Đưa Giao Diện Lên Cloudflare Pages (Host Miễn Phí)

1. Đẩy toàn bộ thư mục dự án `study-snap` lên GitHub hoặc tải trực tiếp lên [Cloudflare Pages](https://pages.cloudflare.com/):
   - **Framework preset**: `None` (Static HTML/CSS/JS)
   - **Build command**: *(để trống)*
   - **Build output directory**: `/` (thư mục gốc)
2. Sau khi xuất bản, gửi đường dẫn web cho học sinh:
   - Học sinh đăng nhập tại trang chủ (`index.html`) bằng tài khoản do giáo viên tạo → Tự động vào [`student.html`](../student.html).
   - Giáo viên đăng nhập tại trang chủ (`index.html`) bằng tài khoản giáo viên **Hồ Châu Uyển Nhi** (`gv_uyennhi` / `123456`) → Tự động vào [`teacher.html`](../teacher.html) để chấm BVN bằng Voice, xem Bảng tự động tổng hợp và tạo tài khoản mới cho học sinh.

---

## Bước 6: Xóa Toàn Bộ Dữ Liệu Test Để Bắt Đầu Sử Dụng Dữ Liệu Thật (`clearAllData`)

Sau khi bạn đã kiểm thử xong các chức năng và muốn xóa sạch toàn bộ dữ liệu mẫu (Học sinh mẫu, Lớp mẫu, BVN mẫu, Bài nộp mẫu, Từ vựng mẫu, Bài luyện tập cuối buổi mẫu, Kết quả & File ghi âm/video test) để bắt đầu vận hành lớp học thật:

### Cách 1: Chạy trực tiếp trên Google Sheets / Apps Script (`xoaToanBoDuLieu`, `xoaTrangHoanToan`, `clearAllData`)
- **Từ thanh menu Google Sheets (Khuyên dùng)**: Tải lại trang Google Sheets, bấm menu **`StudySnap Quản trị`** trên thanh công cụ -> chọn **`Xóa toàn bộ dữ liệu test (Giữ GV)`** (hoặc **`Xóa TRẮNG toàn bộ 100% (Kể cả GV)`** nếu muốn xóa trắng cả bảng `Teachers`).
- **Từ trình soạn thảo Apps Script (`Code.gs`)**:
  1. Mở **Tiện ích mở rộng -> Apps Script** gắn với file Google Sheets của bạn.
  2. Đảm bảo bạn đã dán phiên bản mới nhất của file [`backend/Code.gs`](./Code.gs) và nhấn **`Ctrl + S`** để lưu (sau đó Deploy lại Web App phiên bản mới nếu cập nhật code).
  3. Trên thanh công cụ phía trên (bên cạnh nút **Chạy / Run**), chọn **`xoaToanBoDuLieu`** (tương đương **`clearAllData`** — giữ lại tài khoản Giáo viên) hoặc **`xoaTrangHoanToan`** (`clearAllDataCompletely` — xóa trắng 100% cả 8 sheet kể cả `Teachers`).
  4. Nhấn nút **Chạy (Run)**. Toàn bộ dữ liệu từ dòng thứ 2 trở đi trong các sheet tương ứng (`Students`, `Assignments`, `Submissions`, `ExitTickets`, `Vocabulary`, `PracticeExercises`, `PracticeSubmissions`, và `Teachers` nếu chọn xóa trắng 100%) cùng các file trong thư mục `StudySnap_Media_Uploads` sẽ được xóa sạch; riêng dòng tiêu đề cột (Row 1) vẫn được giữ nguyên.

### Cách 2: Bấm nút trực tiếp trên giao diện Giáo viên (`teacher.html`)
1. Đăng nhập tài khoản Giáo viên vào [`teacher.html`](../teacher.html).
2. Chọn **Tab 4: `4. Quản Lý Lớp & Học Sinh`** và cuộn xuống mục **`Quản Trị & Làm Sạch Dữ Liệu Hệ Thống`**.
3. Bấm nút **`Xóa toàn bộ dữ liệu test`** và xác nhận.
4. Hệ thống sẽ đồng thời xóa sạch bộ nhớ đệm trên trình duyệt (`localStorage`) và gửi lệnh `clearAllData` lên Google Sheets & Drive (giữ nguyên tài khoản Giáo viên) để toàn bộ dữ liệu từ thời điểm đó trở đi đều là dữ liệu thật 100%.


