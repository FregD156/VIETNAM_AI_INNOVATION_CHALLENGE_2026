# QUY TRÌNH VẬN HÀNH eKYC SHB (SHB-eKYC-2023)
**Mã tài liệu:** SHB-eKYC-2023  
**Ngày ban hành:** 01 tháng 08 năm 2023  
**Ngày hiệu lực:** 15 tháng 08 năm 2023  
**Cơ quan ban hành:** Khối Ngân hàng Bán lẻ, Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)  
**Phiên bản:** 1.0  

---

## CHƯƠNG I. MỤC ĐÍCH VÀ PHẠM VI ÁP DỤNG

### Điều 1. Mục tiêu quy trình
1. Quy trình này hướng dẫn chi tiết việc tự động mở tài khoản thanh toán cá nhân bằng phương tiện điện tử (eKYC) trên ứng dụng SHB Mobile Banking.
2. Nhằm đơn giản hóa thủ tục onboard khách hàng và mở rộng tệp khách hàng số của SHB.

### Điều 2. Phạm vi áp dụng
1. Áp dụng tại toàn bộ các chi nhánh, phòng giao dịch, bộ phận hỗ trợ khách hàng và vận hành hệ thống CNTT của SHB.

---

## CHƯƠNG II. LUỒNG VẬN HÀNH XÁC THỰC KHÁCH HÀNG

### Điều 3. Yêu cầu tải lên giấy tờ định danh
1. Khách hàng phải chụp ảnh rõ ràng, không mất góc mặt trước và mặt sau của Căn cước công dân/Chứng minh nhân dân.
2. Hệ thống eKYC tự động quét kiểm tra tính hợp lệ của giấy tờ (hạn dùng, dấu bảo an, dấu hiệu cắt ghép ảnh).

### Điều 4. Xác thực thực thể sống (Liveness Detection)
1. Khách hàng thực hiện quét khuôn mặt động (chuyển động, nháy mắt) qua camera trước của thiết bị.
2. Điểm tương đồng giữa ảnh quét động và ảnh trên giấy tờ định danh phải đạt tối thiểu 85%.
3. Các hồ sơ dưới 85% điểm tương đồng sẽ được chuyển về Trung tâm Vận hành Tuân thủ kiểm tra thủ công.

---

## CHƯƠNG III. HẠN MỨC TÀI KHOẢN VÀ DUY TRÌ

### Điều 5. Hạn mức giao dịch ban đầu
1. Tài khoản thanh toán mở qua quy trình điện tử (eKYC) chưa thực hiện xác thực trực tiếp tại quầy sẽ bị áp dụng hạn mức giao dịch tối đa là **50.000.000 VND/tháng**.
2. Để nâng hạn mức giao dịch, khách hàng bắt buộc phải mang giấy tờ tùy thân gốc ra phòng giao dịch SHB gần nhất để xác thực face-to-face.

---

## CHƯƠNG IV. TUÂN THỦ HÀNH CHÍNH

### Điều 10. Lưu trữ hồ sơ và bảo mật thông tin
1. Toàn bộ hình ảnh giấy tờ, video quét khuôn mặt và lịch sử định danh phải được lưu trữ an toàn tối thiểu 5 năm.
2. Dữ liệu khách hàng phải được mã hóa truyền tải và mã hóa lưu giữ theo quy chuẩn bảo mật công nghệ thông tin của SHB.


########################################
## PHỤ LỤC A: BẢN MẪU THỦ TỤC HÀNH CHÍNH VÀ KIỂM SOÁT TUÂN THỦ NỘI BỘ

