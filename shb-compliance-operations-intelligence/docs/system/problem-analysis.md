# BẢN PHÂN TÍCH KỸ THUẬT ĐẢO NGƯỢC (REVERSE ENGINEERING) ĐỀ BÀI
**Đề tài:** Advanced RAG Knowledge Base – AI Chatbot for Complex Banking Document Retrieval

---

## 1. BTC thực sự muốn giải quyết vấn đề gì?
BTC không đơn thuần tìm kiếm một chatbot hỏi đáp thông thường (Q&A). Vấn đề cốt lõi họ đang đối mặt là: **Sự mất an toàn tuân thủ pháp lý (Compliance Risk) trong vận hành ngân hàng phát sinh từ sự đứt gãy thông tin quy định.**
*   **Vấn đề của quy định ngân hàng:** Tài liệu quy định (nội bộ và từ các cơ quan quản lý như SBV, Chính phủ) rất đồ sộ, thay đổi liên tục. Một văn bản mới ra đời có thể sửa đổi một phần, thay thế hoàn toàn hoặc một phần của nhiều văn bản cũ, trong khi các phần khác của văn bản cũ vẫn giữ nguyên hiệu lực.
*   **Điểm yếu của RAG truyền thống (Naive RAG):** Tìm kiếm ngữ nghĩa dựa trên Vector Similarity hoàn toàn "mù" về mặt thời gian và logic hiệu lực văn bản. RAG thông thường sẽ truy xuất cả những đoạn văn bản cũ đã hết hiệu lực nếu chúng có độ tương đồng vector cao với câu hỏi, dẫn đến chatbot trả lời thông tin lỗi thời. Nhân viên làm theo thông tin này sẽ gây ra hậu quả pháp lý nghiêm trọng.
*   **Mục tiêu thực sự:** Xây dựng một **hệ thống quản trị tri thức động (Dynamic Knowledge Management)** đảm bảo thông tin truy xuất ra luôn có tính **đúng đắn pháp lý tại thời điểm truy vấn**.

---

## 2. Họ đã gợi ý những giải pháp nào?
Đề bài đã vạch sẵn các mảnh ghép kỹ thuật mà BTC cho là cần thiết để giải quyết bài toán:
*   **Về biểu diễn tri thức:** Dựng đồ thị tri thức (**Knowledge Graph** bằng Neo4j hoặc NetworkX) để mô hình hóa mối quan hệ tham chiếu chéo chằng chịt giữa các tài liệu.
*   **Về quản lý vòng đời tài liệu:** Thiết kế một **Versioning engine** và cơ chế **Chunk-level supersession tracking** (theo dõi thay thế đến cấp độ từng phân đoạn văn bản nhỏ/điều khoản thay vì toàn bộ file).
*   **Về công cụ truy xuất:** Hệ thống tìm kiếm kết hợp **Hybrid Search** (Vector Search tìm ngữ nghĩa + BM25 tìm từ khóa kỹ thuật chính xác + Duyệt đồ thị để lần theo các mối quan hệ tham chiếu chéo).
*   **Về kiểm chuẩn:** Yêu cầu phải có bảng so sánh hiệu năng (**Benchmark comparison**) để chứng minh giải pháp đề xuất vượt trội rõ rệt so với Standard RAG.

---

## 3. Điều gì trong đề bài là bắt buộc (Must-Have)?
Để giải pháp được coi là hợp lệ và giải quyết được đề bài, các yếu tố sau là **bắt buộc**:
1.  **Xử lý tham chiếu chéo (Cross-references):** Đi theo liên kết để tổng hợp thông tin từ nhiều tài liệu liên quan trong câu trả lời.
2.  **Xử lý sửa đổi & thay thế một phần (Amendments & Partial supersession):** Phải lọc bỏ hoàn toàn các điều khoản đã hết hiệu lực, chỉ trả về phiên bản mới nhất đang có hiệu lực.
3.  **Phát hiện mâu thuẫn (Conflicting regulations):** Phải nhận diện được sự không nhất quán giữa các tài liệu trong hệ thống và đưa ra cảnh báo cho người dùng.
4.  **Minh chứng nguồn gốc (Citations):** Câu trả lời của chatbot bắt buộc phải trích dẫn nguồn cụ thể để kiểm chứng.
5.  **Hệ thống quản trị (Admin Dashboard & Timeline):** Admin phải cập nhật được tài liệu và hệ thống phải biểu diễn được dòng thời gian phiên bản của điều khoản.

