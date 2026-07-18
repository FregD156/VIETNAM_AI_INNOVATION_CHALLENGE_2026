# CẨM NANG CHIẾN THẮNG VAIC 2026 (MASTER GUIDE)

Tài liệu này tổng hợp toàn bộ thông tin cốt lõi của cuộc thi **Vietnam AI Innovation Challenge 2026 (VAIC 2026)**, chi tiết bài toán **Challenge #16 (AI Agents cho CRM của Bank A)**, các định hướng giải thưởng phụ (FPT & Meta PyTorch), barem chấm điểm và chiến lược triển khai thực chiến của nhóm.

---

## I. TỔNG QUAN LỊCH TRÌNH & YÊU CẦU NỘP BÀI

### 1. Thông tin chung
* **Thời gian**: 17/07/2026 – 19/07/2026 (48 giờ thi đấu liên tục).
* **Địa điểm**: FPT Tower, số 10 Phạm Văn Bạch, Cầu Giấy, Hà Nội.
* **Lịch trình cốt lõi**:
  * **Thứ Sáu 17/07 (11:00)**: Công bố 08 track đề bài & Mở cổng tạo đội.
  * **Thứ Bảy 18/07 (11:00)**: **Checkpoint 1** (Nộp tên dự án, track đã chọn, mô tả sơ bộ).
  * **Thứ Bảy 18/07 (23:00)**: **Checkpoint 2** (Nộp Live Deployed URL & Public GitHub link).
  * **Chủ Nhật 19/07 (11:00)**: **Đóng cổng nộp bài** (Hạn chót, không gia hạn).
  * **Chủ Nhật 19/07 (15:30)**: Công bố Top 10 & Tiến vào Vòng Chung Kết (Demo Day).

### 2. Danh sách 5 hạng mục nộp bài bắt buộc
Để hoàn thành bài dự thi hợp lệ trước 11:00 ngày 19/07, nhóm cần chuẩn bị đầy đủ:
1. **Presentation Slides**: Slide thuyết trình (PDF/PPTX) làm nổi bật giá trị nghiệp vụ, giải pháp AI-native, và tiềm năng startup.
2. **Demo Video ($\le$ 5 phút)**: Video ghi màn hình demo sản phẩm thực tế, chạy tính năng thật (không dùng slide giới thiệu).
3. **GitHub Repository (Public)**: Mã nguồn sạch, có file `README.md` hướng dẫn cài đặt và chạy local bằng tiếng Việt.
4. **Live Deployed URL**: Đường dẫn chạy trực tuyến của ứng dụng web để giám khảo truy cập và thử nghiệm.
5. **AI Collaboration Log**: Nhật ký ghi lại lịch sử cộng tác với các công cụ AI trong quá trình lập trình 48h.

---

## II. BAREM CHẤM ĐIỂM CHI TIẾT (THANG ĐIỂM 100)