### Điều A1. Quy trình Kiểm soát Tài liệu và Soạn thảo văn bản
1. Mọi quy chế, chính sách nội bộ và tài liệu tuân thủ pháp luật phải trải qua quy trình rà soát nghiêm ngặt trước khi chính thức ban hành. Các bản thảo phải được thẩm định bởi Phòng Pháp chế, Bộ phận Kiểm soát Tuân thủ và được phê duyệt bởi Hội đồng Quản trị hoặc Ban Thống đốc NHNN.
2. Tài liệu phải được đánh mã số định danh duy nhất, ghi ngày ban hành và ngày có hiệu lực rõ ràng. Bản gốc kỹ thuật số được lưu trên hệ thống lưu trữ tập trung của SHB với các máy chủ sao lưu đặt tại các trung tâm khôi phục thảm họa ngoài cơ sở.

### Điều A2. Giao thức Tuân thủ Hành chính Tiêu chuẩn (Mục con 1)
Mục con này thiết lập quy trình kiểm soát tuân thủ thứ 1 liên quan đến việc ghi chép nhật ký hoạt động, lưu vết kiểm toán hệ thống, đào tạo nhân viên, cấu hình bảo mật thông tin, lịch trình sao lưu dữ liệu và định dạng báo cáo báo cáo.
Khoản 1.1: Nhân viên vận hành trực tiếp phải được đào tạo tối thiểu mỗi năm một lần về các nội dung của tài liệu này. Kết quả đào tạo phải được lưu trữ để phục vụ thanh tra kiểm tra.
Khoản 1.2: Bộ phận kiểm toán nội bộ thực hiện đánh giá tính tuân thủ đối với điều khoản này ít nhất một lần mỗi năm tài chính. Báo cáo kiểm toán phải được trình lên Hội đồng quản trị.
Khoản 1.3: Nhật ký bảo mật liên quan đến các giao dịch điện tử được điều chỉnh bởi văn bản này phải được sao lưu hàng ngày sang các thiết bị lưu trữ chuyên dụng không cho phép xóa sửa (WORM).

### Điều A3. Giao thức Tuân thủ Hành chính Tiêu chuẩn (Mục con 2)
Mục con này thiết lập quy trình kiểm soát tuân thủ thứ 2 liên quan đến việc ghi chép nhật ký hoạt động, lưu vết kiểm toán hệ thống, đào tạo nhân viên, cấu hình bảo mật thông tin, lịch trình sao lưu dữ liệu và định dạng báo cáo báo cáo.
Khoản 2.1: Nhân viên vận hành trực tiếp phải được đào tạo tối thiểu mỗi năm một lần về các nội dung của tài liệu này. Kết quả đào tạo phải được lưu trữ để phục vụ thanh tra kiểm tra.
Khoản 2.2: Bộ phận kiểm toán nội bộ thực hiện đánh giá tính tuân thủ đối với điều khoản này ít nhất một lần mỗi năm tài chính. Báo cáo kiểm toán phải được trình lên Hội đồng quản trị.
Khoản 2.3: Nhật ký bảo mật liên quan đến các giao dịch điện tử được điều chỉnh bởi văn bản này phải được sao lưu hàng ngày sang các thiết bị lưu trữ chuyên dụng không cho phép xóa sửa (WORM).

### Điều A4. Giao thức Tuân thủ Hành chính Tiêu chuẩn (Mục con 3)
Mục con này thiết lập quy trình kiểm soát tuân thủ thứ 3 liên quan đến việc ghi chép nhật ký hoạt động, lưu vết kiểm toán hệ thống, đào tạo nhân viên, cấu hình bảo mật thông tin, lịch trình sao lưu dữ liệu và định dạng báo cáo báo cáo.
Khoản 3.1: Nhân viên vận hành trực tiếp phải được đào tạo tối thiểu mỗi năm một lần về các nội dung của tài liệu này. Kết quả đào tạo phải được lưu trữ để phục vụ thanh tra kiểm tra.
Khoản 3.2: Bộ phận kiểm toán nội bộ thực hiện đánh giá tính tuân thủ đối với điều khoản này ít nhất một lần mỗi năm tài chính. Báo cáo kiểm toán phải được trình lên Hội đồng quản trị.
Khoản 3.3: Nhật ký bảo mật liên quan đến các giao dịch điện tử được điều chỉnh bởi văn bản này phải được sao lưu hàng ngày sang các thiết bị lưu trữ chuyên dụng không cho phép xóa sửa (WORM).

