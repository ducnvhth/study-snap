# Hướng Dẫn Sử Dụng StudySnap (Dành cho Giáo viên & Học sinh)

Tài liệu này hướng dẫn từng bước cách sử dụng các tính năng trên **StudySnap** cho cả hai vai trò **Giáo viên** (`teacher.html`) và **Học sinh** (`student.html`), từ đăng nhập đến soạn đề (bao gồm dạng bài Nghe hiểu), chữa Bài tập về nhà bằng giọng nói và ôn tập từ vựng.

---

## 1. Đăng nhập hệ thống (`index.html`)

1. Truy cập trang chủ StudySnap (`index.html`).
2. Chọn vai trò tương ứng (**Cổng Học sinh** hoặc **Cổng Giáo viên**).
3. Nhập **Tên đăng nhập** (hoặc mã học sinh) và **Mật khẩu** (có thể bấm biểu tượng con mắt để hiện/ẩn mật khẩu).
4. Sau khi đăng nhập thành công:
   - Tài khoản **Giáo viên** sẽ vào không gian quản lý tại `teacher.html`.
   - Tài khoản **Học sinh** sẽ vào không gian học tập cá nhân tại `student.html`.

### Tài khoản Giáo viên mặc định khi khởi tạo hệ thống

| Vai trò | Tên đăng nhập | Mật khẩu | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Giáo viên** | `gv_uyennhi` | `123456` | Hồ Châu Uyển Nhi |

> **Lưu ý:** Nếu giáo viên tạo thêm học sinh mới trong Tab 4, hệ thống sẽ tự sinh **Mật khẩu khởi tạo ngẫu nhiên 6 chữ số** cho từng học sinh (không dùng cố định `123456`).

---

## 2. Hướng dẫn dành cho Giáo viên (`teacher.html`)

Giao diện giáo viên được chia thành **4 tab** theo đúng thứ tự làm việc từ trên lớp đến quản lý cuối khóa:

### Tab 1: `1. Luyện Tập Cuối Buổi` — Soạn đề, chèn nhanh 6 dạng bài & xem điểm

Đây là nơi giáo viên tạo đề luyện tập tương tác thay cho Google Forms và theo dõi điểm của học sinh.

#### A. Tạo, chọn hoặc nhập bài tập hàng loạt từ Excel
1. Chọn một bài tập có sẵn trong danh sách **Bài tập:** hoặc bấm **`+ Tạo bài tập mới`**.
2. Trong hộp thoại tạo mới, nhập **Tiêu đề bài tập** (VD: *Bài tập luyện tập cuối bài — HSK 1: Bài 2*) và **Thuộc bài số** (VD: *Bài 2*), rồi bấm **`Tạo bài tập ngay`**.
3. Để ra đề nhanh bằng bảng tính, bấm **`Nhập từ Excel`** (trên thanh đầu trang hoặc trên thanh trượt nhanh):
   - Mở tab **`Xem file Template mẫu`** để xem trực tiếp bảng cấu trúc 11 cột hỗ trợ cả **6 dạng bài** (có bộ lọc từng dạng) hoặc bấm **`Tải file Template (.xlsx)`** để tải về chỉnh sửa trên Excel / phần mềm bảng tính.
   - Kéo thả/chọn tệp `.xlsx`, `.xls`, `.csv` hoặc copy-paste trực tiếp từ Excel vào ô nhập, xem trước các phần câu hỏi và tổng điểm được phân tích.
   - Chọn **Cách đưa vào đề** (`Thêm các phần mới vào bài tập đang mở`, `Thay thế toàn bộ câu hỏi của bài đang mở`, hoặc `Tạo thành một bài tập mới hoàn toàn`) rồi bấm **`Xác nhận nhập vào đề`**.
4. Dùng các nút ở đầu khu vực soạn đề để:
   - **`Soạn câu hỏi`** / **`Điểm học sinh`**: chuyển giữa chế độ biên soạn câu hỏi và bảng điểm học sinh đã nộp.
   - **`Giao bài cho lớp`**: chọn lớp nhận bài và đặt hạn nộp.
   - **`Lưu bài tập`**: lưu thay đổi của bài hiện tại.
   - **`Xóa bài này`**: xóa bài luyện tập nếu tạo nhầm.

