# Bảng So Sánh Ý Tưởng Brainstorming Sơ Bộ (Q&A)

Tài liệu này đối chiếu trực quan các ý tưởng ban đầu của ba thành viên **Trung**, **Minh**, và **Duy** đối với 8 chủ đề của cuộc thi, phục vụ cho quá trình phản biện và chọn lựa đề tài.

---

## 1. Bảng So Sánh Ý Tưởng Theo 8 Chủ Đề

| Chủ đề | Ý tưởng của Trung | Ý tưởng của Minh | Ý tưởng của Duy |
| :--- | :--- | :--- | :--- |
| **1. Ngân hàng & Tài chính** | Hạn chế kiến thức chuyên sâu trong mảng này. | Ứng dụng Agent để tối ưu hóa danh mục đầu tư; tự động tìm kiếm và đánh giá rủi ro từ nhiều mô hình AI. | Giải quyết bài toán bảo mật/eKYC; xử lý lỗi khi camera nhận diện nhiều hơn 2 khuôn mặt trong một khung hình. |
| **2. Y Tế & Sức Khỏe** | Tích hợp AI hỗ trợ chẩn đoán (cần data sạch). Tối ưu lập lịch khám, phân luồng, chuyển tuyến bằng vận trù học (OR). | Hệ thống chẩn đoán đa tầng (Multi-model) cho nhiều triệu chứng khác nhau. Finetune AI bằng nguồn dữ liệu chuẩn. | Trợ lý nhắc lịch uống thuốc, tái khám. Gợi ý thực đơn dinh dưỡng (tiểu đường...). Tối ưu hóa chi phí khám bệnh (BHXH, hộ nghèo). |
| **3. Giáo Dục & Đào Tạo** | Tích hợp LLM + RAG để "cá nhân hóa đào tạo". Hỗ trợ giáo viên phân bổ nguồn lực hướng dẫn học sinh hiệu quả. | Đồng thuận với ý kiến của Trung về định hướng cá nhân hóa lộ trình học tập. | AI hỗ trợ hướng nghiệp và tuyển sinh; chọn trường/ngành học dựa trên xu hướng phát triển của xã hội. |
| **4. Phòng Chống Thiên Tai** | Ứng dụng Physics-informed AI để dự báo khí tượng thủy văn, bão lũ miền Trung nhằm chủ động sơ tán, cứu trợ. | Chưa có ý tưởng cụ thể (No idea). | Hệ thống phân vùng và cảnh báo ngập lụt đô thị thời gian thực dựa trên các thiết bị cảm biến chống ngập. |
| **5. Đổi Mới Sáng Tạo** | Chủ đề mở hoàn toàn, chưa có ý tưởng đột phá cụ thể. | Chưa có ý tưởng cụ thể (No idea). | Giải pháp quản lý hạ tầng giao thông đô thị; theo dõi cống ngập và các điểm công trình thi công. |
| **6. Năng Suất SME** | Chưa có nhiều kinh nghiệm thực tế về vận hành doanh nghiệp. | Tích hợp Multi-Agent vào quản lý doanh nghiệp; mỗi Agent đảm nhận một vai trò chuyên môn (ví dụ: Marketing Agent). | AI phân tích năng lực làm việc để tự động đề xuất lộ trình tăng lương và thăng tiến công bằng. |
| **7. Smart Government** | Tối ưu hóa thủ tục hành chính công. Ứng dụng vận trù học (OR) để điều phối giao thông thông minh. | Tích hợp AI Agent vào các cổng dịch vụ công trực tuyến để tự động điều hướng và hướng dẫn thủ tục cho người dân. | Số hóa quy trình làm hộ chiếu và giấy tờ online; giải quyết bất cập trong việc đồng bộ dữ liệu với địa phương. |
| **8. Nông Nghiệp** | Tối ưu hóa chuỗi cung ứng logistics nông sản (OR). Ứng dụng AI dự báo thích nghi biến đổi khí hậu. | Chưa có ý tưởng cụ thể (No idea). | Chưa đề xuất ý tưởng. |

---

## 2. Nhật Ký Phản Biện & Điều Chỉnh Ý Tưởng

### 2.1. Tự phản biện (Self-Rebuttal)

* **Duy (Chủ đề Giáo dục)**:
  * *Điều chỉnh*: Thay đổi hướng tiếp cận hướng nghiệp theo hướng nhân văn hơn, can thiệp sớm hơn vào việc chọn nghề của học sinh.
  * *Mô hình áp dụng*: Xây dựng dựa trên 3 trục cốt lõi: (1) Nghề xã hội cần, (2) Nghề người dùng thích, (3) Năng lực cốt lõi cá nhân.
* **Minh (Chủ đề Ngân hàng & Tài chính)**:
  * *Hạn chế nhận diện*: Nhận thấy giải pháp tối ưu hóa đầu tư khó khả thi ở giai đoạn đầu do khó xác thực độ tin cậy của thông tin tài chính và chưa xác định rõ khách hàng mục tiêu.
* **Minh (Chủ đề Y tế & Sức khỏe)**:
  * *Hạn chế nhận diện*: Các sản phẩm hiện tại đã có tính năng nhập triệu chứng ra bệnh.
  * *Giải pháp cải tiến*: Cần cải thiện độ chính xác bằng cách kết hợp Machine Learning chẩn đoán và xếp hạng bệnh theo xác suất. Dùng LLM làm giao diện để truy vấn hệ thống này.

### 2.2. Phản biện chéo (Peer-Rebuttal)

* **Minh phản biện Duy (Chủ đề Y tế - Trợ lý nhắc lịch)**:
  * Việc nhắc lịch nên được tích hợp trực tiếp từ đơn thuốc điện tử khi bác sĩ khám xong trên app của bệnh viện.
  * LLM chỉ nên dùng để lên thực đơn ăn uống dựa trên các nhóm dinh dưỡng bác sĩ yêu cầu.
  * *Mô hình kinh doanh*: Bác sĩ sẽ hướng dẫn bệnh nhân tải ứng dụng trong quá trình chẩn đoán.
* **Minh phản biện Trung (Chủ đề Ngân hàng & Tài chính)**:
  * Cần khảo sát kỹ xem thị trường đã có giải pháp tương tự chưa để xác định rõ khoảng trống công nghệ (gap) trước khi bắt tay thực hiện.