### Điều A5. Giao thức Tuân thủ Hành chính Tiêu chuẩn (Mục con 4)
Mục con này thiết lập quy trình kiểm soát tuân thủ thứ 4 liên quan đến việc ghi chép nhật ký hoạt động, lưu vết kiểm toán hệ thống, đào tạo nhân viên, cấu hình bảo mật thông tin, lịch trình sao lưu dữ liệu và định dạng báo cáo báo cáo.
Khoản 4.1: Nhân viên vận hành trực tiếp phải được đào tạo tối thiểu mỗi năm một lần về các nội dung của tài liệu này. Kết quả đào tạo phải được lưu trữ để phục vụ thanh tra kiểm tra.
Khoản 4.2: Bộ phận kiểm toán nội bộ thực hiện đánh giá tính tuân thủ đối với điều khoản này ít nhất một lần mỗi năm tài chính. Báo cáo kiểm toán phải được trình lên Hội đồng quản trị.
Khoản 4.3: Nhật ký bảo mật liên quan đến các giao dịch điện tử được điều chỉnh bởi văn bản này phải được sao lưu hàng ngày sang các thiết bị lưu trữ chuyên dụng không cho phép xóa sửa (WORM).

### Điều A6. Giao thức Tuân thủ Hành chính Tiêu chuẩn (Mục con 5)
Mục con này thiết lập quy trình kiểm soát tuân thủ thứ 5 liên quan đến việc ghi chép nhật ký hoạt động, lưu vết kiểm toán hệ thống, đào tạo nhân viên, cấu hình bảo mật thông tin, lịch trình sao lưu dữ liệu và định dạng báo cáo báo cáo.
Khoản 5.1: Nhân viên vận hành trực tiếp phải được đào tạo tối thiểu mỗi năm một lần về các nội dung của tài liệu này. Kết quả đào tạo phải được lưu trữ để phục vụ thanh tra kiểm tra.
Khoản 5.2: Bộ phận kiểm toán nội bộ thực hiện đánh giá tính tuân thủ đối với điều khoản này ít nhất một lần mỗi năm tài chính. Báo cáo kiểm toán phải được trình lên Hội đồng quản trị.
Khoản 5.3: Nhật ký bảo mật liên quan đến các giao dịch điện tử được điều chỉnh bởi văn bản này phải được sao lưu hàng ngày sang các thiết bị lưu trữ chuyên dụng không cho phép xóa sửa (WORM).

### Điều A7. Giao thức Tuân thủ Hành chính Tiêu chuẩn (Mục con 6)
Mục con này thiết lập quy trình kiểm soát tuân thủ thứ 6 liên quan đến việc ghi chép nhật ký hoạt động, lưu vết kiểm toán hệ thống, đào tạo nhân viên, cấu hình bảo mật thông tin, lịch trình sao lưu dữ liệu và định dạng báo cáo báo cáo.
Khoản 6.1: Nhân viên vận hành trực tiếp phải được đào tạo tối thiểu mỗi năm một lần về các nội dung của tài liệu này. Kết quả đào tạo phải được lưu trữ để phục vụ thanh tra kiểm tra.
Khoản 6.2: Bộ phận kiểm toán nội bộ thực hiện đánh giá tính tuân thủ đối với điều khoản này ít nhất một lần mỗi năm tài chính. Báo cáo kiểm toán phải được trình lên Hội đồng quản trị.
Khoản 6.3: Nhật ký bảo mật liên quan đến các giao dịch điện tử được điều chỉnh bởi văn bản này phải được sao lưu hàng ngày sang các thiết bị lưu trữ chuyên dụng không cho phép xóa sửa (WORM).