#### B. Thanh chọn dạng bài trượt theo khi cuộn (`Sticky Quick-Add Bar`)
- Khi giáo viên cuộn xuống dưới để chỉnh sửa các câu hỏi dài, **thanh công cụ thêm dạng bài sẽ tự động trượt và ghim ở mép trên màn hình**, giúp không phải cuộn ngược lên đầu trang mới thêm được phần mới.
- Trên thanh này hiển thị sẵn:
  - **Tổng điểm hiện tại** của cả đề (tự động cập nhật ngay khi giáo viên sửa điểm từng phần).
  - Nút **`Lưu đề nhanh`** để lưu lập tức tại bất kỳ vị trí cuộn nào.
  - **6 nút chèn nhanh dạng bài**:
    1. **`+ 1. Nối từ`**: nhập cột Chữ Hán, Pinyin và Nghĩa tiếng Việt tương ứng để học sinh nối cặp.
    2. **`+ 2. Trắc nghiệm`**: tạo câu hỏi chọn 1 đáp án đúng trong 4 phương án A/B/C/D.
    3. **`+ 3. Điền từ`**: tạo đoạn câu có chỗ trống `[1]`, `[2]`... kèm ngân hàng từ để học sinh điền vào chỗ trống.
    4. **`+ 4. Sửa câu sai`**: nhập câu chứa lỗi sai, phần gợi ý và đáp án đúng chuẩn.
    5. **`+ 5. Dịch câu`**: hỗ trợ chế độ tự động so khớp đáp án mẫu hoặc để giáo viên chấm tay.
    6. **`+ 6. Nghe hiểu`**: tạo bài nghe hiểu có ngữ cảnh giống mẫu giáo trình/HSK.

#### C. Cách tạo dạng bài `6. Nghe hiểu`
Khi bấm **`+ 6. Nghe hiểu`**, một thẻ bài nghe mới được chèn vào đề với đầy đủ thành phần:
1. **Thông tin ngữ cảnh bài nghe**:
   - **Nhãn phần**: VD `Text 4` hoặc `Bài nghe 1`.
   - **Tiêu đề ngữ cảnh (Hán tự)**: VD `在宾馆房间，李文在写日记。`
   - **Phụ đề / mô tả ngữ cảnh**: VD `In the hotel room, Li Wen was writing in his diary.` hoặc hướng dẫn tiếng Việt.
2. **Nguồn âm thanh (chọn 1 trong 4 cách)**:
   - **Tải file Audio** (`.mp3`, `.wav`, ... từ máy tính).
   - **Thu âm trực tiếp bằng Micro** ngay trên trình duyệt.
   - **Dán đường dẫn (URL)** của tệp nghe.
   - **Tạo giọng đọc tiếng Trung (TTS)** từ ô **Kịch bản hội thoại (Transcript)** để nghe thử trực tiếp nếu chưa kịp thu file riêng.
   - *(Mẹo: với tệp âm thanh dung lượng lớn, hệ thống sẽ tối ưu lưu trữ trực tuyến hoặc bạn có thể dán trực tiếp đường dẫn audio).*
3. **Danh sách câu hỏi trắc nghiệm theo bài nghe**:
   - Thêm các câu hỏi đánh số `(1)`, `(2)`, ...
   - Mỗi câu hỗ trợ **3 đáp án (A, B, C)** hoặc **4 đáp án (A, B, C, D)** (nếu bỏ trống ô D, giao diện học sinh sẽ tự ẩn đáp án D cho gọn).
   - Tích chọn đáp án đúng (A/B/C/D) để hệ thống tự chấm điểm ngay khi học sinh nộp bài.
   - Nhập **Kịch bản hội thoại (Transcript)** nếu muốn cho phép học sinh tự đối chiếu lời thoại sau khi nộp bài.

#### D. Chấm điểm & Xuất kết quả
- Các phần **Nối từ, Trắc nghiệm, Điền từ, Sửa câu sai, Nghe hiểu** (và **Dịch câu** nếu bật chấm tự động) được **hệ thống chấm ngay khi học sinh bấm nộp**.
- Chuyển sang tab **`Điểm học sinh`** để:
  - Bấm **`Chấm câu Dịch`** để cho điểm và viết nhận xét cho những câu dịch cần giáo viên đánh giá thủ công.
  - Bấm **`Xuất điểm (CSV Excel)`** để tải bảng điểm về máy.

