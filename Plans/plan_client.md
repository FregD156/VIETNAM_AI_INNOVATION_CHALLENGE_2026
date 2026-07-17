# KẾ HOẠCH PHÁT TRIỂN CLIENT: SHB GRAPH-RAG INTERACTIVE FRONTEND (PLAN_CLIENT)

Tài liệu này trình bày kế hoạch phát triển chi tiết cho giao diện người dùng (Frontend Client) của hệ thống **Advanced RAG Knowledge Base for SHB**, đảm bảo đáp ứng đầy đủ yêu cầu nghiệp vụ doanh nghiệp và đạt tiêu chuẩn thiết kế cao cấp (Rich Aesthetics).

---

## 1. PHƯƠNG CHÂM THIẾT KẾ & CÔNG NGHỆ CHỦ ĐẠO

### 1.1. Định hướng Thiết kế (Design System & Aesthetics)
* **Phong cách**: Glassmorphism (hiệu ứng kính mờ), Sleek Dark Mode (chế độ tối hiện đại với các dải màu xanh navy và vàng gold làm điểm nhấn theo nhận diện thương hiệu SHB).
* **Typography**: Sử dụng font chữ hiện đại từ Google Fonts (Outfit hoặc Inter) thay cho font mặc định hệ thống.
* **Độ tương thích**: Tối ưu hóa hiển thị Desktop (màn hình trình duyệt laptop/desktop của cán bộ ngân hàng/RM theo yêu cầu H3).
* **Styling**: Sử dụng **Vanilla CSS** (CSS Variables, Flexbox, CSS Grid) để kiểm soát tối đa thuộc tính hiển thị, hiệu ứng chuyển động mượt mà (micro-animations) và tối ưu hiệu năng.

### 1.2. Công nghệ & Thư viện Lựa chọn (Client Tech Stack)
* **Framework**: React.js (phiên bản 18+).
* **State Management**: React Context API (quản lý trạng thái gọn nhẹ cho Hackathon).
* **Đồ thị tương tác (Knowledge Graph)**: **React Flow** (hoặc `vis-network` / `D3.js` wrapper) để vẽ sơ đồ node mạng lưới dễ tương tác, zoom/pan mượt mà.
* **Trực quan hóa Timeline**: Custom CSS Timeline Component (tối ưu hóa tốc độ load).
* **Icons**: `react-icons` (Lucide Icons bộ sưu tập).

---

## 2. KIẾN TRÚC THÀNH PHẦN (COMPONENT ARCHITECTURE)

Hệ thống Frontend sẽ được chia thành cấu trúc các component độc lập và tái sử dụng:

```
[ AppLayout ]
   |-- [ Sidebar ] (Điều hướng: Chat, Đồ thị, Quản trị)
   |-- [ MainContainer ]
          |-- PHÂN HỆ 1: [ ChatWorkspace ]
          |      |-- [ ChatHistoryList ] -> [ MessageItem ] (Markdown, Table)
          |      |      |-- [ CitationTag ] (Nút click xem nguồn)
          |      |      |-- [ WarningCard ] (Banner cảnh báo mâu thuẫn)
          |      |      |-- [ ActionableDraft ] (Khung chỉnh sửa email 1-click)
          |      |-- [ ChatInputArea ] (Input, nút khôi phục dấu, nút ghi âm)
          |
          |-- PHÂN HỆ 2: [ GraphWorkspace ]
          |      |-- [ SearchBar ] (Tìm kiếm văn bản pháp quy)
          |      |-- [ GraphCanvas ] (Vẽ đồ thị Neo4j)
          |      |-- [ NodeDetailSidebar ] (Xem chi tiết khi click Node)
          |             |-- [ VersionTimeline ] (Trục thời gian điều khoản)
          |
          |-- PHÂN HỆ 3: [ AdminWorkspace ]
                 |-- [ DragDropUpload ] (Kéo thả file PDF)
                 |-- [ GraphChangePreview ] (Xem trước thay đổi đồ thị)
```

---

## 3. CHI TIẾT TÍNH NĂNG & HIỆN THỰC FRONTEND

### 3.1. Phân hệ 1: AI Chatbot (Tương tác ngôn ngữ tự nhiên)
* **Message Streaming Effect**: Hiển thị text theo kiểu stream (từng ký tự chạy ra) tạo cảm giác phản hồi nhanh (TTFT < 1s).
* **Citation Modal (Xem trích dẫn nguồn)**:
  * Khi người dùng click vào thẻ trích dẫn (ví dụ: `[Điều 5 - TT39]`), một Modal (Popup) phủ mờ nền sẽ hiển thị đoạn văn bản pháp lý gốc được lưu trong node `Clause` tương ứng.
* **Warning Card (Cảnh báo mâu thuẫn)**:
  * Khi API Backend trả về dữ liệu có cờ cảnh báo mâu thuẫn (`has_conflict: true`), Frontend hiển thị một Warning Card màu vàng ấm, có icon chú ý lắc nhẹ (subtle wiggle animation) để RM biết và thận trọng.
