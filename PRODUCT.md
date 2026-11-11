# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

- **Frontend & Hosting**: Web App (HTML5 / Tailwind CSS / Modern JS hoặc Vite SPA) triển khai trên **Cloudflare Pages** để tối ưu tốc độ tải trang toàn cầu và miễn phí băng thông.
- **Backend API**: **Google Apps Script (GAS)** triển khai dưới dạng Web App (`doGet` / `doPost`), xử lý toàn bộ nghiệp vụ API và lưu trữ file ghi âm/video của học sinh cùng file ghi âm phản hồi của giáo viên lên **Google Drive**.
- **Database**: **Google Sheets** đóng vai trò cơ sở dữ liệu trung tâm để tối ưu chi phí vận hành về **0đ**, dễ dàng quản lý, sao lưu và kiểm tra dữ liệu trực tiếp khi cần.

## Users

1. **Học sinh (Students)**:
   - **Ngữ cảnh sử dụng**: Truy cập chủ yếu trên điện thoại di động hoặc máy tính cá nhân sau giờ học (để nộp BVN và ôn từ vựng) và ngay tại lớp vào cuối buổi học (để làm bài luyện tập cuối giờ).
   - **Nhu cầu cốt lõi**:
     - Nộp bài tập về nhà nhanh gọn, tải lên file ghi âm/video hoặc thu âm trực tiếp dễ dàng, xem/nghe lại phản hồi chữa bài của giáo viên ngay tại bài nộp.
     - Làm bài luyện tập cuối giờ trong một giao diện tương tác thú vị, trực quan (thay vì giao diện biểu mẫu Google Forms đơn điệu, nhàm chán).
     - Ôn luyện từ vựng linh hoạt: muốn ôn bài nào (`Bài 1`, `Bài 2`, ...) chỉ cần bấm vào bài đó là hiển thị ngay; cuối khóa muốn ôn lại toàn bộ chỉ cần bấm nút **"Tổng hợp"** là gom tất cả từ vựng của các bài ra ngay lập tức.
2. **Giáo viên (Teacher)**:
   - **Ngữ cảnh sử dụng**: Truy cập trên máy tính bảng, laptop hoặc điện thoại để kiểm tra tiến độ lớp học, nghe/xem bài nộp của học sinh và chấm chữa bài hàng ngày.
   - **Nhu cầu cốt lõi**:
     - Chữa bài trực tiếp ngay trên nền tảng sau khi học sinh nộp bài, nghe/xem file ghi âm hoặc video của học sinh và gửi phản hồi tức thì bằng **văn bản (text)** hoặc **ghi âm giọng nói trực tiếp (voice feedback)**.
     - Nắm bắt toàn cảnh tiến độ lớp học thông qua **Bảng tự động tổng hợp (Auto-Aggregated Progress Matrix)**: biết ngay bài nào có bạn nào đã làm hay chưa làm, đồng thời **ý kiến nhận xét/chữa bài của giáo viên trong từng bài cũng tự động hiển thị luôn trong bảng tổng hợp đó**.

## Product Purpose

**StudySnap** là nền tảng học tập tương tác "tất cả trong một" giúp số hóa quy trình giao – nộp – chữa bài tập về nhà đa phương tiện (âm thanh/video + phản hồi giọng nói), kiểm tra mức độ hiểu bài cuối giờ và ôn tập từ vựng theo từng bài học hoặc tổng hợp toàn khóa.

**Thước đo thành công**:
1. Học sinh hào hứng làm bài luyện tập cuối giờ và ôn từ vựng mỗi ngày nhờ trải nghiệm tương tác sinh động, không còn cảm giác khô khan như làm Google Forms.
2. Giáo viên tiết kiệm tối đa thời gian chấm bài và quản lý lớp nhờ khả năng phản hồi bằng giọng nói (voice feedback) ngay trên bài nộp và bảng tổng hợp tự động cập nhật cả trạng thái làm bài lẫn nhận xét chi tiết của từng bài.
3. Chi phí vận hành hạ tầng bằng **0đ** nhờ tận dụng tối đa hệ sinh thái **Cloudflare + Google Apps Script + Google Sheets / Google Drive**.

## Positioning

Khác với Google Forms (đơn điệu, một chiều, không hỗ trợ luồng chữa bài tương tác bằng voice tại chỗ) hay các hệ thống LMS cồng kềnh tốn phí hàng tháng, **StudySnap** kết hợp trải nghiệm học tập gamified sinh động với không gian chấm bài – phản hồi giọng nói tức thì và bảng ma trận tổng hợp tiến độ + nhận xét tự động, vận hành hoàn toàn trên nền tảng Serverless miễn phí (Cloudflare + Google Apps Script + Google Sheets).