---

### Tab 2: `2. Chữa BVN & Bảng Theo Dõi` — Quản lý theo Buổi học & Chữa bài Voice

#### A. Quản lý và giao BVN theo Buổi học (cột bên phải)
Để tránh rối khi một khóa học có 15+ buổi và mỗi buổi gồm nhiều bài nhỏ:
1. Tại mục **`1. Chọn Buổi học`**, chọn buổi đang dạy hoặc bấm **`+ Thêm Buổi mới`** để tạo buổi mới (VD: *Buổi 1*, *Buổi 2*...).
2. Tích chọn các bài tập nhỏ cần giao trong buổi đó (có nút **`Chọn tất cả`** / **`Bỏ chọn`**), chọn lớp tại mục **`Giao bài đã chọn cho Lớp:`** rồi bấm **`Giao cho lớp`**.
3. Tại mục **`2. Nhập thêm bài tập nhỏ vào buổi này:`**, nhập **Tên bài trong buổi** (VD: *Bài 3, Bài 4...*), **Hạn nộp bài**, mô tả yêu cầu rồi bấm **`+ Lưu bài tập nhỏ vào buổi này`**.

#### B. Chữa bài & Thu âm phản hồi Voice (cột bên trái)
1. Dùng bộ lọc **Chọn Lớp học** và **Buổi học** ở phía trên để lọc danh sách.
2. Chọn học sinh và bài tập nhỏ cần chấm. Nếu lỡ tạo nhầm bài tập nhỏ, có thể bấm **`Xóa bài này`**.
3. Nghe tệp ghi âm hoặc xem video học sinh đã nộp trực tiếp trên trình phát tích hợp trong màn hình chấm bài.
4. Nhập **điểm trên thang 10**, viết **nhận xét văn bản** và có thể bấm thu âm **phản hồi giọng nói (Voice Feedback)** trực tiếp để sửa phát âm/ngữ điệu cho từng bạn, sau đó lưu phản hồi.

#### C. Bảng tự động tổng hợp tiến độ (phía dưới)
- Hiển thị ma trận **Học sinh × Bài tập** kèm trạng thái làm bài, điểm số, tóm tắt nhận xét và nhãn phản hồi giọng nói.
- Dùng 4 bộ lọc nhanh để theo dõi lớp:
  - **`Tất cả học sinh`**
  - **`Có bài chưa làm`**
  - **`Đang chờ chữa`**
  - **`Đã chữa bài`**
- Bấm **`Xuất Bảng tổng hợp (CSV)`** ở đầu tab để tải báo cáo theo dõi lớp về máy.

---

### Tab 3: `3. Ôn Từ Vựng` — Nhập kho từ vựng & Sử dụng trực tiếp trên lớp

#### A. Thêm từ vựng mới
1. **Cách 1 — Nhập hàng loạt từ Excel / CSV (`Nhập từ Excel / CSV`)**:
   - Hỗ trợ chọn/kéo-thả tệp `.csv`, `.tsv`, `.txt`, `.xlsx`, `.xls`, hoặc **copy-paste trực tiếp các dòng từ Excel / bảng tính** vào ô nhập liệu.
   - Thứ tự 5 cột dữ liệu:
     `Chữ Hán | Pinyin | Từ loại | Nghĩa tiếng Việt | Câu ví dụ`
   - Có sẵn nút **`Dán mẫu dữ liệu`** để xem định dạng chuẩn và bảng **xem trước** toàn bộ danh sách từ trước khi lưu vào bài học.
2. **Cách 2 — Thêm từng từ (`+ Thêm từ thủ công`)**:
   - Chọn bài học, nhập **Chữ Hán**, **Phiên âm (Pinyin)** (có thanh **`Dấu thanh:`** bấm nhanh `ā á ǎ à ō ó ǒ ò ...` để chèn dấu mà không cần bộ gõ tiếng Trung/Pinyin), **Từ loại**, **Nghĩa tiếng Việt**, **Câu ví dụ tiếng Trung (kèm Pinyin)** -> bấm **`Lưu từ vựng mới`**.

