# Hướng Dẫn Phối Hợp Agent & Skills Cho Dự Án StudySnap (`AGENTS.md`)

Tài liệu này quy định quy trình làm việc chuẩn cho mọi AI Agent tham gia phát triển dự án **StudySnap** — nền tảng làm Bài tập về nhà (BVN) đa phương tiện, Bài luyện tập cuối giờ và Web ôn từ vựng tương tác trên nền tảng **Cloudflare Pages + Google Apps Script + Google Sheets**.

---

## 1. Các Skill Đã Cài Đặt Trong Dự Án

Dự án đã được tích hợp sẵn 2 bộ kỹ năng chuyên sâu về thiết kế và kiểm định giao diện tại thư mục `.agent/skills/`:

1. **UI UX Pro Max** ([`.agent/skills/ui-ux-pro-max/SKILL.md`](.agent/skills/ui-ux-pro-max/SKILL.md))
   - **Công cụ**: `.agent/skills/ui-ux-pro-max/scripts/search.py` (yêu cầu Python 3).
   - **Vai trò cốt lõi**: **Kiến trúc sư Hệ thống Thiết kế (Design Intelligence & System Generator)** — chịu trách nhiệm nghiên cứu, lựa chọn **Phong cách (Style)**, **Bảng màu (Color Palette)**, **Phông chữ (Typography)**, bố cục trang (Layout Patterns) và khởi tạo bộ quy tắc thiết kế gốc tại [`design-system/studysnap/MASTER.md`](design-system/studysnap/MASTER.md).
2. **Impeccable** ([`.agent/skills/impeccable/SKILL.md`](.agent/skills/impeccable/SKILL.md))
   - **Công cụ**: `.agent/skills/impeccable/scripts/impeccable.cmd` và hệ thống playbook trong `.agent/skills/impeccable/reference/`.
   - **Vai trò cốt lõi**: **Giám đốc Sáng tạo & Kiểm định Chất lượng (Design Director, Polisher & Slop Detector)** — chịu trách nhiệm quản lý ngữ cảnh sản phẩm ([`PRODUCT.md`](PRODUCT.md), [`DESIGN.md`](DESIGN.md)), **làm đẹp giao diện (Polish / Refine / Enhance)** và **kiểm tra chất lượng giao diện (Critique / Audit / Harden / Detect)** trước khi bàn giao.

---

## 2. Phân Công Nhiệm Vụ Giữa 2 Skill (Nguyên Tắc Bắt Buộc)

Để tránh xung đột giữa 2 skill và phát huy tối đa thế mạnh của từng công cụ, Agent **BẮT BUỘC** tuân thủ phân công sau:

| Hạng mục công việc | Skill phụ trách chính | Cách thức thực hiện & Lệnh sử dụng |
| :--- | :--- | :--- |
| **1. Ngữ cảnh & Chân lý Sản phẩm** | **Impeccable** + **UI UX Pro Max** | Cập nhật và đọc [`PRODUCT.md`](PRODUCT.md) làm nguồn sự thật duy nhất về người dùng, tính năng, ràng buộc kỹ thuật và định hướng thiết kế. |
| **2. Chọn Phong cách (Style), Màu sắc (Color), Phông chữ (Typography)** | **UI UX Pro Max** | Chạy `python ".agent/skills/ui-ux-pro-max/scripts/search.py"` với `--design-system`, `--domain style`, `--domain color`, `--domain typography` để chọn hệ thống thị giác phù hợp với EdTech, lưu vào [`design-system/studysnap/MASTER.md`](design-system/studysnap/MASTER.md) và đồng bộ sang [`PRODUCT.md`](PRODUCT.md) & [`DESIGN.md`](DESIGN.md). |
| **3. Lập kế hoạch UX cho tính năng mới** | **Impeccable** (`shape`) + **UI UX Pro Max** (`--domain ux`) | Dùng playbook [`shape.md`](.agent/skills/impeccable/reference/shape.md) của Impeccable kết hợp tra cứu UX guidelines từ UI UX Pro Max để thiết kế luồng tương tác. |
| **4. Làm đẹp & Tinh chỉnh Giao diện (Beautify & Refine)** | **Impeccable** | Sử dụng các playbook làm đẹp của Impeccable:<br>• `bolder` / `delight`: Tăng sức sống, gamification cho bài luyện tập cuối giờ và thẻ từ vựng.<br>• `layout` & `typeset`: Căn chỉnh nhịp điệu khoảng cách, phân cấp chữ Tiếng Việt.<br>• `animate`: Bổ sung micro-interactions mượt mà (lật thẻ flashcard, sóng âm ghi âm).<br>• `clarify` & `onboard`: Tối ưu câu chữ hướng dẫn học sinh/giáo viên và trạng thái trống (empty states).<br>• `polish`: Chuốt lại toàn bộ chi tiết giao diện trước khi hoàn tất. |
| **5. Kiểm tra Chất lượng & Chặn "AI Slop" (QA & Audit)** | **Impeccable** | Sử dụng bộ công cụ kiểm định của Impeccable:<br>• Đọc [`craft-floor.md`](.agent/skills/impeccable/reference/craft-floor.md) trước mọi chỉnh sửa UI.<br>• Chạy `.agent/skills/impeccable/scripts/impeccable.cmd detect --json <target>` để quét tự động 62 quy tắc bắt lỗi giao diện.<br>• Thực hiện `critique` (đánh giá heuristic UX), `audit` (kiểm tra tương phản WCAG AA ≥ 4.5:1, keyboard focus, hiệu năng), `harden` (xử lý lỗi mạng, file ghi âm/video nặng, tên học sinh dài, tràn chữ Tiếng Việt), và `adapt` (responsive trên mobile 375px & desktop 1440px). |

