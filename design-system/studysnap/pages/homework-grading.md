# Page Override: Phân Hệ Nộp & Chữa BVN + Bảng Tự Động Tổng Hợp (`homework-grading`)

> **Kế thừa từ:** [`design-system/studysnap/MASTER.md`](../MASTER.md) & [`DESIGN.md`](../../../DESIGN.md)
> **Impeccable Mode:** `Operate` (Giáo viên chấm bài & Bảng tổng hợp) + `Experience` (Học sinh nộp BVN Audio/Video)

## 1. Bố Cục & Phân Cấp Thị Giác (Layout & Hierarchy)

- **Khu vực thao tác đôi (2-Column Split Workspace)**:
  - **Cột Trái (Học sinh nộp BVN)**: Form chọn học sinh, chọn bài tập, tải lên file ghi âm/video hoặc thu âm trực tiếp kèm thanh sóng âm, ghi chú gửi giáo viên và xem kết quả chữa bài ngay bên dưới.
  - **Cột Phải (Giáo viên chữa bài & Phản hồi Voice)**: Nghe/xem bài nộp của học sinh tại chỗ, chấm điểm thang 10, thu âm phản hồi bằng giọng nói (Voice Feedback) và nhập nhận xét chi tiết.
- **Bảng Tự Động Tổng Hợp Tiến Độ & Ý Kiến Giáo Viên (Full-Width Matrix)**:
  - Cố định cột đầu tiên (`Học sinh` — `position: sticky; left: 0`).
  - Mỗi ô giao giữa **Học sinh × Bài tập** hiển thị trọn vẹn 3 lớp thông tin:
    1. Nhãn trạng thái ngữ nghĩa (`Đã chữa • Điểm`, `Đã nộp • Chờ chữa`, `Chưa làm bài`).
    2. Ý kiến nhận xét bằng văn bản của giáo viên ngay trong ô.
    3. Nhóm nút hành động nhanh: Nghe bài học sinh, Nghe Voice Feedback của giáo viên, và nút `Chữa bài / Sửa nhận xét`.

## 2. Quy Tắc Chống Lỗi Giao Diện (Craft Floor & Hardening)

- Không lồng thẻ có viền và bóng đổ bên trong `.surface-panel` (sử dụng đường kẻ ngang `border-top` / `border-bottom` mảnh `1px solid #E6F4F1`).
- Cân bằng chiều cao giữa cột Học sinh và cột Giáo viên trên màn hình Desktop để không gây lỗi `first-viewport-column-overflow`.
- Hỗ trợ lọc nhanh theo trạng thái (`Tất cả`, `Có bài chưa làm`, `Đang chờ chữa`, `Đã chữa bài`), tìm kiếm học sinh và xuất báo cáo tổng hợp ra file CSV (UTF-8 BOM cho Excel).