## Operating Context

Hệ thống được tách thành **3 trang độc lập theo vai trò (Role-Based Multi-Page Architecture)** thay vì dồn chung trên một trang duy nhất:
- **[`index.html`](index.html) (Cổng Đăng Nhập Hệ Thống — Login Portal)**: Xác thực tài khoản Giáo viên và Học sinh, hỗ trợ nút ẩn/hiện mật khẩu, ghi nhớ phiên đăng nhập và tự động điều hướng về đúng không gian làm việc của từng vai trò.
- **[`teacher.html`](teacher.html) (Không Gian Dành Riêng Cho Giáo Viên)**:
  - **Chấm chữa BVN & Phản hồi Voice + Bảng Tự Động Tổng Hợp**: Xem ma trận toàn lớp (ai đã làm / chưa làm), nghe bài nộp của học sinh, chấm điểm, nhận xét bằng chữ và thu âm phản hồi giọng nói (Voice Feedback), giao bài tập mới.
  - **Quản lý & Tạo Tài Khoản Cho Học Sinh**: Giáo viên trực tiếp tạo tài khoản mới cho học sinh (Họ tên, Lớp, Tên đăng nhập, Mật khẩu khởi tạo), sao chép thông tin đăng nhập gửi cho học sinh, đặt lại mật khẩu (Reset password) hoặc xóa tài khoản. Học sinh vừa tạo sẽ tự động xuất hiện trong Bảng tổng hợp tiến độ.
  - **Quản lý Kho Từ Vựng & Bài Luyện Tập Cuối Giờ**: Thêm từ vựng mới theo từng bài học (`Bài 1`, `Bài 2`, `Bài 3`...), tạo câu hỏi cuối giờ mới và theo dõi bảng điểm hiểu bài cuối giờ của cả lớp.
  - **Cấu hình kết nối Google Apps Script & Google Sheets**: Dán Web App URL và khởi tạo cấu trúc bảng trên Google Sheets.
- **[`student.html`](student.html) (Không Gian Học Tập Cá Nhân Hóa Của Học Sinh)**:
  - Tự động nhận diện đúng tài khoản học sinh đang đăng nhập (không cần chọn tên thủ công).
  - **Nộp BVN Đa Phương Tiện & Nghe Giáo Viên Chữa Bài**: Tải lên file ghi âm/video hoặc thu âm trực tiếp trên trình duyệt, xem trạng thái bài làm của mình, đọc nhận xét và nghe phản hồi giọng nói (Voice Feedback) của giáo viên, đồng thời xem bảng tiến độ học tập.
  - **Bài Luyện Tập Cuối Giờ (Interactive Exit Ticket)**: Trả lời câu hỏi tương tác cuối giờ dưới tên tài khoản của mình.
  - **Web Ôn Từ Vựng Theo Bài (`Bài 1`, `Bài 2`, ...) & Nút `"Tổng hợp"` Cuối Khóa**: Bấm vào từng bài để ôn riêng bài đó hoặc bấm **"Tổng hợp tất cả các bài"** để ôn tập toàn khóa, đánh dấu từ đã thuộc theo tiến độ cá nhân.

Dự án bao gồm **3 phân hệ chức năng cốt lõi (Core Modules)** hoạt động đồng bộ trên cùng một cơ sở dữ liệu Google Sheets:

### 1. Phân hệ BVN Đa Phương Tiện, Chữa Bài Trực Tiếp & Bảng Tổng Hợp Tự Động
- **Luồng Học sinh nộp BVN**:
  - Học sinh chọn bài tập, nhập nội dung làm bài và **tải lên file ghi âm (audio) / video** từ thiết bị hoặc **thu âm trực tiếp** trên trình duyệt.
  - Sau khi nộp, học sinh theo dõi trạng thái bài làm (`Chờ chữa` -> `Đã chữa`) và nghe/xem trực tiếp phần sửa bài của giáo viên ngay trên trang bài tập đó.
