# Phân Tích & Hướng Dẫn Sử Dụng FPT AI Factory Serverless Inference

Tài liệu này phân tích chi tiết về dịch vụ **Serverless Inference** của **FPT AI Factory**, đánh giá mức độ phù hợp với đề tài **AI Agent CRM cho Bank A** (Challenge #16), hướng dẫn cách sử dụng, tối ưu hóa và so sánh ưu/nhược điểm nhằm phục vụ cho mục tiêu tranh giải phụ **FPT Award**.

--- 

## 1. Tổng Quan về FPT AI Factory & Serverless Inference

**FPT AI Factory** là nền tảng điện toán đám mây AI (AI Cloud) toàn diện được phát triển bởi FPT, hợp tác chiến lược với NVIDIA. Hạ tầng được vận hành trên các cụm siêu máy tính GPU NVIDIA Hopper H100 và H200 đặt tại Việt Nam và Nhật Bản, tuân thủ các tiêu chuẩn bảo mật quốc tế khắt khe nhất.

Dịch vụ **Serverless Inference** thuộc hệ sinh thái FPT AI Inference, cho phép các nhà phát triển triển khai và gọi các mô hình AI thông qua API mà không cần quan tâm đến việc thiết lập, quản lý hay duy trì hạ tầng máy chủ GPU vật lý. 

* **Mô hình thanh toán:** Pay-as-you-go (trả tiền theo lượng token thực tế sử dụng), giúp tối ưu hóa chi phí.
* **Thời gian phản hồi:** Tốc độ phản hồi cực nhanh với thời gian tạo token đầu tiên (Time to First Token - TTFT) **dưới 1 giây**.
* **Ưu đãi dùng thử:** Hỗ trợ dùng thử với tài khoản Free Trial tặng kèm lên đến $1 (tương đương tối đa **100 triệu tokens miễn phí** tùy loại mô hình).

---

## 2. Các Tính Năng & Khả Năng Cốt Lõi (Core Capabilities)

* **Hơn 20+ mô hình AI đa dạng và độc quyền:**
  * **Large Language Models (LLM):** Các mô hình ngôn ngữ lớn tối ưu hóa cho Tiếng Việt và các mô hình mã nguồn mở hàng đầu thế giới (DeepSeek, Qwen, Llama,...).
  * **Vision Language Models (VLM):** Mô hình đa phương thức hỗ trợ nhận diện và xử lý hình ảnh.
  * **Speech-to-Text (STT) & Text-to-Speech (TTS):** Chuyển đổi giọng nói thành văn bản và ngược lại, hỗ trợ nhận diện giọng nói vùng miền Việt Nam với độ chính xác cao.
  * **Embedding & Rerank Models:** Mô hình nhúng và xếp hạng kết quả, cực kỳ quan trọng cho hệ thống tìm kiếm ngữ nghĩa RAG.
  * **Guardrail Models:** Mô hình bảo vệ và kiểm soát nội dung đầu vào/đầu ra của LLM, ngăn chặn mã độc ngôn từ hoặc rò rỉ thông tin nhạy cảm.
* **API Tương Thích Hoàn Toàn với OpenAI:**
  * Cung cấp endpoint tương thích với thư viện `openai` SDK. Nhà phát triển chỉ cần đổi `base_url` và `api_key` là có thể chuyển đổi toàn bộ mã nguồn có sẵn sang chạy trên FPT AI Factory mà không cần viết lại logic code.
* **Hỗ trợ Tự Triển Khai LoRA (LoRA Deployment):**
  * Tích hợp với công cụ **FPT AI Studio** để fine-tune mô hình bằng kỹ thuật LoRA (Low-Rank Adaptation) trên dữ liệu riêng của doanh nghiệp, sau đó deploy serverless trực tiếp để phục vụ inference với chi phí cực thấp (pay-per-token thay vì thuê GPU chuyên dụng).
* **Bảo Mật Private Serving Mode:**
  * Cho phép đóng gói và phục vụ mô hình trong môi trường hoàn toàn cô lập, đáp ứng tiêu chuẩn an toàn thông tin khắt khe của các ngành Tài chính - Ngân hàng.

---

## 3. Đánh Giá Mức Độ Phù Hợp với Dự Án CRM Bank A (Challenge #16)

Đề bài đặt ra là xây dựng một **AI Agent CRM cho Relationship Manager (RM)** của **Bank A** với các yêu cầu đặc thù về ngôn ngữ Việt Nam, bảo mật thông tin và khả năng phản hồi nhanh. FPT Serverless Inference giải quyết hoàn hảo các yêu cầu này:

| Yêu cầu của Bank A | Giải pháp từ FPT Serverless Inference |
| :--- | :--- |
| **Hiểu nghiệp vụ & Từ viết tắt Tiếng Việt** (KH, RM, ĐNCV, CBNV, chat có dấu và không dấu). | Sử dụng các mô hình LLM chuyên biệt về Tiếng Việt của FPT được huấn luyện sâu trên dữ liệu nội địa Việt Nam. |
| **Xử lý RAG chính xác** để RM tra cứu hồ sơ khách hàng, quy định tín dụng, sản phẩm tiết kiệm. | Tích hợp bộ đôi **Embedding Model** và **Rerank Model** của FPT để tối ưu hóa độ chính xác của RAG, nâng tỷ lệ chính xác phản hồi đạt `>= 85%` theo yêu cầu. |
| **Tốc độ phản hồi cực nhanh** (Dưới 5 giây cho câu hỏi đơn giản, dưới 15 giây cho tác vụ soạn email/kịch bản cuộc gọi). | TTFT dưới 1 giây nhờ chạy trực tiếp trên cụm GPU H100/H200 đặt tại Việt Nam, giảm độ trễ đường truyền viễn thông quốc tế. |
| **Tuân thủ Luật An ninh mạng & Nghị định 13/2023** về bảo vệ dữ liệu cá nhân ngân hàng. | Dữ liệu được lưu trữ và xử lý hoàn toàn tại Việt Nam (On-premise / Local Cloud). Tích hợp **Guardrail Model** để tự động phát hiện, chặn lọc hoặc ẩn danh hóa (anonymize) thông tin PII trước khi gửi đến mô hình. |
| **Mở rộng tính năng CRM (Voice Agent)** để RM gọi điện hoặc ghi âm ghi chú cuộc gọi. | Sử dụng **TTS** và **STT** của FPT để tự động chuyển kịch bản gọi điện (call script) thành giọng nói tự nhiên hoặc ghi âm cuộc hội thoại của RM và transribe thành văn bản cập nhật vào CRM. |

---

## 4. Hướng Dẫn Sử Dụng Chi Tiết & Code Mẫu (Integration)

Vì FPT Serverless Inference hoàn toàn tương thích với OpenAI API, việc tích hợp vào dự án Node.js hoặc Python cực kỳ đơn giản.

### 4.1. Cấu hình trên Python
Cài đặt thư viện:
```bash
pip install openai
```

Mẫu code gọi LLM Inference:
```python
import os
from openai import OpenAI

# Khởi tạo client với Endpoint của FPT AI Factory
client = OpenAI(
    base_url="https://api.factory.fpt.ai/v1",  # URL Gateway của FPT
    api_key=os.environ.get("FPT_AI_FACTORY_API_KEY") # API Key lấy từ FPT Cloud Marketplace
)

# Gọi mô hình chat (Ví dụ: FPT-hosted model hoặc open-source model)
response = client.chat.completions.create(
    model="fpt-llama-3-8b-instruct",  # Thay thế bằng model mong muốn trên Marketplace
    messages=[
        {"role": "system", "content": "Bạn là trợ lý AI chuyên nghiệp hỗ trợ Relationship Manager của ngân hàng Bank A."},
        {"role": "user", "content": "Soạn giúp tôi một email nhắc nhở khách hàng Nguyễn Văn An về khoản tiết kiệm 200 triệu sắp đến hạn vào tuần tới."}
    ],
    temperature=0.3,
    max_tokens=1000
)

print(response.choices[0].message.content)
```

### 4.2. Tích hợp Rerank Model trong Python (Tối ưu RAG)
```python
import requests

def fpt_rerank(query, documents, top_n=3):
    url = "https://api.factory.fpt.ai/v1/rerank"
    headers = {
        "Authorization": f"Bearer {os.environ.get('FPT_AI_FACTORY_API_KEY')}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "fpt-rerank-large-vi",
        "query": query,
        "documents": documents,
        "top_n": top_n
    }
    response = requests.post(url, json=data, headers=headers)
    return response.json()
```

---

## 5. So Sánh Sự Vượt Trội & Ưu / Nhược Điểm

### 5.1. So sánh FPT Serverless Inference vs. Các giải pháp khác

| Tiêu chí | FPT Serverless Inference | Hyperscalers (AWS/GCP/Azure) | API trực tiếp (OpenAI/Anthropic) |
| :--- | :--- | :--- | :--- |
| **Vị trí đặt máy chủ** | Việt Nam & Nhật Bản | Singapore / Mỹ / Châu Âu | Mỹ / Châu Âu |
| **Độ trễ mạng tại VN** | Rất thấp (máy chủ vật lý đặt trực tiếp trong nước) | Trung bình (phụ thuộc cáp biển đi Singapore/Hồng Kông) | Cao (dễ bị ảnh hưởng khi đứt cáp quang biển) |
| **Độ tối ưu Tiếng Việt** | Rất cao (Có các model chuyên biệt do FPT tự train) | Thấp (chỉ chạy model gốc của hãng) | Tốt (Mô hình lớn hiểu tốt nhưng chi phí cao) |
| **Chi phí** | Rẻ hơn gấp **5 lần** so với việc tự thuê GPU ảo trên AWS/GCP | Đắt (Phải trả tiền thuê bao GPU cố định hàng tháng) | Trả theo token (Nhưng chi phí token ngoại tệ cao) |
| **Tính tuân thủ pháp lý** | Hoàn toàn đáp ứng luật an ninh mạng VN và NĐ 13/2023 | Phức tạp trong việc chứng minh chủ quyền dữ liệu | Không đáp ứng yêu cầu lưu trữ dữ liệu tài chính tại Việt Nam |

### 5.2. Ưu điểm & Nhược điểm cốt lõi

#### **👍 Ưu điểm:**
1. **Tốc độ & Hạ tầng vượt trội:** Chạy trên kiến trúc phần cứng hiện đại nhất (H100/H200) đem lại tốc độ suy luận vượt trội.
2. **Chi phí linh hoạt:** Mô hình Serverless giúp tối ưu chi phí tối đa, cực kỳ phù hợp cho giai đoạn Hackathon chạy thử nghiệm (được tặng 100M tokens miễn phí).
3. **Bộ công cụ RAG hoàn chỉnh:** Cung cấp đầy đủ từ mô hình tạo vector nhúng (Embedding) đến mô hình tái xếp hạng (Rerank), giải quyết triệt để bài toán tìm kiếm ngữ nghĩa bị sai sót thông tin trong CRM.
4. **Hệ sinh thái AI đa dạng:** Tích hợp STT/TTS và Guardrail trên cùng một cổng API duy nhất giúp phát triển các tính năng mở rộng (nhận diện giọng nói, lọc thông tin nhạy cảm) vô cùng tiện lợi.

#### **👎 Nhược điểm / Thử thách:**
1. **Lượng tài liệu cộng đồng:** Tài liệu hướng dẫn sử dụng và thư viện mẫu tự xây dựng của FPT AI Factory còn ít hơn so với các hệ sinh thái lớn như HuggingFace hay OpenAI.
2. **Độ đa dạng mô hình cực lớn:** Hiện tại số lượng mô hình độc quyền của FPT tập trung mạnh vào Tiếng Việt, đối với các tác vụ lý luận logic siêu phức tạp (như coding phức tạp) thì vẫn cần gọi thêm các mô hình mã nguồn mở lớn (như Qwen-72B hoặc Llama-3-70B) được host trên hệ thống.

---

## 6. Đánh Giá & Đề Xuất Tối Ưu Hóa Dự Án Hackathon

Để giành giải phụ **FPT Award** hiệu quả nhất, nhóm nên triển khai dự án theo các chiến lược tối ưu sau:

1. **Ứng dụng RAG nâng cao với Rerank Model:**
   * Thay vì chỉ dùng mô hình Embedding thông thường, hãy tích hợp thêm **FPT Rerank Model** (`fpt-rerank-large-vi`) vào pipeline RAG. Điều này giúp nâng độ chính xác của câu trả lời về profile khách hàng và cơ hội bán hàng lên trên mức 85% (yêu cầu D1 của Bank A).
2. **Tối ưu hóa Chi Phí & Latency:**
   * Sử dụng các mô hình nhỏ và chuyên biệt như `fpt-llama-3-8b-instruct` cho các tác vụ phân loại hoặc trích xuất thông tin đơn giản.
   * Chỉ sử dụng các mô hình lớn hơn khi cần soạn thảo các nội dung email cá nhân hóa phức tạp hoặc kịch bản cuộc gọi dài.
3. **Tích hợp Guardrail chống rò rỉ dữ liệu:**
   * Áp dụng **FPT Guardrail Model** tại API Gateway để lọc bỏ/mã hóa các thông tin định danh cá nhân (PII) như Số điện thoại, Số tài khoản, CCCD trước khi chuyển dữ liệu vào LLM. Điều này trực tiếp giúp dự án ghi điểm tuyệt đối ở tiêu chí tuân thủ Nghị định 13/2023 (yêu cầu bắt buộc để ký pilot của Bank A).
4. **Mở rộng tính năng CRM bằng Voice Note (Điểm cộng sáng tạo):**
   * Sử dụng **FPT Speech-to-Text** để phát triển tính năng: RM ghi âm tóm tắt cuộc gặp khách hàng bằng giọng nói -> Hệ thống tự động chuyển thành văn bản -> LLM phân tích và tự động điền các trường thông tin tương ứng vào CRM.
