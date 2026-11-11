# StudySnap — Nền Tảng BVN Đa Phương Tiện, Luyện Tập Cuối Giờ & Ôn Từ Vựng Tương Tác

**StudySnap** là nền tảng học tập tương tác tách biệt rõ theo từng vai trò (**Giáo viên** và **Học sinh**), được thiết kế để vận hành với **chi phí 0đ** trên kiến trúc **Cloudflare Pages + Google Apps Script + Google Sheets / Google Drive**.

---

## 1. Kiến Trúc Tách Trang Theo Vai Trò (Multi-Page Role Architecture)

Thay vì gộp chung mọi thứ vào 1 trang duy nhất, StudySnap tách thành **3 trang chuyên biệt** với hệ thống xác thực và phân quyền riêng (`js/auth.js`):

1. **Cổng Đăng Nhập (`index.html` + `js/login.js`)**:
   - Đăng nhập phân luồng theo vai trò **Học sinh** hoặc **Giáo viên**.
   - Sau khi xác thực thành công:
     - Tài khoản **Giáo viên** tự động chuyển hướng sang `teacher.html`.
     - Tài khoản **Học sinh** tự động chuyển hướng sang `student.html`.
   - Danh sách đăng nhập nhanh (Quick Demo Login) tự động cập nhật ngay khi Giáo viên tạo thêm tài khoản Học sinh mới.

2. **Không Gian Quản Lý & Chấm Bài Của Giáo Viên (`teacher.html` + `js/teacher.js`)**:
   - **Chấm BVN & Bảng Tổng Hợp Tự Động**:
     - Nghe bài thu âm / xem video BVN của từng học sinh, chấm điểm (thang 10), ghi nhận xét văn bản và **thu âm phản hồi giọng nói (Voice Feedback)** trực tiếp trên trình duyệt.
     - Giao thêm Bài tập về nhà mới cho cả lớp.
     - **Bảng tự động tổng hợp tiến độ & ý kiến giáo viên**: Hiển thị ma trận học sinh × bài tập, làm nổi bật bạn nào chưa làm (`Chưa làm`), bạn nào chờ chấm (`Chờ chấm`), kèm điểm số và nguyên văn nhận xét + nhãn Voice Feedback của giáo viên ngay trong từng ô. Hỗ trợ lọc nhanh những bạn chưa làm bài và xuất CSV.
   - **Tạo & Quản Lý Tài Khoản Học Sinh**:
     - Giáo viên tạo tài khoản mới cho học sinh (`Họ và tên`, `Tên đăng nhập`, `Mật khẩu`, `Lớp học`, `Mục tiêu đầu ra`).
     - Có nút tạo mật khẩu ngẫu nhiên, sao chép nhanh thông tin đăng nhập để gửi qua Zalo/Messenger cho học sinh, hoặc đặt lại mật khẩu khi học sinh quên.
   - **Quản Lý Từ Vựng & Kết Quả Cuối Giờ**:
     - Thêm từ vựng mới vào từng bài học (`Bài 1`, `Bài 2`, `Bài 3`, `Bài 4`...) và theo dõi kết quả làm bài luyện tập cuối giờ của cả lớp.

3. **Không Gian Học Tập Cá Nhân Của Học Sinh (`student.html` + `js/student.js`)**:
   - Cá nhân hóa 100% theo tài khoản học sinh đang đăng nhập (không hiển thị công cụ chấm bài hay danh sách tài khoản của học sinh khác).
   - **Bài Tập Về Nhà Của Em**:
     - Chọn bài tập, thu âm trực tiếp trên trình duyệt hoặc tải file Audio/Video lên hệ thống.
     - Xem điểm số, đọc nhận xét chi tiết và **bấm nghe trực tiếp phản hồi giọng nói (Voice Feedback) của giáo viên**.
     - Xem bảng tổng hợp tiến độ và ý kiến giáo viên của riêng bản thân qua từng bài.
   - **Bài Luyện Tập Cuối Giờ (Exit Ticket)**:
     - Trắc nghiệm tương tác thay thế Google Forms nhàm chán, có phát âm từ khóa, giải thích đáp án tức thì và tự động lưu kết quả theo tài khoản học sinh.
   - **Web Ôn Từ Vựng Theo Bài & Tổng Hợp**:
     - Bấm vào **`Bài 1`**, **`Bài 2`**, **`Bài 3`** để ôn từ vựng của riêng từng bài.
     - Bấm **`Tổng hợp tất cả các bài`** để gộp toàn bộ từ vựng cuối khóa vào bộ thẻ lật 3D Flashcard và danh sách ôn tập.

---

## 2. Tài Khoản Dùng Thử Mặc Định

| Vai trò | Tên đăng nhập | Mật khẩu | Trang đích sau đăng nhập |
| :--- | :--- | :--- | :--- |
| **Giáo viên** | `gv_minh` | `123456` | `teacher.html` |
| **Học sinh 1** | `hs01` | `123456` | `student.html` (Nguyễn Minh Anh) |
| **Học sinh 2** | `hs02` | `123456` | `student.html` (Trần Hoàng Nam) |
| **Học sinh 3** | `hs03` | `123456` | `student.html` (Lê Thảo Nguyên) |
| **Học sinh 4** | `hs04` | `123456` | `student.html` (Phạm Gia Huy) |

*(Giáo viên có thể đăng nhập vào `teacher.html` -> mở tab **Tạo & Quản lý TK Học sinh** để tạo thêm tài khoản mới bất kỳ lúc nào).*

---

## 3. Cấu Trúc Thư Mục

```text
study-snap/
├── index.html                  # Cổng đăng nhập Giáo viên & Học sinh
├── teacher.html                # Không gian làm việc dành riêng cho Giáo viên
├── student.html                # Không gian học tập dành riêng cho Học sinh
├── _headers                    # Cấu hình bảo mật & cache cho Cloudflare Pages
├── styles/
│   └── main.css                # Hệ thống giao diện chuẩn DESIGN.md (Education Teal & Achievement Orange)
├── js/
│   ├── data.js                 # Dữ liệu khởi tạo, LocalStorage Store & Google Apps Script Sync
│   ├── auth.js                 # Xác thực đăng nhập, quản lý phiên & bảo vệ route theo vai trò
│   ├── audio.js                # MediaRecorder thu âm giọng nói, đọc file Audio/Video & phát âm TTS
│   ├── login.js                # Logic trang đăng nhập (index.html)
│   ├── teacher.js              # Logic trang Giáo viên (teacher.html)
│   └── student.js              # Logic trang Học sinh (student.html)
├── backend/
│   ├── Code.gs                        # Mã nguồn Google Apps Script kết nối Google Sheets & Google Drive
│   └── HUONG_DAN_CAI_DAT_BACKEND.md   # Hướng dẫn chi tiết từng bước cài đặt Code.gs & Deploy Web App URL
├── AGENTS.md                          # Quy trình phối hợp 2 skill UI UX Pro Max & Impeccable
├── PRODUCT.md                  # Ngữ cảnh sản phẩm & kiến trúc kỹ thuật
└── DESIGN.md                   # Hệ thống thiết kế chuẩn hóa
```