- **Luồng Giáo viên chữa bài & Phản hồi Voice**:
  - Giáo viên mở bài nộp của học sinh, xem/nghe trực tiếp file ghi âm/video không cần tải về máy.
  - Giáo viên chấm chữa ngay trên đó: nhập nhận xét chi tiết bằng văn bản **và/hoặc bấm nút thu âm để phản hồi trực tiếp bằng giọng nói (Voice Feedback)** giúp sửa phát âm, ngữ điệu nhanh và truyền cảm hơn gõ chữ.
- **Bảng Tự Động Tổng Hợp Tiến Độ & Ý Kiến Giáo Viên (Auto-Aggregated Progress & Feedback Table)**:
  - Ma trận tự động tổng hợp theo **Học sinh × Bài tập**:
    - Tự động đánh dấu trực quan bạn nào **Đã làm / Đã chữa**, bạn nào **Chưa làm** ở từng bài tập (hỗ trợ lọc nhanh danh sách học sinh chưa làm bài để nhắc nhở).
    - **Hiển thị trực tiếp ý kiến nhận xét của giáo viên (cả tóm tắt text và nút phát nhanh voice feedback) ngay trong từng ô của bảng tổng hợp**, giúp giáo viên và học sinh nhìn vào bảng là nắm được toàn bộ lịch sử tiến độ và đánh giá qua từng bài.

### 2. Phân hệ Bài Luyện Tập Cuối Giờ (Interactive Exit Ticket)
- Thay thế hoàn toàn Google Forms bằng giao diện kiểm tra nhanh cuối giờ học giàu tính tương tác:
  - Hỗ trợ đa dạng câu hỏi: Trắc nghiệm tương tác (Multiple Choice), Ghép thẻ (Matching), Điền từ nhanh (Fill-in-the-blank), Nghe âm thanh chọn đáp án.
  - Hiển thị tiến độ từng câu, phản hồi đúng/sai tức thì kèm giải thích ngắn gọn và bảng tổng kết mức độ hiểu bài của cả lớp ngay khi kết thúc giờ học.

### 3. Phân hệ Web Ôn Từ Vựng Theo Bài & Tổng Hợp Cuối Khóa
- **Chia theo từng bài học riêng biệt (`Bài 1`, `Bài 2`, `Bài 3`...)**:
  - Giao diện danh sách bài học trực quan: Học sinh muốn ôn từ vựng bài nào chỉ cần **bấm vào Bài 1 là ra ngay bộ từ vựng Bài 1**, **bấm vào Bài 2 là ra ngay bộ từ vựng Bài 2**.
- **Chế độ "Tổng hợp" (Master Vocabulary Review)**:
  - Nút **"Tổng hợp"** nổi bật cho phép học sinh ôn tập cuối khóa hoặc ôn tập diện rộng: khi bấm vào **"Tổng hợp"**, hệ thống tự động gộp tất cả từ vựng của mọi bài học đã qua để học sinh lật thẻ Flashcard, nghe phát âm hoặc làm bài trắc nghiệm tổng hợp ngẫu nhiên.

## Capabilities and Constraints

- **Ràng buộc Hạ tầng & Chi phí**:
  - Không sử dụng server trả phí. Toàn bộ dữ liệu cấu trúc lưu trên **Google Sheets**; toàn bộ file media (audio/video học sinh nộp và voice feedback của giáo viên) lưu trên **Google Drive** thông qua **Google Apps Script**.
  - Frontend tĩnh host trên **Cloudflare Pages**, giao tiếp với Google Apps Script qua HTTPS JSON API (`text/plain;charset=utf-8` khi `POST` để tránh lỗi CORS preflight của GAS).
- **Trải nghiệm tốc độ cao (Zero-Friction UX)**:
  - Vì Google Apps Script có độ trễ khởi động (1–3 giây), giao diện phải áp dụng bộ nhớ đệm cục bộ (`localStorage` / `IndexedDB` + Stale-While-Revalidate) cho kho từ vựng và danh sách bài học để thao tác chuyển giữa `Bài 1`, `Bài 2` và `Tổng hợp` diễn ra tức thì (0ms delay).
  - Hỗ trợ nén/kiểm soát dung lượng file ghi âm & video trước khi tải lên và hiển thị thanh tiến trình tải lên rõ ràng.

## Brand Commitments

> **Quy tắc phối hợp từ [`AGENTS.md`](AGENTS.md)**: **UI UX Pro Max** chịu trách nhiệm lựa chọn Phong cách, Màu sắc và Phông chữ; **Impeccable** chịu trách nhiệm làm đẹp chi tiết và kiểm định chất lượng giao diện.