---

## 4. Điều gì chỉ là gợi ý (Nice-to-Have / Tech Stack)?
Những yếu tố này chỉ mang tính tham khảo, các đội thi hoàn toàn có thể thay thế bằng các giải pháp tốt hơn:
*   **Hệ quản trị đồ thị cụ thể:** Việc chỉ định Neo4j hay NetworkX chỉ là ví dụ. Bạn có thể dùng các Graph DB khác hoặc thậm chí tự tối ưu hóa cấu trúc đồ thị trên các cơ sở dữ liệu quan hệ/vector nếu hiệu quả hơn.
*   **Mô hình Embedding:** Đề bài gợi ý PhoBERT hay multilingual-e5. Bạn hoàn toàn có thể tự chọn hoặc tinh chỉnh (fine-tune) các mô hình embedding khác phù hợp hơn với ngôn ngữ pháp lý/tài chính.
*   **Công nghệ Giao diện/Backend:** FastAPI + Streamlit/React chỉ là gợi ý để làm demo nhanh. Kiến trúc thực tế của sản phẩm thương mại có thể yêu cầu bảo mật và khả năng mở rộng cao hơn thế.

---

## 5. Điều gì là cơ hội để tạo khác biệt (Differentiators)?
Đây là những điểm mà nếu làm xuất sắc, đội thi sẽ tách tốp khỏi các đối thủ khác:
*   **Tự động hóa xây dựng Đồ thị tri thức (Auto-Graph Construction):** Việc tự động đọc hàng nghìn trang PDF rồi tự động phân tích cú pháp (parser) để phát hiện thực thể và tạo quan hệ đồ thị (ví dụ: tự động phát hiện cụm từ *"được sửa đổi bởi Khoản 2 Điều 1 Thông tư X"* để tạo liên kết tự động) mà không cần nhập liệu thủ công bằng tay.
*   **Trích xuất cấu trúc phân cấp sâu (Hierarchy Ingestion):** Khả năng bóc tách cấu trúc văn bản ngân hàng cực kỳ phức tạp (Chương -> Mục -> Điều -> Khoản -> Điểm) để định danh chính xác phạm vi bị thay thế (ví dụ: chỉ thay thế Điểm a Khoản 2 Điều 3, các điểm khác giữ nguyên).
*   **Phân loại và Gợi ý hướng xử lý mâu thuẫn:** Đề bài chỉ yêu cầu "phát hiện mâu thuẫn và cảnh báo". Đội nào xây dựng được thuật toán phân loại mâu thuẫn (ví dụ: mâu thuẫn số liệu, mâu thuẫn do độ trễ hiệu lực) và đưa ra gợi ý giải quyết cho chuyên viên tuân thủ sẽ ghi điểm tuyệt đối.
*   **Tính khả thi trong môi trường đóng (On-Premise/Offline):** Ngân hàng kiểm soát dữ liệu cực kỳ khắt khe và thường không cho phép gửi dữ liệu nội bộ ra ngoài API cloud (như OpenAI). Đội nào tối ưu hóa được hệ thống chạy mượt mà với mô hình LLM mã nguồn mở (Local LLM như Qwen, Llama 3) sẽ có tính thực tiễn cao nhất.

---