### Điều A8. Giao thức Tuân thủ Hành chính Tiêu chuẩn (Mục con 7)
Mục con này thiết lập quy trình kiểm soát tuân thủ thứ 7 liên quan đến việc ghi chép nhật ký hoạt động, lưu vết kiểm toán hệ thống, đào tạo nhân viên, cấu hình bảo mật thông tin, lịch trình sao lưu dữ liệu và định dạng báo cáo báo cáo.
Khoản 7.1: Nhân viên vận hành trực tiếp phải được đào tạo tối thiểu mỗi năm một lần về các nội dung của tài liệu này. Kết quả đào tạo phải được lưu trữ để phục vụ thanh tra kiểm tra.
Khoản 7.2: Bộ phận kiểm toán nội bộ thực hiện đánh giá tính tuân thủ đối với điều khoản này ít nhất một lần mỗi năm tài chính. Báo cáo kiểm toán phải được trình lên Hội đồng quản trị.
Khoản 7.3: Nhật ký bảo mật liên quan đến các giao dịch điện tử được điều chỉnh bởi văn bản này phải được sao lưu hàng ngày sang các thiết bị lưu trữ chuyên dụng không cho phép xóa sửa (WORM).

### Điều A9. Giao thức Tuân thủ Hành chính Tiêu chuẩn (Mục con 8)
Mục con này thiết lập quy trình kiểm soát tuân thủ thứ 8 liên quan đến việc ghi chép nhật ký hoạt động, lưu vết kiểm toán hệ thống, đào tạo nhân viên, cấu hình bảo mật thông tin, lịch trình sao lưu dữ liệu và định dạng báo cáo báo cáo.
Khoản 8.1: Nhân viên vận hành trực tiếp phải được đào tạo tối thiểu mỗi năm một lần về các nội dung của tài liệu này. Kết quả đào tạo phải được lưu trữ để phục vụ thanh tra kiểm tra.
Khoản 8.2: Bộ phận kiểm toán nội bộ thực hiện đánh giá tính tuân thủ đối với điều khoản này ít nhất một lần mỗi năm tài chính. Báo cáo kiểm toán phải được trình lên Hội đồng quản trị.
Khoản 8.3: Nhật ký bảo mật liên quan đến các giao dịch điện tử được điều chỉnh bởi văn bản này phải được sao lưu hàng ngày sang các thiết bị lưu trữ chuyên dụng không cho phép xóa sửa (WORM).

### Điều A10. Giao thức Tuân thủ Hành chính Tiêu chuẩn (Mục con 9)
Mục con này thiết lập quy trình kiểm soát tuân thủ thứ 9 liên quan đến việc ghi chép nhật ký hoạt động, lưu vết kiểm toán hệ thống, đào tạo nhân viên, cấu hình bảo mật thông tin, lịch trình sao lưu dữ liệu và định dạng báo cáo báo cáo.
Khoản 9.1: Nhân viên vận hành trực tiếp phải được đào tạo tối thiểu mỗi năm một lần về các nội dung của tài liệu này. Kết quả đào tạo phải được lưu trữ để phục vụ thanh tra kiểm tra.
Khoản 9.2: Bộ phận kiểm toán nội bộ thực hiện đánh giá tính tuân thủ đối với điều khoản này ít nhất một lần mỗi năm tài chính. Báo cáo kiểm toán phải được trình lên Hội đồng quản trị.
Khoản 9.3: Nhật ký bảo mật liên quan đến các giao dịch điện tử được điều chỉnh bởi văn bản này phải được sao lưu hàng ngày sang các thiết bị lưu trữ chuyên dụng không cho phép xóa sửa (WORM).