### 1. Phong cách Thiết kế (Selected by UI UX Pro Max)
- **Không gian Học sinh (Ôn từ vựng, Bài luyện tập cuối giờ, Nộp BVN)**:
  - **Phong cách chủ đạo**: **Claymorphism + Micro-interactions** kết hợp **Vibrant & Block-based**.
  - **Đặc trưng thị giác**: Các thẻ bài học và nút bấm có độ nổi khối mềm mại (Soft 3D tactile feel), bo góc thân thiện (`16px–24px`), viền rõ ràng (`2px–3px`), bóng đổ hai lớp tự nhiên và hiệu ứng nhấn đàn hồi (`200ms cubic-bezier(0.34, 1.56, 0.64, 1)`). Mang lại cảm giác học mà chơi, sinh động và cuốn hút.
- **Không gian Giáo viên (Chấm chữa bài & Bảng tự động tổng hợp tiến độ)**:
  - **Phong cách chủ đạo**: **Bento Box Grid + Clean Accessible Dashboard** (chế độ `Operate` của Impeccable).
  - **Đặc trưng thị giác**: Bố cục thẻ Bento gọn gàng, bảng tổng hợp dữ liệu rõ ràng với cột tên học sinh cố định (sticky), nhãn trạng thái phân biệt bằng cả màu sắc lẫn biểu tượng SVG, trình phát audio/video và thanh công cụ ghi âm phản hồi giọng nói đặt ngay trong tầm tay.

### 2. Bảng Màu Hệ Thống (Color Palette by UI UX Pro Max)
- **Primary (Education Teal — Màu chủ đạo)**: `#0D9488` (`--color-primary`) | Chữ trên nền Primary: `#FFFFFF` (`--color-on-primary`, đảm bảo tương phản WCAG AA).
- **Secondary (Fresh Mint — Màu bổ trợ & Tiến độ)**: `#2DD4BF` (`--color-secondary`) | Chữ trên nền Secondary: `#0F172A` (`--color-on-secondary`).
- **Accent / CTA (Achievement Orange — Nút hành động chính & Huy hiệu)**: `#EA580C` (`--color-accent`) | Chữ trên nền Accent: `#FFFFFF` (`--color-on-accent`).
- **Background & Surfaces**:
  - Nền trang chính: `#F0FDFA` (`--color-background`, xanh bạc hà cực dịu mắt khi học lâu).
  - Bề mặt thẻ (Card / Table Surface): `#FFFFFF` (`--color-card`).
  - Bề mặt phụ (Muted Surface): `#E8F1F4` (`--color-muted`).
- **Typography & Borders**:
  - Chữ chính (Foreground): `#134E4A` (`--color-foreground`, Deep Teal-Ink — dùng mực cùng tông chủ đạo thay vì đen/xám thuần).
  - Chữ phụ (Muted Foreground): `#475569` (`--color-muted-foreground`, tỷ lệ tương phản ≥ 4.5:1).
  - Đường viền (Border): `#5EEAD4` / `#CBD5E1` (`--color-border`) | Focus Ring: `#0D9488` (`--color-ring`).
- **Màu trạng thái ngữ nghĩa (Semantic Status — dùng cho Bảng tổng hợp BVN & Bài luyện tập cuối giờ)**:
  - **Hoàn thành / Đã chữa / Đúng (Success)**: `#16A34A` (Nền badge: `#DCFCE7`, Chữ: `#14532D`).
  - **Chờ chữa / Cần chú ý (Warning)**: `#D97706` (Nền badge: `#FEF3C7`, Chữ: `#78350F`).
  - **Chưa làm / Quá hạn / Sai (Destructive)**: `#DC2626` (Nền badge: `#FEE2E2`, Chữ: `#7F1D1D`).

### 3. Phông Chữ (Typography by UI UX Pro Max — Tối ưu Tiếng Việt)
- **Heading / Display Font**: **`Nunito`** (`700 Bold`, `800 ExtraBold`, `900 Black`) — Đầu chữ bo tròn thân thiện, giàu năng lượng, hiển thị dấu Tiếng Việt đẹp mắt cho tiêu đề bài học, nút bấm `Bài 1`, `Bài 2`, `Tổng hợp` và thẻ Flashcard.
- **Body / UI & Table Font**: **`Plus Jakarta Sans`** (kèm fallback **`Be Vietnam Pro`**, weights `400`, `500`, `600`, `700`) — Phông chữ hiện đại, rõ nét tuyệt đối ở kích thước nhỏ, lý tưởng cho bảng tổng hợp tiến độ, nhận xét chi tiết của giáo viên và nghĩa từ vựng.
- **Monospace / IPA & Timer Font**: **`JetBrains Mono`** (`500 Medium`) — Dùng cho phiên âm quốc tế (IPA), bộ đếm thời gian làm bài cuối giờ và thời lượng bản thu âm/video (`tabular-nums`).

