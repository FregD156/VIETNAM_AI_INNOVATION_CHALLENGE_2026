# SHB Graph-RAG Interactive Dashboard & Compliance Platform

Hệ thống Advanced RAG Knowledge Base hỗ trợ cán bộ ngân hàng tra cứu văn bản pháp quy qua AI Chatbot, trực quan hóa Đồ thị tri thức (Neo4j) và quản trị dự thảo sửa đổi luật.

---

## 📂 Cấu Trúc Dự Án (Client-Server-Data Architecture)

Dự án được phân chia sạch sẽ thành 3 phân vùng chính:

```
├── client/                 # Mã nguồn giao diện người dùng RM & Admin (React + Vite)
│   ├── src/                # Luồng Contexts, Hooks, Components (Chat, Graph, Admin)
│   ├── public/             # Tài nguyên ảnh, icons svg tĩnh
│   ├── package.json        # Thư viện Frontend (React Flow, react-icons, jsdiff)
│   └── vite.config.js
│
├── server/                 # Mock Backend API Server (Node.js Express)
│   ├── server.js           # Xử lý các API Chatbot, Graph Neo4j, PDF Upload, CRM Sync
│   └── package.json
│
└── data/                   # Cơ sở dữ liệu và tài liệu pháp luật
    ├── raw_documents/      # Chứa file PDF gốc (Thông tư 06, Thể lệ VAIC, QĐ 214) và bản dịch OCR
    └── knowledge_graph/    # Nơi lưu trữ tài liệu cấu trúc DB, script nạp đồ thị tri thức
```

---

## ⚡ Hướng Dẫn Khởi Chạy Nhanh (Getting Started)

### 1. Khởi chạy Mock Backend Server
Đảm bảo bạn đã cài đặt Node.js trên máy. Chạy các lệnh sau để khởi chạy Server ở port `8000`:

```bash
cd server
npm install
npm start
```
*Giao diện API chạy tại:* `http://localhost:8000/api`

### 2. Khởi chạy Client Dashboard (Frontend)
Mở một cửa sổ terminal mới và chạy:

```bash
cd client
npm install
npm run dev
```
*Giao diện Dashboard chạy tại:* `http://localhost:5173`

---

## 🌟 Tính Năng Đặc Sắc Đang Hoạt Động
1. **AI Chatbot Pháp Quy**: Hỗ trợ RM tra cứu quy định nhanh, hiển thị thẻ trích dẫn nguồn, popup lazy-load đọc tài liệu gốc.
2. **Cảnh Báo Xung Đột Pháp Lý**: Nhận diện mâu thuẫn giữa luật nhà nước (Thông tư) và văn bản nội bộ (Quyết định) và hiển thị cảnh báo.
3. **CRM Integration**: Chức năng nháp kịch bản tư vấn và nút Đồng bộ trực tiếp thông tin sang CRM Sandbox.
4. **Knowledge Graph Visualizer**: Sử dụng React Flow hiển thị liên kết đồ thị Neo4j. Nodes thay đổi kiểu dáng (active/expired) theo trạng thái thực tế.
5. **Timeline Sửa Đổi**: Trục thời gian lịch sử sửa đổi điều khoản được sắp xếp khoa học.
6. **Uploader & Diff Preview (Admin)**: Kéo thả file PDF cập nhật và hiển thị so sánh (diff) thay đổi văn bản chi tiết word-by-word. Bấm "Phê duyệt" để cập nhật trực tiếp sơ đồ đồ thị.
