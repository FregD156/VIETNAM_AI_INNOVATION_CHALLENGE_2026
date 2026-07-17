# KẾ HOẠCH HÀNH ĐỘNG DỰ ÁN: SHB GRAPH-RAG CHATBOT (VERSION 4 - PRODUCTION-GRADE & TỐI ƯU HÓA)

Tài liệu này nâng cấp bản kế hoạch lên **Version 4 (Ultimate Production-grade)**, tích hợp các công nghệ và thuật toán tối ưu hóa cấp độ doanh nghiệp lớn (Enterprise-grade) nhằm tối ưu hóa hiệu năng, giảm chi phí vận hành (Token cost), bảo mật tuyệt đối dữ liệu ngân hàng và đảm bảo tính phòng thủ hệ thống. Cuối tài liệu là bảng tổng hợp công nghệ của cả 4 phiên bản.

---

## 1. CÁC THUẬT TOÁN & Ý TƯỞNG CÔNG NGHỆ BỔ SUNG Ở VERSION 4

Để giải quyết bài toán phức tạp của SHB ở quy mô hàng triệu người dùng và hàng chục ngàn văn bản, hệ thống được nâng cấp với các công nghệ đột phá sau:

```
                                     [ USER QUERY ]
                                           |
                                           v
                          [ Phân Lớp Tiền Xử Lý (Spelling, Acronym) ]
                                           |
                                           v
                       [ Llama-Guard 3: Bảo vệ Prompt Injection ]
                                           |
                                           v
                   [ Multi-Agent Orchestrator (LangGraph / CrewAI) ]
                    /            |                 |            \
                   v             v                 v             v
            [Agent: Vector]  [Agent: Graph]  [Agent: Temporal]  [Agent: NLI Auditing]
                   \             |                 |            /
                    v            v                 v           v
                     [ Graph-Weighted RRF (Rerank & Fusion) ]
                                           |
                                           v
                        [ LLMLingua: Nén ngữ cảnh / Coi nhỏ Token ]
                                           |
                                           v
                       [ LLM Engine (GPT-4o/Claude 3.5/Local LLM) ]
                                           |
                                           v
                               [ CÂU TRẢ LỜI CÓ TRÍCH DẪN ]
```

### 1.1. Visual Document Retrieval bằng ColPali (Không cần phân tách text)
* **Vấn đề**: Việc phân tách PDF (parsing) bằng OCR thông thường và chia đoạn (chunking) bằng text rất dễ mất mát dữ liệu bảng biểu, biểu đồ, sơ đồ quy trình của SHB.
* **Giải pháp của V4**: Sử dụng **ColPali** (mô hình nhúng dựa trên Vision-Language Model PaliGemma). 
* **Cách hoạt động**:
  * Thay vì đọc text, hệ thống nhúng (embed) trực tiếp các hình ảnh trang PDF gốc của tài liệu thành các vector biểu diễn không gian trang.
  * Khi truy vấn, hệ thống tìm trực tiếp trang PDF có hình ảnh khớp nhất với câu hỏi ngữ nghĩa của người dùng. Trang PDF này sau đó được chuyển trực tiếp vào mô hình Multimodal LLM (như Claude 3.5 Sonnet) để đọc hiểu và trả lời, giữ nguyên 100% định dạng trực quan (Layout, Font, Bảng biểu, Chữ ký).

