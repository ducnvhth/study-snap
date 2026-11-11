---
name: StudySnap
description: Tactile Claymorphism & Clean Bento EdTech system. Education Teal and Achievement Orange sit on soft Mint-White surfaces for joyful student learning and effortless teacher grading.
colors:
  primary: "#0F766E"
  primary-bright: "#0D9488"
  primary-deep: "#115E59"
  on-primary: "#FFFFFF"
  secondary: "#2DD4BF"
  secondary-soft: "#CCFBF1"
  on-secondary: "#134E4A"
  accent: "#C2410C"
  accent-bright: "#EA580C"
  accent-soft: "#FFEDD5"
  on-accent: "#FFFFFF"
  background: "#F0FDFA"
  surface-card: "#FFFFFF"
  surface-muted: "#E6F4F1"
  surface-elevated: "#F8FAFC"
  foreground: "#134E4A"
  muted-foreground: "#334155"
  border-soft: "#99F6E4"
  border-strong: "#5EEAD4"
  border-neutral: "#CBD5E1"
  ring: "#0F766E"
  success: "#15803D"
  success-bg: "#DCFCE7"
  success-border: "#86EFAC"
  success-text: "#14532D"
  warning: "#B45309"
  warning-bg: "#FEF3C7"
  warning-border: "#FCD34D"
  warning-text: "#78350F"
  destructive: "#B91C1C"
  destructive-bg: "#FEE2E2"
  destructive-border: "#FCA5A5"
  destructive-text: "#7F1D1D"
typography:
  scale:
    "12": "0.75rem"
    "13": "0.8125rem"
    "14": "0.875rem"
    "15": "0.9375rem"
    "16": "1rem"
    "18": "1.125rem"
    "20": "1.25rem"
    "24": "1.5rem"
    "28": "1.75rem"
    "32": "2rem"
    "40": "2.5rem"
  display:
    fontFamily: "'Nunito', 'Be Vietnam Pro', sans-serif"
    fontSize: "2.5rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Nunito', 'Be Vietnam Pro', sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "'Nunito', 'Be Vietnam Pro', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "'Be Vietnam Pro', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Be Vietnam Pro', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  mono:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
rounded:
  none: "0px"
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  lesson-chip:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "12px 18px"
---

## Overview

**StudySnap** kết hợp ngôn ngữ thiết kế **Claymorphism + Micro-interactions** (do **UI UX Pro Max** lựa chọn cho không gian học tập của học sinh) với cấu trúc **Bento Box Grid & Clean Accessible Matrix** (cho bảng tổng hợp tiến độ và không gian chấm chữa bài bằng giọng nói của giáo viên), được tinh chỉnh và kiểm định chất lượng bởi **Impeccable**.

## Colors

Hệ màu lấy cảm hứng từ sự tập trung, tươi mới và cảm giác thành tựu khi hoàn thành bài học, đảm bảo tương phản chuẩn WCAG AA (≥ 4.5:1):
- **Education Teal (`#0F766E` / `#0D9488`)** làm màu chủ đạo cho thanh điều hướng, tab chọn bài học (`Bài 1`, `Bài 2`, ...) và trạng thái đang chọn.
- **Achievement Orange (`#C2410C` / `#EA580C`)** dành riêng cho các nút hành động quan trọng nhất: **Nộp BVN**, **Ghi âm phản hồi**, **Bắt đầu bài cuối giờ**, và nút **Tổng hợp** từ vựng toàn khóa.
- **Deep Teal-Ink (`#134E4A`)** trên nền **Soft Mint-White (`#F0FDFA`)** và thẻ trắng (`#FFFFFF`) giúp mắt học sinh và giáo viên không bị mỏi khi sử dụng lâu dài.

## Typography

- **Heading (`Nunito` 700/800/900)**: Các nét bo tròn mềm mại tạo sự thân thiện, giảm áp lực kiểm tra bài, hỗ trợ đầy đủ dấu Tiếng Việt.
- **Body & Bảng tổng hợp (`Be Vietnam Pro` 400/500/600/700)**: Phông chữ thiết kế chuyên biệt cho Tiếng Việt, đảm bảo độ rõ nét tối đa khi đọc nhận xét của giáo viên, danh sách học sinh trong bảng tổng hợp và nghĩa từ vựng.
- **Phonetics & Timers (`JetBrains Mono`)**: Hiển thị chuẩn xác phiên âm IPA và thời lượng file ghi âm/video với `font-variant-numeric: tabular-nums`.

## Layout

- **Thanh chọn bài từ vựng (Lesson Selector Bar)**: Các thẻ chọn bài (`Bài 1`, `Bài 2`, `Bài 3`...) xếp dạng lưới hoặc thanh chọn ngang có nút **"Tổng hợp"** nổi bật để học sinh bấm 1 chạm là chuyển bài ngay.
- **Bảng tự động tổng hợp BVN (Auto-Aggregated Progress Matrix)**: Bảng dữ liệu rộng với cột tên học sinh cố định bên trái (sticky column), hiển thị đồng thời trạng thái nộp bài (`Đã nộp`, `Chưa làm`, `Đã chữa`), trình phát nhanh file học sinh nộp và nội dung nhận xét (text + voice) của giáo viên ngay trong ô.

## Elevation & Depth

- Sử dụng bóng đổ mềm có độ sâu tự nhiên (`0 6px 16px -4px rgba(19, 78, 74, 0.08)`) kết hợp viền `2px` rõ ràng cho các thẻ từ vựng và câu hỏi cuối giờ theo phong cách Claymorphism hiện đại.

## Shapes

- Thẻ bài học, khung Flashcard và khung nộp BVN sử dụng bo góc `16px–24px` (`{rounded.lg}` – `{rounded.2xl}`).
- Các nút bấm và nhãn trạng thái (status badges) sử dụng bo góc `12px` hoặc `pill` cho nút ghi âm giọng nói.

## Components

- **Thẻ Từ Vựng & Nút Chọn Bài (`Bài 1`, `Bài 2`, ..., `Tổng hợp`)**: Hiển thị số lượng từ vựng và tiến độ thuộc bài; nút **"Tổng hợp"** có màu nhấn `#C2410C` để phân biệt rõ với từng bài lẻ.
- **Trình Thu Âm & Chữa Bài Voice (Voice Feedback Recorder & Player)**: Tích hợp sẵn cho cả học sinh (nộp file audio/video hoặc ghi âm tại chỗ) và giáo viên (bấm 1 nút để ghi âm nhận xét chữa bài và gắn trực tiếp vào bài nộp + bảng tổng hợp).
- **Thẻ Câu Hỏi Cuối Giờ (Interactive Exit Ticket Card)**: Hiển thị từng câu hỏi sinh động kèm thanh tiến độ, hiệu ứng chọn đáp án rõ ràng và phản hồi kết quả tức thì.

## Do's and Don'ts

- **DO**: Sử dụng SVG icon đồng nhất (Lucide Icons), đảm bảo độ tương phản ≥ 4.5:1 và kiểm tra bằng `impeccable.cmd detect` sau mỗi lần chỉnh sửa UI.
- **DON'T**: Không sử dụng màu tím-xanh AI đại trà, không dùng emoji làm icon chức năng, không bắt giáo viên phải mở nhiều cửa sổ rời rạc mới xem được nhận xét và tiến độ của học sinh.