---

## 3. Quy Trình 5 Bước Khi Phát Triển Giao Diện StudySnap

Mỗi khi tạo mới hoặc cập nhật bất kỳ màn hình/tính năng nào của dự án, Agent phải thực hiện tuần tự 5 bước sau:

### Bước 1: Nạp Ngữ Cảnh Sản Phẩm (`Impeccable Context`)
1. Đọc [`PRODUCT.md`](PRODUCT.md), [`DESIGN.md`](DESIGN.md) và [`design-system/studysnap/MASTER.md`](design-system/studysnap/MASTER.md).
2. Chạy lệnh khởi tạo phiên của Impeccable (chỉ chạy 1 lần mỗi phiên):
   ```powershell
   & ".agent/skills/impeccable/scripts/impeccable.cmd" context
   ```
3. Xác định **Mode** của màn hình theo Impeccable:
   - **Màn hình Học sinh (Nộp BVN, Bài luyện tập cuối giờ, Ôn từ vựng Bài 1, Bài 2... & Tổng hợp)**: Kết hợp giữa **Operate** (thao tác nộp bài/làm bài rõ ràng, dễ dùng trên điện thoại) và **Experience / Delight** (sinh động, truyền cảm hứng học tập, xóa bỏ cảm giác khô khan của Google Forms).
   - **Màn hình Giáo viên (Chấm bài, Phản hồi bằng Voice/Text, Bảng tự động tổng hợp tiến độ & nhận xét)**: Thuộc chế độ **Operate** — ưu tiên khả năng quét thông tin nhanh (scanability), mật độ hợp lý, thao tác nghe bài & ghi âm phản hồi ngay trên 1 màn hình.

### Bước 2: Tra Cứu Phong Cách, Màu Sắc, Phông Chữ (`UI UX Pro Max`)
1. Kiểm tra xem trang đang làm có file override tại `design-system/studysnap/pages/<page-name>.md` hay không. Nếu chưa có và cần hướng dẫn chuyên sâu cho thành phần mới, chạy:
   ```powershell
   # Tra cứu thiết kế tổng thể hoặc tạo override cho trang cụ thể
   python ".agent/skills/ui-ux-pro-max/scripts/search.py" "<từ khóa>" --design-system --persist -p "StudySnap" --page "<tên-trang>" --output-dir "."

   # Tra cứu UX / Component / Stack cụ thể
   python ".agent/skills/ui-ux-pro-max/scripts/search.py" "<từ khóa>" --domain ux
   python ".agent/skills/ui-ux-pro-max/scripts/search.py" "<từ khóa>" --stack html-tailwind
   ```
2. Tuân thủ nghiêm ngặt **Phong cách**, **Bảng màu** và **Phông chữ** đã được UI UX Pro Max lựa chọn và khóa trong [`PRODUCT.md`](PRODUCT.md) và [`DESIGN.md`](DESIGN.md).

### Bước 3: Xây Dựng Giao Diện Tuân Thủ Chuẩn Sàn (`Impeccable Craft Floor`)
Trước khi viết code UI, đọc [`.agent/skills/impeccable/reference/craft-floor.md`](.agent/skills/impeccable/reference/craft-floor.md) và áp dụng các quy tắc bất di bất dịch:
- **Không dùng Emoji làm icon hệ thống**: Sử dụng bộ SVG icon nhất quán (Lucide / Phosphor Icons).
- **Không dùng màu tím-xanh AI đại trà (AI Purple Slop)**: Sử dụng hệ màu **Education Teal (`#0D9488`) + Fresh Mint (`#2DD4BF`) + Achievement Orange (`#EA580C`)** trên nền **Soft Mint-White (`#F0FDFA`)** và chữ **Deep Teal-Ink (`#134E4A`)**.
- **Không dùng thẻ lồng trong thẻ (nested cards) vô nghĩa**, không đặt dòng chữ nhỏ vô thưởng vô phạt (kicker/eyebrow) phía trên mọi tiêu đề.
- **Tối ưu hiển thị Tiếng Việt**: Sử dụng phông chữ **`Nunito`** (Heading) và **`Plus Jakarta Sans` / `Be Vietnam Pro`** (Body & Bảng dữ liệu) để không bị lỗi dấu hoặc cắt dấu khi xuống dòng.