### 1.2. Thuật toán Graph-Weighted RRF (Reciprocal Rank Fusion - Hợp nhất thứ hạng nâng cao)
* **Vấn đề**: Làm thế nào để trộn kết quả từ Vector Search (ngữ nghĩa), BM25 (từ khóa) và Graph DB (đồ thị liên kết) để chọn ra những điều khoản tốt nhất?
* **Giải pháp**: Áp dụng công thức **Reciprocal Rank Fusion có trọng số Đồ thị (G-RRF)**.
* **Cách hoạt động**:
  * Hệ thống chạy PageRank trên đồ thị văn bản Neo4j để xác định các văn bản mang tính nền tảng (ví dụ: Thông tư NHNN có chỉ số PageRank cao vì được nhiều quy trình nội bộ trỏ tới).
  * Công thức tính điểm hợp nhất cho tài liệu $d$:
  $$RRF\_Score(d) = \frac{w_v}{k + r_{vector}(d)} + \frac{w_b}{k + r_{bm25}(d)} + w_g \cdot PageRank(d)$$
  *(Trong đó $r(d)$ là thứ hạng của tài liệu trong các tìm kiếm, $w_v, w_b, w_g$ là trọng số, $k$ là hằng số).*
  * Thuật toán này giúp đẩy các điều khoản cốt lõi, có hiệu lực pháp lý cao nhất lên hàng đầu khi câu hỏi của người dùng bị chung chung.

### 1.3. Kiến trúc Multi-Agent Collaborative (Phối hợp đa tác nhân)
Thay vì sử dụng một LLM duy nhất xử lý từ đầu đến cuối, chúng ta phân chia công việc cho các Agent chuyên biệt bằng framework **LangGraph / CrewAI**:
1. **Supervisor Agent (Điều phối viên)**: Phân tích câu hỏi, điều phối công việc cho các Agent khác và duyệt câu trả lời cuối cùng.
2. **Retriever Agent (Truy xuất chuyên sâu)**: Gọi API Qdrant và Neo4j để lấy chunks và duyệt đồ thị.
3. **Temporal Auditor Agent (Kiểm toán thời gian)**: Chạy thuật toán Temporal DAG lọc phiên bản điều khoản hiệu lực.
4. **NLI Compliance Auditor Agent (Kiểm soát tuân thủ)**: Chạy so sánh logic NLI phát hiện mâu thuẫn giữa quy định nội bộ và luật nhà nước.
5. **Drafting Agent (Soạn thảo & Trích dẫn)**: Soạn thảo câu trả lời tiếng Việt, chèn Citation tag và định dạng báo cáo.

### 1.4. Nén ngữ cảnh bằng LLMLingua (Tiết kiệm Token & Giảm độ trễ)
* **Vấn đề**: Context lấy từ Graph RAG (gồm nhiều điều khoản và sơ đồ liên kết) có dung lượng token cực lớn, làm tăng chi phí API và tăng thời gian phản hồi (Latency).
* **Giải pháp**: Tích hợp thuật toán **LLMLingua (Context Compression)**.
* **Cách hoạt động**: LLMLingua sử dụng một mô hình ngôn ngữ siêu nhỏ để đo lường độ phức tạp (perplexity) của các từ trong context. Hệ thống sẽ tự động lược bỏ các từ ngữ pháp pháp lý thừa mà không làm thay đổi nội dung ngữ nghĩa cốt lõi của điều luật, giúp **nén context nhỏ đi 30% - 50%** trước khi gửi lên LLM chính, giúp giảm chi phí token và đẩy tốc độ sinh phản hồi lên gấp đôi.

### 1.5. Hệ thống Guardrail Bảo vệ An toàn (Llama-Guard 3)
* Tích hợp **Llama-Guard 3** tại cổng API Gateway để sàng lọc:
  * *Đầu vào*: Ngăn chặn các nỗ lực tấn công tiêm mã độc (Prompt Injection), phá vỡ giới hạn hệ thống (Jailbreak).
  * *Đầu ra*: Đảm bảo câu trả lời của chatbot không chứa thông tin nhạy cảm, ngôn từ không phù hợp hoặc dữ liệu khách hàng chưa mã hóa.

---

## 2. BẢNG TỔNG HỢP CÔNG NGHỆ QUA 4 PHIÊN BẢN (TECHNOLOGY EVOLUTION MATRIX)

Dưới đây là sơ đồ tiến hóa công nghệ của dự án từ phiên bản cơ bản đến phiên bản doanh nghiệp đột phá:

