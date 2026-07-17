# KẾ HOẠCH HÀNH ĐỘNG DỰ ÁN: SHB GRAPH-RAG CHATBOT (VERSION 3 - TỐI ƯU ĐẦU VÀO TOÀN DIỆN)

Tài liệu này nâng cấp bản kế hoạch lên **Version 3 (Ultimate Version)**, tập trung đột phá vào giai đoạn **Can thiệp sớm**: Tự động hóa và chuẩn hóa toàn bộ dữ liệu đầu vào (Input) ở cả 2 đầu: **Đầu nạp tài liệu (Ingestion)** và **Đầu vào câu hỏi người dùng (Query)** để đảm bảo dữ liệu đưa vào xử lý đạt chất lượng tốt nhất, từ đó tối ưu hóa độ chính xác của hệ thống RAG lên mức tuyệt đối.

---

## 1. KIẾN TRÚC TỔNG THỂ TÍCH HỢP BỘ LỌC CHUẨN HÓA ĐẦU VÀO (INPUT NORMALIZATION)

Để đạt hiệu năng cao nhất, hệ thống tích hợp hai phân lớp tiền xử lý (Preprocessing Layers) độc lập:

```
[ TÀI LIỆU PDF GỐC ]                                   [ CÂU HỎI THÔ CỦA RM ]
        | (Ví dụ: Scan mờ, bảng biểu méo lệch)                  | (Ví dụ: "nhac toi hop dong cua kh an")
        v                                                       v
=====================================                   =====================================
PHÂN LỚP CHUẨN HÓA NẠP TÀI LIỆU                         PHÂN LỚP CHUẨN HÓA TRUY VẤN
(Ingestion Standardization Layer)                       (Query Standardization Layer)
=====================================                   =====================================
1. Visual Layout-Parser (Florence-2)                     1. Spelling & Accent Auto-Correction
   - Tách header, footer, số trang                        - Điền dấu Tiếng Việt tự động
   - Chuẩn hóa Table thành Markdown                       - Sửa lỗi chính tả bàn phím
2. Entity Resolution & Schema Enforcement               2. Slang & Acronym Expansion Agent
   - Đồng bộ tên viết tắt văn bản                        - KH -> Khách hàng; RM -> RM...
   - Chuẩn hóa mã luật thành ID chung                     - ĐNCV -> Điều chỉnh nghiệp vụ
3. Automatic Reference Link Extraction                  3. Query Decomposition (Phân rã câu hỏi)
   - Tự động bóc tách các điều khoản                      - Chia câu hỏi phức thành các
     dẫn chiếu để làm dữ liệu đồ thị.                       sub-queries để chạy song song.
                                                        4. Hypothetical Document Embedding (HyDE)
                                                          - Sinh tài liệu giả lập trước khi search
=====================================                   =====================================
        |                                                       |
        v                                                       v
[ VECTORSTORE + GRAPH DATABASE ] ------------------------> [ GRAPH-RAG SEARCH ENGINE ]
                                                                |
                                                                v
                                                       [ LLM GENERATOR ]
                                                                |
                                                                v
                                                       [ ĐẦU RA TRÍCH DẪN & CẢNH BÁO ]
```

---

## 2. CHI TIẾT CÁC BƯỚC CAN THIỆP SỚM ĐỘT PHÁ

### 2.1. Phân lớp chuẩn hóa nạp tài liệu (Ingestion Input Standardization)

Quy chế và thông tư ngân hàng thường chứa nhiều bảng biểu phức tạp và có định dạng phi cấu trúc. Nếu nạp thô, Vector DB sẽ lưu trữ các đoạn text bảng biểu đứt gãy, mất ngữ nghĩa.