## 6. Nếu tất cả đội đều làm đúng theo đề, làm thế nào để vượt lên?
Khi tất cả đều đáp ứng đủ các tính năng bắt buộc, sự khác biệt nằm ở **độ tin cậy được chứng minh bằng định lượng** và **trải nghiệm thực tế**:
*   **Xây dựng bộ dữ liệu đánh giá (Gold Dataset & Evaluation Pipeline) nghiêm túc:** Đưa ra các kịch bản kiểm thử "cực đoan" (Edge Cases) - ví dụ: một điều khoản bị sửa đổi 3 lần qua 3 năm bởi 3 thông tư khác nhau. Chứng minh bằng số liệu định lượng (sử dụng Ragas, TruLens hoặc LLM-as-a-judge) rằng hệ thống của mình không bị sai sót thông tin cũ so với Standard RAG.
*   **Khả năng OCR tài liệu kém chất lượng:** Tài liệu ngân hàng lưu trữ lâu năm thường là bản scan mờ hoặc có bảng biểu phức tạp. Một pipeline xử lý ảnh và bảng biểu (Table Parsing) chất lượng cao sẽ quyết định chất lượng đầu vào của RAG.
*   **Trải nghiệm so sánh trực quan (Diff Viewer):** Khi phát hiện ra điều khoản thay đổi hoặc mâu thuẫn, giao diện phải hiển thị trực quan bản cũ và bản mới nằm song song nhau (highlight các từ bị sửa đổi/xóa bỏ) để người dùng đưa ra quyết định ngay lập tức mà không cần tự đối chiếu bằng mắt.

---

## 7. Theo bạn BGK sẽ đánh giá cao điều gì nhất?
BGK (bao gồm các chuyên gia công nghệ và lãnh đạo nghiệp vụ ngân hàng) sẽ đánh giá cao nhất:
1.  **Độ tin cậy tuyệt đối (Zero-Hallucination Guardrails):** Trong ngân hàng, thà chatbot trả lời *"Tôi không tìm thấy quy định đang hiệu lực"* còn tốt hơn gấp trăm lần việc trả lời *"Tự tin nhưng sai luật"* dẫn tới phạt hành chính hoặc kiện tụng.
2.  **Khả năng tự động hóa luồng vận hành (Operational Feasibility):** Hệ thống phải là một cỗ máy tự vận hành. Khi ngân hàng tải lên một văn bản mới, hệ thống tự động bóc tách, tự động liên kết đồ thị, tự cập nhật lại vết hiệu lực của các văn bản cũ mà không cần lập trình viên cấu hình lại.
3.  **Tối ưu hóa chi phí vận hành:** Giải pháp thông minh trong việc phân cấp truy xuất (ví dụ: chỉ gọi LLM đắt tiền khi thực sự cần tổng hợp phức tạp, còn các truy vấn thông thường sử dụng các mô hình nhỏ/nội bộ để tiết kiệm tài nguyên).

---

## 8. Theo bạn đâu là "linh hồn" của bài toán?
*   Linh hồn của bài toán nằm ở **Mô hình hóa dữ liệu theo Trục Thời gian và Quan hệ (Temporal & Relational Data Modeling)**.
*   Quy định ngân hàng không phải là các khối văn bản tĩnh đứng độc lập. Chúng là một **thực thể tri thức sống động** biến đổi liên tục theo thời gian và ràng buộc chặt chẽ lẫn nhau.
*   Do đó, linh hồn của hệ thống nằm ở **Thiết kế Đồ thị Tri thức kết hợp với Công cụ quản lý hiệu lực (Versioning Graph Schema)**. LLM chỉ đóng vai trò là "giao diện ngôn ngữ tự nhiên" ở bước cuối cùng để đọc hiểu và tổng hợp kết quả. Đội nào thiết kế được một cấu trúc cơ sở dữ liệu biểu diễn trọn vẹn được trạng thái hiệu lực của từng điều khoản tại bất kỳ thời điểm nào trong quá khứ, hiện tại và tương lai, đội đó sẽ giành chiến thắng.