| STT | Tiêu chí đánh giá | Điểm tối đa | Lưu ý quan trọng & Cách giải quyết |
| :---: | :--- | :---: | :--- |
| **1** | **Technical Implementation & Engineering Depth** | **20 điểm** | * Yêu cầu: Code chạy thực tế, không dùng mockup tĩnh hay dữ liệu giả lập cứng (hardcoded).<br>* Giải quyết: Kết nối trực tiếp với CRM Sandbox API của Bank A; cài đặt cơ chế tự động chuyển đổi dự phòng (Fallback) sang LLM khác nếu LLM chính bị lỗi. |
| **2** | **AI-Native Architecture & Innovation** | **20 điểm** | * Yêu cầu: AI đóng vai trò trung tâm tạo ra giá trị, không phải là một chatbot dán lên web truyền thống.<br>* Giải quyết: Ứng dụng giao thức **Model Context Protocol (MCP)** và xây dựng luồng xử lý Agent chủ động (Proactive Agent) tự động gợi ý các hành động kế tiếp. |
| **3** | **Business Viability & Pilot Pathway** | **20 điểm** | * Yêu cầu: Giải quyết đúng nỗi đau của RM ngân hàng, có lộ trình pilot thực tế.<br>* Giải quyết: Chứng minh số liệu RM giảm $\ge$ 50% thời gian soạn email/script. Thiết lập lộ trình thử nghiệm 3 tháng cho 50 RM tại Hà Nội & TP.HCM từ tháng 10/2026. |
| **4** | **AI-Native UX & Design Thinking** | **15 điểm** | * Yêu cầu: Giao diện tối giản, trực quan, hỗ trợ người dùng không chuyên.<br>* Giải quyết: Thiết kế giao diện chat cao cấp (Rich Aesthetics), hỗ trợ gõ tiếng Việt không dấu (toneless input) và cung cấp các khung soạn thảo tương tác chỉnh sửa email/script trong 1 click. |
| **5** | **AI Safety, Grounding & Trust** | **15 điểm** | * Yêu cầu: Chống ảo tưởng thông tin, trích dẫn rõ nguồn gốc, bảo mật PII theo Nghị định 13/2023.<br>* Giải quyết: Bắt buộc Agent trích dẫn API nguồn trong phản hồi; tích hợp lớp Guardrail của FPT AI Factory để ẩn danh hóa dữ liệu nhạy cảm; xây dựng Audit Log cho mỗi LLM call. |
| **6** | **Presentation, Demo & Defensibility** | **10 điểm** | * Yêu cầu: Thuyết trình lôi cuốn, trả lời phản biện xuất sắc.<br>* Giải quyết: Thiết lập kịch bản demo xoay quanh "Một ngày làm việc của RM". Chuẩn bị sẵn bộ tài liệu Q&A đối phó với các giám khảo kỹ thuật & nghiệp vụ. |
| | **TỔNG CỘNG** | **100 điểm** | |

---

## III. BÀI TOÁN DOANH NGHIỆP: AI AGENT CRM CHO BANK A (CHALLENGE #16)

### 1. Bối cảnh & Vấn đề cốt lõi
* Mỗi Relationship Manager (RM) của Bank A phải xử lý **50-80 khách hàng/ngày**.
* RM mất **2-3 tiếng mỗi ca làm việc** để tra cứu thủ công, viết email follow-up và soạn kịch bản gọi điện (call script).
* Các giải pháp CRM quốc tế như Salesforce Einstein hay Microsoft Copilot đắt đỏ, không hiểu sâu tiếng Việt và không hỗ trợ nghiệp vụ tài chính đặc thù của Việt Nam.

### 2. Các chỉ số cam kết đầu ra (KPIs)
* **Độ chính xác**: $\ge$ 85% trên bộ 20 ca thử nghiệm chuẩn của Bank A.
* **Tiết kiệm thời gian**: Giảm $\ge$ 50% thời gian soạn thảo email và script của RM.
* **Chuyển đổi ngữ cảnh**: Agent chuyển mượt mà giữa $\ge$ 3 module CRM (Hồ sơ khách hàng, Cơ hội bán hàng, Chiến dịch) trong cùng một cuộc hội thoại.
* **Thời gian phản hồi**: $\le$ 5 giây cho câu hỏi đơn giản, $\le$ 15 giây cho tác vụ tổng hợp phức tạp (soạn email).

### 3. Yêu cầu xử lý ngôn ngữ & Nghiệp vụ Việt Nam
* **Từ viết tắt phổ biến**: Hiểu các thuật ngữ như `KH` (Khách hàng), `ĐNCV` (Điều chỉnh nghiệp vụ), `RM` (Relationship Manager), `CBNV` (Cán bộ nhân viên).
* **Đầu vào**: Hỗ trợ cả chat có dấu và không dấu (do thói quen gõ phím nhanh của RM).
* **Nghiệp vụ**: Hiểu về quy trình KYC, luật tín dụng, bảo hiểm liên kết (Bancassurance) và các sản phẩm tiết kiệm của Bank A.

### 4. Các Endpoint CRM Sandbox API cần tích hợp
* `GET /customers`: Lấy hồ sơ thông tin khách hàng.
* `GET /opportunities`: Lấy danh sách cơ hội bán hàng của khách hàng.
* `GET /interactions`: Xem lịch sử tương tác 12 tháng qua.
* `GET /campaigns`: Xem các chiến dịch tiếp thị đang áp dụng.
* `POST /draft-email`: Soạn thảo email follow-up cá nhân hóa.
* `POST /call-script`: Tạo kịch bản gọi điện chăm sóc khách hàng.

---