* **Actionable Draft Editor (Soạn thảo email 1-click)**:
  * Phần kịch bản gọi điện hoặc email nháp được hiển thị trong một khung viền đứt nét nổi bật, tích hợp nút **"Copy"** và nút **"Đồng bộ CRM"** (crm-sync). Khi click, Frontend gửi lệnh mock cập nhật sang CRM Sandbox.

### 3.2. Phân hệ 2: Graph & Timeline Explorer (Khám phá đồ thị & Trục thời gian)
* **Graph Canvas**:
  * Hiển thị các vòng tròn (Nodes) đại diện cho văn bản và các mũi tên (Edges) thể hiện liên kết.
  * *Quy ước màu sắc*:
    * Node `Clause` còn hiệu lực: Màu xanh lục mờ (Emerald glass).
    * Node `Clause` hết hiệu lực: Màu đỏ hồng mờ (Ruby glass) kèm gạch chéo.
    * Cạnh `SUPERSEDES`: Màu đỏ nét đứt.
    * Cạnh `REFERENCES`: Màu xanh dương nét liền.
* **Version Timeline (Trục thời gian)**:
  * Khi click vào một node trên đồ thị, Sidebar bên phải mở ra hiển thị trục thời gian dọc (Vertical Timeline). Người dùng có thể kéo timeline để xem nội dung của điều khoản này đã biến đổi thế nào qua các năm 2016 -> 2020 -> 2026.

### 3.3. Phân hệ 3: Admin & Ingestion Dashboard (Cập nhật văn bản)
* **Drag-and-Drop Area**: Giao diện kéo thả file PDF trực quan, hiển thị hiệu ứng tiến trình tải lên (Uploader progress bar).
* **Diff Preview (So sánh thay đổi)**:
  * Trước khi đẩy dữ liệu mới vào DB, Admin Dashboard hiển thị một khung so sánh thay đổi dạng Diff (đỏ cho phần bãi bỏ, xanh cho phần bổ sung) để chuyên viên tuân thủ kiểm duyệt trước khi đồng ý cập nhật sơ đồ đồ thị tri thức.

---

## 4. QUẢN LÝ TRẠNG THÁI (STATE MANAGEMENT)

Sử dụng React Context API để quản lý trạng thái tập trung trong file `context/AppContext.js`:

```javascript
// Các trường State cốt lõi cần quản lý:
const AppState = {
  activeTab: 'chat',          // 'chat' | 'graph' | 'admin'
  chatHistory: [],           // Mảng chứa các tin nhắn hội thoại
  isStreaming: false,        // Trạng thái LLM đang trả lời
  graphData: {               // Dữ liệu node/edge phục vụ React Flow
    nodes: [],
    edges: []
  },
  selectedNode: null,        // Node đang được chọn để hiển thị timeline
  uploadQueue: [],           // Hàng đợi các file PDF đang upload ở Admin
};
```

---

## 5. LỘ TRÌNH TRIỂN KHAI FRONTEND 48 GIỜ (TIMELINE)

### Giờ 0 - Giờ 8: Cài đặt & Dựng Giao diện Khung (Layout Setup)
* Khởi tạo dự án React bằng Vite.
* Thiết lập file CSS biến chung (`index.css`) chứa bảng màu Sleek Dark Mode (SHB colors) và font chữ Outfit.
* Code layout chính gồm Sidebar điều hướng và khung hiển thị Tab.

### Giờ 8 - Giờ 20: Xây dựng Phân hệ Chat & UI Component
* Lập trình cấu trúc khung chat, input area.
* Xây dựng Component `MessageItem` hỗ trợ render markdown, bảng biểu và nút trích dẫn nguồn.
* Hoàn thiện Component `CitationModal` và khung chỉnh sửa email draft.
* **Tích hợp API Backend**: Kết nối chức năng gửi nhận tin nhắn với FastAPI.

### Giờ 20 - Giờ 32: Lập trình Đồ thị Tri thức & Timeline
* Tích hợp thư viện `React Flow`.
* Viết parser chuyển đổi dữ liệu đồ thị nhận về từ API Neo4j thành định dạng Nodes và Edges của React Flow.
* Lập trình Component hiển thị trục thời gian điều khoản (Timeline) ở Sidebar khi chọn Node.
* Hoàn thiện giao diện Admin uploader kéo thả file.

### Giờ 32 - Giờ 48: Làm mịn UI, Tối ưu UX & Deploy
* Thêm hiệu ứng loading skeletons khi chờ RAG truy xuất dữ liệu.
* Sửa lỗi giao diện, tối ưu responsive trên màn hình máy tính.
* Deploy ứng dụng lên Vercel để lấy Live URL.
* Quay video demo và nộp bài.