### Bước 4: Làm Đẹp Giao Diện (`Impeccable Refine & Enhance`)
Sau khi dựng xong khung chức năng, áp dụng các kỹ thuật làm đẹp của Impeccable:
- **Playbook [`delight.md`](.agent/skills/impeccable/reference/delight.md) & [`animate.md`](.agent/skills/impeccable/reference/animate.md)**:
  - Tạo hiệu ứng nhấn nút đàn hồi nhẹ (`Claymorphism tactile button`) cho các thẻ chọn bài từ vựng (`Bài 1`, `Bài 2`, ..., `Tổng hợp`) và các câu hỏi luyện tập cuối giờ.
  - Tạo hiệu ứng sóng âm trực quan (waveform visualizer) khi học sinh thu âm/tải video BVN và khi giáo viên thu âm phản hồi (voice feedback).
- **Playbook [`layout.md`](.agent/skills/impeccable/reference/layout.md) & [`typeset.md`](.agent/skills/impeccable/reference/typeset.md)**:
  - Đảm bảo bảng tự động tổng hợp của giáo viên cố định cột tên học sinh (sticky column) và tiêu đề bài tập (sticky header), sử dụng `font-variant-numeric: tabular-nums` cho điểm số, tiến độ và thời lượng audio/video.
- **Playbook [`polish.md`](.agent/skills/impeccable/reference/polish.md)**:
  - Đồng bộ màu thanh cuộn (scrollbar), vùng bôi đen văn bản (`::selection`), focus ring (`#0D9488`) và trạng thái hover/active/disabled trên mọi phần tử tương tác.

### Bước 5: Kiểm Định Chất Lượng & Nghiệm Thu (`Impeccable Audit, Harden & Detect`)
Trước khi báo cáo hoàn thành bất kỳ giao diện nào:
1. **Chạy trình quét lỗi tự động của Impeccable**:
   ```powershell
   & ".agent/skills/impeccable/scripts/impeccable.cmd" detect --json <đường-dẫn-thư-mục-hoặc-file-UI>
   ```
   Xử lý triệt để mọi cảnh báo phát sinh (exit code phải bằng `0`).
2. **Kiểm định theo Playbook [`harden.md`](.agent/skills/impeccable/reference/harden.md) & [`audit.md`](.agent/skills/impeccable/reference/audit.md)**:
   - Kiểm tra độ tương phản chữ ≥ 4.5:1 (đặc biệt trên các nhãn trạng thái "Đã nộp", "Chưa làm", "Đã có phản hồi").
   - Kiểm tra các trạng thái biên (Edge Cases): Đang tải dữ liệu từ Google Apps Script (skeleton/loading state vì GAS có độ trễ cold-start 1–3 giây), tải lên file ghi âm/video dung lượng lớn (thanh tiến trình upload), mất kết nối mạng, học sinh chưa có quyền truy cập micro, hoặc bài từ vựng có giải thích dài.
   - Kiểm tra hiển thị đa màn hình (`375px` điện thoại của học sinh, `768px` máy tính bảng, `1024px–1440px` máy tính của giáo viên).

---

## 4. Nguyên Tắc Kiến Trúc Kỹ Thuật (Cloudflare + Google Apps Script + Google Sheets)

1. **Frontend (Host trên Cloudflare Pages)**:
   - Giao diện phản hồi tức thì (Optimistic UI & Local Caching với `localStorage` / `IndexedDB` cho danh sách từ vựng để học sinh bấm vào **Bài 1**, **Bài 2** hay **Tổng hợp** là mở ra ngay lập tức không phải chờ tải lại).
   - Xử lý thu âm giọng nói trên trình duyệt bằng `MediaRecorder API` (xuất định dạng nhẹ `audio/webm` hoặc `audio/mp4`, mã hóa Base64/Chunk để gửi qua Google Apps Script lưu vào Google Drive).
2. **Backend (Google Apps Script Web App)**:
   - Sử dụng `doGet(e)` và `doPost(e)` với `ContentService.createTextOutput(JSON.stringify(...)).setMimeType(ContentService.MimeType.JSON)`.
   - Khi gửi request `POST` từ trình duyệt sang Google Apps Script, sử dụng `Content-Type: text/plain;charset=utf-8` để tránh lỗi CORS preflight (`OPTIONS`) của Google Apps Script.
3. **Database (Google Sheets)**:
   - Tách thành các Sheet rõ ràng: `Students` (Học sinh), `Assignments` (Danh sách BVN), `Submissions` (Bài nộp + Link Audio/Video học sinh + Nhận xét Text & Link Voice của giáo viên), `ExitTickets` (Bài luyện tập cuối giờ & Kết quả), `Vocabulary` (Từ vựng phân theo `lesson_id`: Bài 1, Bài 2... để dễ dàng lọc theo từng bài hoặc gộp tất cả khi bấm **"Tổng hợp"**).