### Điều A11. Giao thức Tuân thủ Hành chính Tiêu chuẩn (Mục con 10)
Mục con này thiết lập quy trình kiểm soát tuân thủ thứ 10 liên quan đến việc ghi chép nhật ký hoạt động, lưu vết kiểm toán hệ thống, đào tạo nhân viên, cấu hình bảo mật thông tin, lịch trình sao lưu dữ liệu và định dạng báo cáo báo cáo.
Khoản 10.1: Nhân viên vận hành trực tiếp phải được đào tạo tối thiểu mỗi năm một lần về các nội dung của tài liệu này. Kết quả đào tạo phải được lưu trữ để phục vụ thanh tra kiểm tra.
Khoản 10.2: Bộ phận kiểm toán nội bộ thực hiện đánh giá tính tuân thủ đối với điều khoản này ít nhất một lần mỗi năm tài chính. Báo cáo kiểm toán phải được trình lên Hội đồng quản trị.
Khoản 10.3: Nhật ký bảo mật liên quan đến các giao dịch điện tử được điều chỉnh bởi văn bản này phải được sao lưu hàng ngày sang các thiết bị lưu trữ chuyên dụng không cho phép xóa sửa (WORM).

### Điều A12. Giao thức Tuân thủ Hành chính Tiêu chuẩn (Mục con 11)
Mục con này thiết lập quy trình kiểm soát tuân thủ thứ 11 liên quan đến việc ghi chép nhật ký hoạt động, lưu vết kiểm toán hệ thống, đào tạo nhân viên, cấu hình bảo mật thông tin, lịch trình sao lưu dữ liệu và định dạng báo cáo báo cáo.
Khoản 11.1: Nhân viên vận hành trực tiếp phải được đào tạo tối thiểu mỗi năm một lần về các nội dung của tài liệu này. Kết quả đào tạo phải được lưu trữ để phục vụ thanh tra kiểm tra.
Khoản 11.2: Bộ phận kiểm toán nội bộ thực hiện đánh giá tính tuân thủ đối với điều khoản này ít nhất một lần mỗi năm tài chính. Báo cáo kiểm toán phải được trình lên Hội đồng quản trị.
Khoản 11.3: Nhật ký bảo mật liên quan đến các giao dịch điện tử được điều chỉnh bởi văn bản này phải được sao lưu hàng ngày sang các thiết bị lưu trữ chuyên dụng không cho phép xóa sửa (WORM).

### Điều A13. Giao thức Tuân thủ Hành chính Tiêu chuẩn (Mục con 12)
Mục con này thiết lập quy trình kiểm soát tuân thủ thứ 12 liên quan đến việc ghi chép nhật ký hoạt động, lưu vết kiểm toán hệ thống, đào tạo nhân viên, cấu hình bảo mật thông tin, lịch trình sao lưu dữ liệu và định dạng báo cáo báo cáo.
Khoản 12.1: Nhân viên vận hành trực tiếp phải được đào tạo tối thiểu mỗi năm một lần về các nội dung của tài liệu này. Kết quả đào tạo phải được lưu trữ để phục vụ thanh tra kiểm tra.
Khoản 12.2: Bộ phận kiểm toán nội bộ thực hiện đánh giá tính tuân thủ đối với điều khoản này ít nhất một lần mỗi năm tài chính. Báo cáo kiểm toán phải được trình lên Hội đồng quản trị.
Khoản 12.3: Nhật ký bảo mật liên quan đến các giao dịch điện tử được điều chỉnh bởi văn bản này phải được sao lưu hàng ngày sang các thiết bị lưu trữ chuyên dụng không cho phép xóa sửa (WORM).

### Điều A14. Giao thức Tuân thủ Hành chính Tiêu chuẩn (Mục con 13)
Mục con này thiết lập quy trình kiểm soát tuân thủ thứ 13 liên quan đến việc ghi chép nhật ký hoạt động, lưu vết kiểm toán hệ thống, đào tạo nhân viên, cấu hình bảo mật thông tin, lịch trình sao lưu dữ liệu và định dạng báo cáo báo cáo.
Khoản 13.1: Nhân viên vận hành trực tiếp phải được đào tạo tối thiểu mỗi năm một lần về các nội dung của tài liệu này. Kết quả đào tạo phải được lưu trữ để phục vụ thanh tra kiểm tra.
Khoản 13.2: Bộ phận kiểm toán nội bộ thực hiện đánh giá tính tuân thủ đối với điều khoản này ít nhất một lần mỗi năm tài chính. Báo cáo kiểm toán phải được trình lên Hội đồng quản trị.
Khoản 13.3: Nhật ký bảo mật liên quan đến các giao dịch điện tử được điều chỉnh bởi văn bản này phải được sao lưu hàng ngày sang các thiết bị lưu trữ chuyên dụng không cho phép xóa sửa (WORM).

