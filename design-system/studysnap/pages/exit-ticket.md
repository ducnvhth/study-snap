# Page Override: Phân Hệ Bài Luyện Tập Cuối Giờ (`exit-ticket`)

> **Kế thừa từ:** [`design-system/studysnap/MASTER.md`](../MASTER.md) & [`DESIGN.md`](../../../DESIGN.md)
> **Impeccable Mode:** `Operate` + `Delight` (Tương tác gamified thay thế Google Forms)

## 1. Bố Cục & Luồng Tương Tác

- **Thanh chọn đề theo bài học (`Bài 1`, `Bài 2`, `Bài 3`...)**: Nút chọn kiểu `lesson-pill` bo góc `16px`, hiển thị số lượng câu hỏi.
- **Khung Câu Hỏi Tương Tác Chính (Interactive Question Stage)**:
  - Thanh tiến độ trực quan (`quiz-progress-track` + `quiz-progress-fill`).
  - Câu hỏi rõ ràng kèm nút **Nghe phát âm mẫu** (`Web Speech API`).
  - Các phương án trả lời lớn (`min-height: 52px`), vùng bấm rộng rãi trên điện thoại, đổi màu ngữ nghĩa ngay khi chọn (`#DCFCE7` xanh lá khi đúng, `#FEE2E2` đỏ khi sai) kèm hộp giải thích chi tiết.
- **Cột Phải**: Bảng ghi nhận kết quả hiểu bài cuối giờ của lớp theo thời gian thực + biểu mẫu để giáo viên bổ sung câu hỏi mới vào đề cuối giờ.