## IV. ĐỊNH HƯỚNG TỐI ƯU HÓA GIẢI PHỤ

### 1. Giải phụ FPT AI Factory Award ($10,000 Cloud Credit)
Để đạt giải thưởng này, sản phẩm của chúng ta phải sử dụng **FPT Serverless Inference**:
* **RAG nâng cao**: Sử dụng mô hình nhúng (Embedding) và tái xếp hạng kết quả (**FPT Rerank Model** - `fpt-rerank-large-vi`) để đảm bảo câu trả lời về hồ sơ khách hàng đạt độ chính xác $\ge$ 85%.
* **Bảo mật PII**: Áp dụng **FPT Guardrail Model** để lọc/mã hóa thông tin cá nhân (SĐT, Số tài khoản) trước khi gửi qua API bên thứ ba, đáp ứng 100% Nghị định 13/2023.
* **Mở rộng (Voice Agent)**: Tích hợp **FPT Speech-to-Text (STT)** để chuyển ghi âm lời nói của RM thành ghi chú văn bản lưu vào CRM, và **FPT Text-to-Speech (TTS)** để đọc kịch bản gọi điện.

### 2. Giải phụ Meta PyTorch Award ($5,000 Cash)
Để đạt giải thưởng về hiệu năng kỹ thuật của Meta:
* **Biên dịch mô hình (torch.compile)**: Áp dụng backend **TorchInductor** với cấu hình `torch.compile(model, mode="reduce-overhead")` để tăng tốc độ suy luận của LLM cục bộ (như Llama-3-8B hoặc Qwen-7B) từ 1.5x - 2x.
* **ExecuTorch (Offline Mobile)**: Xuất mô hình LLM nhỏ đã lượng hóa (như Llama-3.2-1B-Instruct) sang định dạng `.pte` để RM có thể chạy Agent ngoại tuyến ngay trên điện thoại di động khi đi gặp khách hàng, đảm bảo dữ liệu không bị rò rỉ lên internet.

---

## V. PHÂN BỔ NHÂN LỰC & KẾ HOẠCH TRIỂN KHAI 48 GIỜ

### 1. Vai trò của các thành viên trong nhóm
* **Trung (Vận trù học & Logistics)**: Phụ trách thuật toán lọc và phân bổ danh sách khách hàng ưu tiên theo ngày; xây dựng kịch bản đề xuất sản phẩm tối ưu (Cross-selling).
* **Minh (Kiến trúc AI & Backend)**: Phụ trách xây dựng MCP Server, RAG Pipeline (với FPT Rerank), tích hợp LLM và thiết lập hệ thống Audit Logging.
* **Duy (eKYC & Frontend/UX)**: Phụ trách xây dựng giao diện chat Web-based, xử lý tiếng Việt không dấu, thiết kế luồng tương tác 1-click chỉnh sửa email/script.
* **Antigravity (AI Co-pilot - Trợ lý của nhóm)**: Đồng hành viết code, sửa lỗi, tối ưu cấu trúc thư mục, chuẩn bị tài liệu kỹ thuật và xây dựng slide thuyết trình.

### 2. Kế hoạch hành động 48 giờ (Action Plan)

```
[17/07 11:00] -- Nhận đề bài & Chốt tạo đội trên Hackathon Platform
      |
[17/07 Chiều] -- Thiết kế Kiến trúc hệ thống, cài đặt MCP Server & dựng Mock Database
      |
[18/07 11:00] -- [Checkpoint 1]: Nộp tên dự án & Bản mô tả hướng tiếp cận ban đầu
      |
[18/07 Chiều] -- Code Frontend UI & Tích hợp API; chạy thử nghiệm torch.compile & FPT Rerank
      |
[18/07 23:00] -- [Checkpoint 2]: Deploy trực tuyến & Nộp Live URL + Github Repository
      |
[19/07 Sáng ] -- Chạy thử bộ 20 testcases, tối ưu hóa độ chính xác và hoàn thiện slide/video
      |
[19/07 11:00] -- Đóng cổng nộp bài (Nộp Slides, Video Demo, AI Log)
```

* **Giai đoạn chuẩn bị (Trước D-Day)**: Thiết lập cấu trúc thư mục sạch sẽ, sẵn sàng các template code cho MCP Server và Frontend để bứt tốc ngay khi có API keys.