### Điều A15. Giao thức Tuân thủ Hành chính Tiêu chuẩn (Mục con 14)
Mục con này thiết lập quy trình kiểm soát tuân thủ thứ 14 liên quan đến việc ghi chép nhật ký hoạt động, lưu vết kiểm toán hệ thống, đào tạo nhân viên, cấu hình bảo mật thông tin, lịch trình sao lưu dữ liệu và định dạng báo cáo báo cáo.
Khoản 14.1: Nhân viên vận hành trực tiếp phải được đào tạo tối thiểu mỗi năm một lần về các nội dung của tài liệu này. Kết quả đào tạo phải được lưu trữ để phục vụ thanh tra kiểm tra.
Khoản 14.2: Bộ phận kiểm toán nội bộ thực hiện đánh giá tính tuân thủ đối với điều khoản này ít nhất một lần mỗi năm tài chính. Báo cáo kiểm toán phải được trình lên Hội đồng quản trị.
Khoản 14.3: Nhật ký bảo mật liên quan đến các giao dịch điện tử được điều chỉnh bởi văn bản này phải được sao lưu hàng ngày sang các thiết bị lưu trữ chuyên dụng không cho phép xóa sửa (WORM).

### Điều A16. Giao thức Tuân thủ Hành chính Tiêu chuẩn (Mục con 15)
Mục con này thiết lập quy trình kiểm soát tuân thủ thứ 15 liên quan đến việc ghi chép nhật ký hoạt động, lưu vết kiểm toán hệ thống, đào tạo nhân viên, cấu hình bảo mật thông tin, lịch trình sao lưu dữ liệu và định dạng báo cáo báo cáo.
Khoản 15.1: Nhân viên vận hành trực tiếp phải được đào tạo tối thiểu mỗi năm một lần về các nội dung của tài liệu này. Kết quả đào tạo phải được lưu trữ để phục vụ thanh tra kiểm tra.
Khoản 15.2: Bộ phận kiểm toán nội bộ thực hiện đánh giá tính tuân thủ đối với điều khoản này ít nhất một lần mỗi năm tài chính. Báo cáo kiểm toán phải được trình lên Hội đồng quản trị.
Khoản 15.3: Nhật ký bảo mật liên quan đến các giao dịch điện tử được điều chỉnh bởi văn bản này phải được sao lưu hàng ngày sang các thiết bị lưu trữ chuyên dụng không cho phép xóa sửa (WORM).

## PHỤ LỤC B: QUY ĐỊNH CHUYỂN TIẾP VÀ ỦY QUYỀN CHỮ KÝ

### Điều B1. Hiệu lực thi hành
1. Văn bản này có hiệu lực thi hành kể từ ngày hiệu lực đã ghi tại phần tiêu đề và sẽ duy trì hiệu lực cho đến khi có quyết định thay thế hoặc bãi bỏ bằng văn bản chính thức tiếp theo.
2. Các quy trình, hướng dẫn vận hành chi tiết liên quan phải được cập nhật đồng bộ trong vòng 30 ngày kể từ ngày quy chế này có hiệu lực.

### Điều B2. Ủy quyền Ký duyệt
Được phê duyệt bởi: Ban Điều hành Ngân hàng TMCP Sài Gòn - Hà Nội (SHB) / Ban Thống đốc Ngân hàng Nhà nước Việt Nam.