| Tầng chức năng | Version 1 (Cơ bản) | Version 2 (Advanced) | Version 3 (Input Standard) | Version 4 (Production-Grade) |
| :--- | :--- | :--- | :--- | :--- |
| **PDF Ingestion** | PyPDF / PDFReader | PDF Reader + Metadata Extract | **Layout-Aware PDF Parser** (Florence-2 / Unstructured.io) | **ColPali Direct Vision Embedding** (Tránh parsing lỗi) |
| **Databases** | SQLite / JSON | **Neo4j** (Graph) + **Qdrant** (Vector) | Neo4j + Qdrant (Entity Resolution) | Neo4j + Qdrant + Cache Store |
| **Retrieval Algorithms**| Vector Semantic Search | Hybrid (Vector + Cypher cơ bản) | Hybrid + **HyDE** + **Query Decomposition** | **Graph-Weighted RRF** (PageRank + BM25 + Vector) |
| **Logic & Compliance**| Kiểm tra thủ công | **Temporal DAG Versioning** + **DeBERTa NLI** | Temporal DAG + NLI | **Multi-Agent LangGraph Orchestrator** |
| **Tối ưu hóa (Latency & Cost)**| Không tối ưu | **`torch.compile`** (biên dịch CUDA kernel) | Caching layer | **LLMLingua** (Nén 50% Context Token) |
| **Language Processing**| Tiếng Việt cơ bản | Từ điển nghiệp vụ | **Vietnamese Tone Corrector** (Điền dấu, sửa lỗi chính tả) | Tiền xử lý tự động đa ngôn ngữ + Che dấu PII (Guardrail) |
| **An toàn & Bảo mật** | Không bảo mật | Mã hóa DB | Che dấu dữ liệu cá nhân (NĐ 13) | **Llama-Guard 3** (Anti-Prompt Injection & Jailbreak) |
| **Frameworks / LLM** | LangChain / GPT-3.5 | LlamaIndex / Qwen-7B / GPT-4 | LlamaIndex / local spelling | LangGraph / CrewAI / Claude 3.5 Sonnet / GPT-4o |
| **UI / UX Features** | Chatbot cơ bản | Chatbot + Trích dẫn nguồn | Chatbot (Clickable Citation) + Graph Viz | Chat + Graph Visualizer + Timeline + Admin Dashboard |
| **Evaluation / Test** | Kiểm thử tay | **Ragas & TruLens** (RAG Triad) | Benchmark tự động | **CI/CD Continuous Evaluation Pipeline** |

---

## 3. KẾ HOẠCH HÀNH ĐỘNG 48 GIỜ NÂNG CẤP TOÀN DIỆN (TIMELINE VER 4)

* **[Giờ 0 - Giờ 12]**: Triển khai hạ tầng DB (Qdrant & Neo4j); chạy pipeline nạp tài liệu bằng **ColPali** để lưu hình ảnh trang PDF; xây dựng Đồ thị tri thức có tích hợp PageRank.
* **[Giờ 12 - Giờ 24]**: Phát triển backend FastAPI chứa **Multi-Agent LangGraph**; cài đặt thuật toán **Graph-Weighted RRF** và **LLMLingua** nén token; tích hợp **Llama-Guard 3** làm bộ lọc an toàn. **Nộp Checkpoint 1 (Nêu bật kiến trúc Multi-Agent & RRF đột phá)**.
* **[Giờ 24 - Giờ 36]**: Xây dựng Frontend React tích hợp Graph Explorer và Timeline điều khoản; kết nối API Backend; deploy hệ thống lấy Live URL. **Nộp Checkpoint 2 (Nộp Live URL và Github)**.
* **[Giờ 36 - Giờ 48]**: Chạy Benchmark kiểm định tự động bằng Ragas; tối ưu hóa mô hình cục bộ bằng `torch.compile` hoặc ExecuTorch; hoàn thiện kịch bản thuyết trình và quay video demo. Đóng cổng nộp bài.
