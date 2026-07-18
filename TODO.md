# TODO.md — SHB Graph-RAG Integration Progress

Tệp tin này dùng để theo dõi tiến độ tích hợp hệ thống, đồng bộ dữ liệu giữa Backend (Source of Truth) và Frontend Premium, đáp ứng tiêu chí nghiệp vụ Ngân hàng.

---

## 1. 🌟 ĐÃ HOÀN THÀNH (100% DONE)

- [x] **Nạp Key thật FPT AI Factory:** Clone repository `huutrungle2001/hackathon_keys` thành công và nạp API key của Llama-3.3-70B-Instruct & Multilingual E5 Large.
- [x] **Xóa model Local Offline:** Khắc phục triệt để và gỡ bỏ hoàn toàn cấu hình model local `qwen3-4b` mặc định khỏi backend.
- [x] **Đồng bộ API `/models` động:** Cập nhật Frontend gọi API để render động danh sách mô hình thực tế, hiển thị nhãn và provider FPT chuẩn xác.
- [x] **Đồng bộ Đồ thị 3 nhóm nguồn ban hành:** Phân chia động và hiển thị trực quan các nút tài liệu thành 3 nhóm lớn: `Luật` (Quốc hội), `NHNN` (Ngân hàng Nhà nước), và `SHB` (Quy chế nội bộ) với màu sắc viền/handle tương ứng.
- [x] **Đồng bộ trạng thái hiệu lực:** Sử dụng nhãn tiếng Việt `"Còn hiệu lực"` và `"Hết hiệu lực"` khớp 100% với SQLite/Neo4j database thực tế.
- [x] **Cập nhật bộ lọc Kho tài liệu:** Đồng bộ bộ lọc 3 nguồn ban hành và KPIs thống kê theo dữ liệu thật trong SQLite.
- [x] **Kiểm thử API Backend:** Hoàn thành kiểm tra tất cả endpoint (`/models`, `/graph`, `/evaluation/benchmark`, `/admin/stats`, `/chat`) thành công bằng `curl`.
- [x] **Đồng bộ định dạng file nạp văn bản mới (PDF ➔ Markdown `.md`):** Sửa đổi Frontend để chỉ chấp nhận kéo thả file `.md` và thay đổi nhãn chỉ dẫn, đảm bảo khớp với Backend validator.
- [x] **Tối ưu nhãn hiển thị trích dẫn Chatbot (Dynamic Metadata Citations):** Trích xuất `doc_num`, `article`, `clause` từ metadata để sinh nhãn trích dẫn thông minh dạng `Số hiệu - Điều Khoản` thay vì text tĩnh.

---

## 2. 📝 CẦN THỰC HIỆN TIẾP (TODO)

*(Tất cả các hạng mục đồng bộ hóa cốt lõi và tích hợp tính năng nghiệp vụ nâng cao theo CSDL thật đã được hoàn thành xuất sắc 100%!)*
