# HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG SHB GRAPH-RAG INTERACTIVE

Dự án đã được cấu trúc lại hoàn chỉnh theo mô hình: **`client`** (Frontend Vite/React) | **`server`** (Backend FastAPI) | **`database`** (SQLite, FAISS) | **`docs`** (Tài liệu nghiệp vụ).

---

## 🛠️ Chuẩn bị trước khi chạy (Prerequisites)

1.  **Python 3.9+** và **NodeJS (v18+)** đã được cài đặt trên máy.
2.  **Cài đặt thư viện Backend (đã chạy sẵn trên máy bạn):**
    ```bash
    cd server
    pip3 install -r requirements.txt
    ```
3.  **Cài đặt thư viện Frontend (đã chạy sẵn trên máy bạn):**
    ```bash
    cd client
    npm install
    ```

---

## 🚀 Cách 1: Chạy Chế độ Phát triển (Local Development)
*Khuyên dùng khi bạn muốn chỉnh sửa code ở cả Frontend và Backend (Hỗ trợ Hot-reload).*

### Bước 1: Khởi chạy máy chủ Backend (FastAPI - Port 8000)
Mở một cửa sổ Terminal mới tại thư mục root dự án và chạy:
```bash
cd server
bash run_server.sh
```
*Server sẽ chạy tại địa chỉ: **`http://localhost:8000`***

### Bước 2: Khởi chạy Frontend Dev Server (Vite/React - Port 5173)
Mở thêm một cửa sổ Terminal thứ hai tại thư mục root dự án và chạy:
```bash
cd client
npm run dev
```
*Vite sẽ khởi chạy dev server tại địa chỉ: **`http://localhost:5173`***. 

👉 **Trải nghiệm:** Mở trình duyệt và truy cập `http://localhost:5173`. Giao diện Frontend sẽ tự động giao tiếp chéo cổng (CORS) với Backend ở cổng `8000` một cách hoàn hảo.

---

## 📦 Cách 2: Chạy Chế độ Demo/Sản xuất (Gọn nhẹ & Tối ưu nhất)
*Khuyên dùng khi thuyết trình/Demo Hackathon. Chỉ cần 1 cổng chạy duy nhất, không lo lỗi trình duyệt.*

### Bước 1: Build đóng gói Frontend tĩnh
```bash
cd client
npm run build
```
*(Lệnh này sẽ biên dịch toàn bộ Frontend Premium thành các tệp tĩnh tối ưu hóa nằm trong thư mục `client/dist`)*

### Bước 2: Khởi chạy máy chủ Backend duy nhất
```bash
cd server
bash run_server.sh
```

### Bước 3: Trải nghiệm ứng dụng Demo
👉 **Trải nghiệm:** Mở trình duyệt và truy cập trực tiếp địa chỉ:
```text
http://localhost:8000
```
Backend FastAPI sẽ tự động nhận diện bản build và phục vụ trực tiếp giao diện Frontend Premium của bạn. Cả hệ thống hoạt động thống nhất trên một cổng duy nhất.

---

## 🧠 Cấu hình Trí tuệ Nhân tạo (LLM Chatbot)

Để kích hoạt tính năng **Hỏi đáp RAG thực tế** (Chatbot) thay vì báo lỗi mất kết nối, bạn hãy cấu hình API Key của nhà cung cấp LLM:

1.  Sao chép tệp cấu hình mẫu `.env.example` thành `.env` trong thư mục `server/`:
    ```bash
    cp server/.env.example server/.env
    ```
2.  Mở tệp `server/.env` bằng trình chỉnh sửa code và điền thông tin phù hợp:
    *   **Nếu dùng OpenAI Cloud (Khuyên dùng cho Demo nhanh):**
        ```env
        CHAT_MODEL_NAME=gpt-4o-mini
        CHAT_BASE_URL=https://api.openai.com/v1
        OPENAI_API_KEY=sk-proj-xxxxxx_dien_key_openai_cua_ban
        ```
    *   **Nếu dùng Ollama Local:**
        ```env
        CHAT_MODEL_NAME=qwen2.5:3b     # Tên model bạn đã pull trong Ollama
        CHAT_BASE_URL=http://localhost:11434/v1
        CHAT_API_KEY=ollama
        ```

3.  Khởi động lại server backend để áp dụng cấu hình mới.

---

## 🔍 Kiểm tra liên kết hệ thống tự động
Bất kỳ lúc nào, bạn cũng có thể kiểm tra trạng thái sức khỏe của server, số lượng document trong database và liên kết RAG bằng cách chạy script test tự động ngay tại thư mục root:
```bash
./check_integration.py
```