* **Bước 1: Layout-Aware Parsing & Table Normalization (Chuẩn hóa bảng biểu)**:
  * *Công nghệ*: Sử dụng mô hình thị giác ngôn ngữ nhỏ **Florence-2** hoặc thư viện **Unstructured.io**.
  * *Giải pháp*: Nhận diện cấu trúc trang, loại bỏ hoàn toàn nhiễu ở đầu trang (header), cuối trang (footer) và số trang. Phát hiện các vùng chứa bảng biểu (table), tự động chạy OCR chuyên dụng để tái cấu trúc bảng thành định dạng **Markdown Table** chuẩn trước khi tiến hành chia chunk và embedding.
* **Bước 2: Entity Resolution (Chuẩn hóa thực thể)**:
  * *Vấn đề*: Một văn bản có chỗ viết *"Thông tư 39/2016/TT-NHNN"*, có chỗ viết tắt *"TT 39"*, làm đồ thị tri thức bị phân mảnh (tạo ra nhiều Node khác nhau cho cùng một văn bản).
  * *Giải pháp*: Viết module **Entity Linker** sử dụng quy tắc regex kết hợp LLM nhỏ để nhận diện mọi biến thể viết tắt và quy đổi về một ID thực thể duy nhất (Unified Entity ID) trước khi tạo Node trên Neo4j.
* **Bước 3: Automatic Link Extraction (Tự động bóc tách liên kết)**:
  * Sử dụng LLM trích xuất tự động các câu lệnh dẫn chiếu (Ví dụ: *"thực hiện theo Điểm b Khoản 1 Điều 3 Thông tư Y"*), tự động chuyển đổi thành các liên kết logic dạng JSON và nạp vào Neo4j dưới dạng các cạnh định hướng `[:REFERENCES]`.

### 2.2. Phân lớp chuẩn hóa truy vấn người dùng (User Query Standardization)

RM ngân hàng thường gõ phím nhanh trên điện thoại hoặc máy tính, dẫn đến câu hỏi thiếu dấu, sai chính tả hoặc sử dụng biệt ngữ viết tắt của ngân hàng.

* **Bước 1: Spelling & Accent Auto-Correction (Điền dấu & Sửa lỗi chính tả)**:
  * *Vấn đề*: RM gõ *"xem thu tuc ky c kh an"*
  * *Giải pháp*: Triển khai một mô hình ngôn ngữ dạng Sequence-to-Sequence siêu nhẹ chạy local (hoặc thư viện xử lý tiếng Việt như `Vietnamese-Tone-Correction`) để tự động khôi phục dấu và sửa lỗi chính tả: *"Xem thủ tục KYC khách hàng An"*.
* **Bước 2: Acronym & Slang Expansion Agent (Giải mã viết tắt)**:
  * Hệ thống chạy một từ điển nghiệp vụ ngân hàng được cấu hình động để thay thế các từ viết tắt chuyên ngành trước khi thực hiện tìm kiếm:
    * `KH` -> `Khách hàng`
    * `ĐNCV` -> `Điều chỉnh nghiệp vụ`
    * `CBNV` -> `Cán bộ nhân viên`
    * `L/C` -> `Thư tín dụng (Letter of Credit)`
* **Bước 3: Query Decomposition (Phân rã truy vấn phức)**:
  * *Vấn đề*: Người dùng hỏi *"Quy trình phê duyệt tín dụng của SHB năm 2026 có gì khác so với quy trình cũ năm 2022 về hạn mức?"* -> Đây là câu hỏi so sánh phức hợp, nếu search trực tiếp sẽ cho kết quả rất nhiễu.
  * *Thuật toán*: LLM Parser sẽ phân tách câu hỏi trên thành 2 câu truy vấn con độc lập:
    * *Query 1*: *"Hạn mức phê duyệt tín dụng của SHB năm 2026"*
    * *Query 2*: *"Hạn mức phê duyệt tín dụng của SHB năm 2022"*
  * Hệ thống chạy truy vấn song song trên Graph-RAG, sau đó đưa kết quả của 2 nhánh vào context để LLM tổng hợp so sánh.