#### B. Chiếu & ôn trực tiếp với 4 chế độ
Ngay trong Tab 3, giáo viên có thể mở 4 công cụ để trình chiếu hoặc kiểm tra học sinh tại lớp:
- **`Thẻ Flashcard 3D`**
- **`Luyện Trắc Nghiệm`**
- **`Tập Viết Nét Chữ`**
- **`Bảng Tra Cứu Toàn Bộ`** (kèm nút **`Nghe`** phát âm cho từng từ).

---

### Tab 4: `4. Quản Lý Lớp & Học Sinh` — Mở lớp & Cấp tài khoản

1. **Tạo lớp học mới**: tại mục **`Quản lý Danh sách Lớp Học`**, bấm **`+ Tạo lớp học mới`** để khai báo lớp mới (VD: *HSK 1 - Tối 2/4/6*).
2. **Thêm học sinh vào lớp**: tại mục **`Thêm Học sinh vào Lớp học`**:
   - Nhập **Họ và tên học sinh** và chọn **Lớp học**.
   - Hệ thống tự tạo **Tên đăng nhập** (VD: `hs09`) và **Mật khẩu khởi tạo** ngẫu nhiên 6 chữ số.
   - Có thể bấm **`Đổi mã`** (đổi tên đăng nhập) hoặc **`Đổi số`** (tạo lại mật khẩu ngẫu nhiên) trước khi bấm **`+ Thêm học sinh vào lớp`**.
3. **Quản lý danh sách học sinh theo lớp**: lọc theo lớp để xem tài khoản/mật khẩu và thực hiện nhanh 3 thao tác:
   - **`Đổi lớp`**: chuyển học sinh sang lớp khác.
   - **`Sao chép TK`**: copy nhanh Tên đăng nhập + Mật khẩu để gửi cho học sinh/phụ huynh qua Zalo, Messenger.
   - **`Đổi mật khẩu`**: đặt lại mật khẩu khi học sinh quên.

---

## 3. Hướng dẫn dành cho Học sinh (`student.html`)

Giao diện học sinh có **3 tab** đồng bộ tên gọi với giáo viên. Đầu trang luôn có bảng thống kê tiến độ cá nhân và nút bấm nhanh **`Ôn Tổng Hợp Tất Cả Từ Vựng`**.

### Tab 1: `1. Luyện Tập Cuối Buổi` — Làm bài & Xem điểm tức thì

1. Chọn bài tập của buổi học từ danh sách các thẻ bài ở phía trên.
2. Làm lần lượt các phần bài tập trong đề:
   - **Nối từ**: ghép Chữ Hán / Pinyin với nghĩa tiếng Việt.
   - **Trắc nghiệm**: chọn đáp án A/B/C/D.
   - **Điền từ**: chọn từ trong ngân hàng từ thả vào các vị trí `[1]`, `[2]`...
   - **Sửa câu sai**: gõ lại câu hoàn chỉnh đúng ngữ pháp/từ vựng.
   - **Dịch câu**: nhập bản dịch theo yêu cầu.
   - **Nghe hiểu**: bấm nút Play để nghe hội thoại, có thể dùng nút tua **`-5s`** và đổi tốc độ **`1.0x` / `0.8x`** nếu muốn nghe chậm hơn, sau đó chọn đáp án cho các câu `(1)`, `(2)`...
3. **Tự động lưu nháp**: bài đang làm dở được tự động lưu nháp trên trình duyệt, giúp không bị mất dữ liệu nếu lỡ tải lại trang.
4. Bấm **`Nộp bài & Chấm điểm toàn bộ`** để xem ngay điểm của các phần chấm tự động, đối chiếu đáp án đúng và đọc lại **Kịch bản hội thoại** ở phần Nghe hiểu (nếu bài có kèm lời thoại). Nếu giáo viên cho phép làm lại, bấm **`Làm lại từ đầu`**.

---

### Tab 2: `2. BVN & Phản Hồi Giáo Viên` — Nộp bài Audio/Video & Nghe chữa bài

1. Ở mục **`Chọn Buổi học`**, bấm chọn buổi học cần làm (VD: *Buổi 1*, *Buổi 2*...), sau đó chọn từng **bài tập nhỏ** bên trong buổi đó.
2. Đọc kỹ yêu cầu bài tập, rồi chọn 1 trong 2 cách nộp bài:
   - **`Thu âm bằng Micro`**: bấm thu âm trực tiếp trên điện thoại hoặc máy tính (nhớ bấm **Cho phép / Allow** khi trình duyệt hỏi quyền sử dụng Micro), nghe thử lại bản thu trước khi gửi.
   - **`Tải file Audio / Video từ máy`**: chọn tệp ghi âm hoặc video quay sẵn từ thiết bị.