### 4. Cam kết Làm đẹp & Kiểm định Chất lượng (Enforced by Impeccable)
- **Tuyệt đối tránh**: Màu tím-xanh AI đại trà (purple-to-blue gradients), dùng emoji làm icon hệ thống, thẻ lồng trong thẻ rườm rà, hoặc giao diện biểu mẫu nhạt nhẽo kiểu Google Forms.
- **Làm đẹp chi tiết (`polish`, `delight`, `animate`)**: Mọi nút bấm chọn bài, lật thẻ từ vựng, nộp bài và ghi âm phản hồi đều có phản hồi thị giác tức thì; trình phát voice feedback có thanh tiến trình âm thanh trực quan.
- **Kiểm định nghiêm ngặt (`audit`, `harden`, `detect`)**: Mọi màn hình phải vượt qua bộ quét `.agent/skills/impeccable/scripts/impeccable.cmd detect` trước khi hoàn thành.

## Evidence on Hand

- Quy trình phối hợp 2 skill được định nghĩa tại [`AGENTS.md`](AGENTS.md).
- Hệ thống token thiết kế chi tiết được lưu tại [`DESIGN.md`](DESIGN.md) và [`design-system/studysnap/MASTER.md`](design-system/studysnap/MASTER.md).
- Dự án đang ở giai đoạn khởi tạo (greenfield); không bịa đặt số liệu học sinh ảo hoặc đánh giá giả mạo trong giao diện chính thức (chỉ sử dụng dữ liệu mẫu minh họa rõ ràng khi chạy chế độ demo/khởi tạo Google Sheets).

## Product Principles

1. **Chữa bài tại chỗ, phản hồi bằng giọng nói tức thì (In-Place Multimedia & Voice Feedback)**: Học sinh nộp bài (kèm audio/video) và giáo viên chấm chữa (bằng text hoặc voice) diễn ra liền mạch ngay trên cùng một không gian, không phải tải file thủ công hay chuyển đổi qua lại giữa nhiều ứng dụng.
2. **Nhìn một bảng, nắm trọn lớp học (Single-Glance Progress & Feedback Matrix)**: Bảng tổng hợp tự động không chỉ báo ai đã làm hay chưa làm mà còn hiển thị luôn nhận xét và phản hồi giọng nói của giáo viên trong từng bài.
3. **Học tập là niềm vui, không phải điền biểu mẫu (Playful Learning Over Form-Filling)**: Bài luyện tập cuối giờ và web ôn từ vựng phải mang lại cảm giác tương tác tức thì, sinh động, chạm là phản hồi ngay.
4. **Một chạm tới đúng bài học (One-Tap Lesson & Master Review)**: Muốn ôn Bài 1 bấm Bài 1, muốn ôn Bài 2 bấm Bài 2, cuối khóa bấm "Tổng hợp" là có ngay toàn bộ kho từ vựng mà không cần tìm kiếm phức tạp.
5. **Tối ưu chi phí vận hành tuyệt đối (Zero-Cost Serverless Architecture)**: Tận dụng thông minh Cloudflare Pages, Google Apps Script và Google Sheets để hệ thống chạy bền bỉ, nhanh và hoàn toàn miễn phí.

## Accessibility & Inclusion

- Chuẩn tương phản tối thiểu **WCAG 2.1 AA** (≥ 4.5:1 cho văn bản thường, ≥ 3:1 cho tiêu đề lớn và thành phần UI).
- Không dùng màu sắc đơn thuần để phân biệt trạng thái làm bài (luôn đi kèm nhãn chữ Tiếng Việt rõ ràng và biểu tượng SVG như Đã nộp / Chưa làm / Đã chữa).
- Vùng chạm (Touch targets) tối thiểu `44×44px` trên điện thoại cho học sinh thao tác bấm chọn đáp án, lật thẻ từ vựng và bấm nút ghi âm.
- Tôn trọng cấu hình `prefers-reduced-motion` và hỗ trợ điều hướng bàn phím đầy đủ (ví dụ: dùng phím `Space` / `Arrow` để lật và chuyển thẻ từ vựng).