* **Bước 4: HyDE (Hypothetical Document Embeddings - Tài liệu giả lập)**:
  * Trước khi tìm kiếm vector, LLM sẽ sinh ra một câu trả lời giả định (hypothetical answer) dựa trên kiến thức có sẵn của nó. Hệ thống sử dụng vector embedding của câu trả lời giả định này để đi tìm kiếm tài liệu thật trong database. Kỹ thuật này giúp tăng độ chính xác tìm kiếm ngữ nghĩa lên 20-30% đối với các văn bản pháp lý khô khan.

---

## 3. THAY ĐỔI TRONG CẤU TRÚC CÔNG NGHỆ (ADDITIONAL TECH STACK)

Để phục vụ phân lớp chuẩn hóa đầu vào này, chúng ta tích hợp thêm một số công nghệ bổ trợ:

| Thành phần chuẩn hóa | Công nghệ bổ sung | Vai trò |
| :--- | :--- | :--- |
| **OCR & Layout Analysis** | **Florence-2 / ColPali** | Mô hình Vision-LLM nhỏ chạy cục bộ để phân tích bố cục trang PDF và trích xuất bảng biểu. |
| **Tiền xử lý Tiếng Việt** | **PyVi / Underthesea** | Phân tích cú pháp, tách từ và chuẩn hóa từ viết tắt Tiếng Việt. |
| **Sửa lỗi & Điền dấu** | **Vietnamese Tone Corrector** | Mô hình học máy nhỏ dùng để tự động khôi phục dấu tiếng Việt cho các câu hỏi gõ nhanh của RM. |

---

## 4. KẾ HOẠCH HÀNH ĐỘNG 48 GIỜ NÂNG CẤP (VERSION 3)

### [Giờ 0 - Giờ 12]: Phát triển Ingestion Parser & Chuẩn hóa PDF
* Cài đặt bộ thư viện OCR và Layout-aware parser.
* Viết script chuẩn hóa bảng biểu trong PDF thành Markdown Table và đồng bộ hóa ID thực thể văn bản (Entity Resolution).
* Nạp thử nghiệm tài liệu và kiểm tra cấu trúc đồ thị Neo4j được chuẩn hóa tự động.

### [Giờ 12 - Giờ 24]: Xây dựng API Tiền xử lý Truy vấn (Query Preprocessing)
* Lập trình module tự động sửa lỗi chính tả, khôi phục dấu tiếng Việt và giải mã từ viết tắt.
* Hiện thực hóa thuật toán phân rã câu hỏi (Query Decomposition) và tích hợp kỹ thuật HyDE.
* Kết nối bộ lọc chuẩn hóa đầu vào này với API Hybrid Search của Neo4j và Qdrant.
* **Nộp Checkpoint 1 (Nêu bật đột phá ở khả năng can thiệp sớm, tự động hóa chuẩn hóa dữ liệu đầu vào để bảo đảm chất lượng RAG)**.

### [Giờ 24 - Giờ 36]: Thiết kế UI/UX & Dashboard Admin
* Hoàn thiện Frontend:
  * Dashboard Admin hiển thị kết quả phân tích layout PDF và các bảng biểu đã được định dạng lại.
  * Khung chat hiển thị câu hỏi thô sau khi đã được AI tự động sửa lỗi/khôi phục dấu để người dùng kiểm tra độ chính xác của câu hỏi.
* Deploy hệ thống trực tuyến.
* **Nộp Checkpoint 2 (Nộp Live URL và Github)**.

### [Giờ 36 - Giờ 48]: Đo lường Benchmark & Đóng gói sản phẩm
* Chạy benchmark so sánh: (1) RAG truyền thống, (2) Graph-RAG thông thường (V2), và (3) Graph-RAG tích hợp bộ chuẩn hóa đầu vào (V3).
* Xuất biểu đồ chứng minh **Graph-RAG + Input Normalization** đạt tỷ lệ chính xác vượt trội ($\ge 95\%$).
* Quay video demo tập trung vào khả năng tự động xử lý tài liệu phức tạp, tự động khôi phục câu hỏi không dấu và so sánh mâu thuẫn chính xác.
* Đóng cổng nộp bài.
