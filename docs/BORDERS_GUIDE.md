# SHB Compliance Platform — Professional Border Design Standards

Tài liệu này hướng dẫn cách xây dựng các loại khung viền (borders) và panel chuyên nghiệp cho giao diện tối (Dark Mode) của hệ thống SHB Bank, đặc biệt tối ưu cho phong cách **cạnh sắc (sharp corners)** và **chữ phát sáng (text glows)**.

---

## 1. Viền Siêu Mảnh (Hairline Border - Minimalist)
* **Khái niệm**: Sử dụng viền `1px` với độ trong suốt cực cao trên nền tối, tạo ranh giới tinh tế mà không làm nặng mắt.
* **Mã CSS**:
```css
.border-hairline {
  background-color: var(--navy-surface);
  border: 1px solid rgba(255, 255, 255, 0.08); /* Viền mờ */
}
```

---

## 2. Viền Điểm Nhấn Góc (Corner Brackets - Tech/Cyberpunk Grid)
* **Khái niệm**: Sử dụng các góc chữ "L" ở các góc của thẻ/khung để tạo cảm giác giống như màn hình radar quét thông tin, rất phù hợp với phong cách cạnh sắc.
* **Mã CSS**:
```css
.panel-brackets {
  position: relative;
  background-color: var(--navy-surface);
  border: 1px solid rgba(255, 255, 255, 0.04);
}

/* Vẽ các góc chữ L */
.panel-brackets::before, .panel-brackets::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border-color: var(--orange-signature);
  border-style: solid;
  pointer-events: none;
}

/* Góc trên trái */
.panel-brackets::before {
  top: -1px;
  left: -1px;
  border-width: 2px 0 0 2px;
}

/* Góc dưới phải */
.panel-brackets::after {
  bottom: -1px;
  right: -1px;
  border-width: 0 2px 2px 0;
}
```

---

## 3. Viền Nhấn Biên (Accent Edge Border)
* **Khái niệm**: Sử dụng một vạch màu dày ở bên trái (hoặc trên đầu) để chỉ thị trạng thái, các viền còn lại ở dạng hairline mờ. Đây là tiêu chuẩn thiết kế chuyên nghiệp trong bảng quản trị.
* **Mã CSS**:
```css
.border-accent-left {
  background-color: var(--navy-surface);
  border: 1px solid var(--navy-hairline);
  border-left: 4px solid var(--orange-signature); /* Chỉ nhấn bên trái */
}
```

---

## 4. Viền Dải Màu Kim Loại (Metallic Gradient Border)
* **Khái niệm**: Viền có dải màu từ tối sang sáng (ví dụ từ Navy sang Cam) tạo hiệu ứng phản chiếu ánh sáng kim loại sang trọng.
* **Mã CSS**:
```css
.border-gradient {
  background-color: var(--navy-surface);
  border: 1px solid transparent;
  border-image: linear-gradient(135deg, var(--navy-surface-raised) 30%, var(--orange-signature) 100%) 1;
}
```

---

## 5. Viền Phát Sáng Neon (Soft Glow Border)
* **Khái niệm**: Viền kết hợp với `box-shadow` nhẹ cùng tông màu, tạo cảm giác thẻ đang "lơ lửng" và phát sáng nhẹ ra xung quanh.
* **Mã CSS**:
```css
.border-glow-active {
  border: 1px solid var(--orange-signature);
  box-shadow: 0 0 12px rgba(240, 99, 29, 0.25), 
              inset 0 0 8px rgba(240, 99, 29, 0.08);
}
```

---

## 6. Viền Chìm Nổi (Bevel Depth Border - Skeuomorphic Flat)
* **Khái niệm**: Tạo chiều sâu 3D giả lập bằng cách kết hợp viền sáng ở trên và bóng tối ở dưới.
* **Mã CSS**:
```css
.border-bevel {
  background-color: var(--navy-surface);
  border-top: 1px solid rgba(255, 255, 255, 0.12);    /* Ánh sáng từ trên */
  border-bottom: 1px solid rgba(0, 0, 0, 0.4);         /* Bóng đổ phía dưới */
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  border-right: 1px solid rgba(0, 0, 0, 0.2);
}
```