3. Nhập ghi chú thêm cho giáo viên (nếu có) và bấm **`Nộp Bài Tập Về Nhà Ngay`**.
4. Khi giáo viên chấm xong:
   - Xem điểm số, nhận xét chi tiết và bấm nghe trực tiếp bản ghi âm chữa bài ở mục **`Phản Hồi & Giọng Nói Chữa Bài Từ Giáo Viên`** (bên phải).
   - Theo dõi toàn bộ lịch sử nộp bài và nhận xét qua các buổi ở **`Bảng Theo Dõi Tiến Độ BVN & Ý Kiến Giáo Viên Của Em`** (phía dưới).

---

### Tab 3: `3. Ôn Từ Vựng` — Tự luyện toàn diện với 4 chế độ

1. **`Thẻ Flashcard 3D`**:
   - Tùy chỉnh **`Thứ tự`** (`Tuần tự` / `Ngẫu nhiên`) và **`Hiện trước`** (`Chữ Hán` / `Tiếng Việt`).
   - Nhấp vào thẻ hoặc nhấn **phím cách (`Space`)** để lật mặt sau xem Pinyin & Nghĩa.
   - Bấm **`Phát âm (Speech)`** để nghe đọc mẫu, **`Xem nét chữ`** để mở ngay hướng dẫn viết chữ đó, dùng **`← Từ trước`** / **`Tiếp theo →`** để chuyển thẻ hoặc **`Làm lại từ đầu`** để reset.
2. **`Luyện Trắc Nghiệm`**:
   - Chọn **`Kiểu hỏi`** (`Hán → Việt`, `Việt → Hán`, `Hỗn hợp`) và **`Số câu`** (`20 câu`, `30 câu`, `50 câu`, `Tất cả`).
   - Theo dõi bộ đếm **`Đúng / Sai / Đã làm`** trực tiếp và bấm **`Nghe phát âm`** bất kỳ lúc nào.
3. **`Tập Viết Nét Chữ`**:
   - Tìm chữ theo Hán tự/Pinyin hoặc chọn nhanh trong danh sách gợi ý.
   - Bấm **`▶ Xem viết`** để xem hoạt ảnh thứ tự từng nét, **`✏️ Luyện viết`** để tự tô nét tương tác trên khung tập viết, **`🔊 Nghe`** để nghe phát âm.
4. **`Bảng Tra Cứu Toàn Bộ`**:
   - Xem danh sách đầy đủ Chữ Hán, Pinyin, Từ loại, Nghĩa tiếng Việt, Câu ví dụ và bấm nghe phát âm từng từ.

---

## 4. Lưu ý kỹ thuật & Khắc phục nhanh

- **Không thu âm được bằng Micro**: Kiểm tra biểu tượng ổ khóa/Micro trên thanh địa chỉ trình duyệt (Chrome/Safari/Edge), chọn **Cho phép (Allow)** quyền truy cập Micro rồi tải lại trang. Khi chạy online, trang web cần sử dụng giao thức bảo mật `HTTPS` (mặc định có sẵn khi deploy trên Cloudflare Pages).
- **Nên dùng trình duyệt nào**: Khuyên dùng Chrome, Edge hoặc Safari phiên bản mới để sử dụng tốt tính năng thu âm (`MediaRecorder`), phát âm tiếng Trung (`SpeechSynthesis`) và tập viết nét chữ.
- **Lưu trữ & đồng bộ dữ liệu**: Trình duyệt lưu bộ nhớ đệm cục bộ để thao tác mở bài/ôn từ vựng phản hồi tức thì và tự động đồng bộ bài tập, điểm số cũng như tệp audio/video với máy chủ lưu trữ trực tuyến.
- **Xóa toàn bộ dữ liệu thử nghiệm để dùng thật**: Vào **Cổng Giáo viên → Tab 4 (`Quản Lý Lớp & Học Sinh`) → Khu vực `Quản Trị & Làm Sạch Dữ Liệu Hệ Thống` → bấm `Xóa toàn bộ dữ liệu test`** (giữ lại tài khoản Giáo viên để tiếp tục quản lý lớp).
