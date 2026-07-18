# Kế hoạch hoàn thiện SHB Legal Intelligence

## 1. Mục tiêu

Hoàn thiện một bản demo ổn định, có dữ liệu nhất quán và chứng minh được các năng lực cốt lõi của đề bài trước khi nộp checkpoint 2 và vòng chung kết:

- Tra cứu văn bản bằng hybrid retrieval.
- Theo dõi tham chiếu chéo giữa văn bản và điều khoản.
- Áp dụng đúng hiệu lực, sửa đổi và thay thế một phần.
- Phát hiện xung đột có bằng chứng kiểm chứng được.
- Trả lời kèm trích dẫn và không bịa nguồn.
- Có giao diện demo rõ ràng, URL hoạt động và repository có thể chấm được.

Nguyên tắc chung: không viết lại toàn bộ hệ thống trong thời gian còn lại; giữ FastAPI, SQLite, FAISS, NetworkX và React, chỉ gia cố các luồng trực tiếp tạo điểm theo đề bài.

## 2. Trạng thái hiện tại

### Đã hoàn thành

- [x] P0 — xử lý các vấn đề bảo mật và bí mật trong repository 
- [x] Có frontend và backend đã từng được triển khai để kiểm tra trực tuyến.
- [x] Có pipeline Advanced RAG gồm query decomposition, vector search, BM25, RRF, lọc hiệu lực, reranking, tổng hợp câu trả lời và citation guard.
- [x] Có giao diện chat, nguồn tham khảo, knowledge graph và khu vực quản trị tài liệu.

### Cần xác minh lại trước khi nộp

- Repository public và clone được khi không đăng nhập.
- Lịch sử Git không còn thông tin bí mật.
- Frontend URL và backend health URL hoạt động ở cửa sổ ẩn danh.
- Biến môi trường production đầy đủ nhưng không xuất hiện trong frontend bundle hoặc repository.
- Các endpoint ghi/xóa tài liệu không được mở công khai ngoài ý muốn.

### Điểm yếu đã xác định

- Dữ liệu hiện tại chưa đồng nhất giữa dữ liệu tổng hợp và dữ liệu thu thập; metadata pháp lý còn thiếu.
- Graph chủ yếu biểu diễn quan hệ `contains`; số liên kết tham chiếu, sửa đổi và thay thế còn ít.
- Graph chưa thực sự tham gia mở rộng tập bằng chứng trong retrieval.
- Temporal resolution và partial supersession chưa đủ chặt để chứng minh bằng test xác định.
- Citation guard có nguy cơ cho phép câu trả lời thiếu nguồn đi qua.
- Conflict detection còn phụ thuộc nhiều vào LLM và chưa luôn gắn với hai bằng chứng cụ thể.
- Benchmark hiện tại chưa tạo khác biệt đủ rõ giữa Standard và Advanced RAG.
- Frontend chưa giải thích rõ dữ liệu demo, nguồn tổng hợp và lý do một nguồn bị loại.

## 3. Phạm vi ưu tiên

### Phải hoàn thành

1. Khóa an toàn bản triển khai và xác minh checkpoint 2.
2. Chuẩn hóa một bộ dữ liệu demo nhỏ nhưng nhất quán.
3. Bổ sung graph expansion và temporal resolution theo luật xác định.
4. Chuyển citation guard sang fail-closed.
5. Tạo benchmark thật giữa Standard và Advanced RAG.
6. Tối ưu frontend cho luồng chấm điểm và bốn câu hỏi demo tốt nhất.
7. Hoàn thiện README, tài liệu kiến trúc, AI log, slide và video.

### Không làm trước khi nộp

- Chuyển sang Neo4j hoặc thay toàn bộ database.
- Thêm OCR, crawler lớn hoặc nhập hàng loạt tài liệu mới.
- Thêm nhiều nhà cung cấp model.
- Xây hệ thống phân quyền doanh nghiệp hoàn chỉnh.
- Viết lại frontend hoặc backend trên framework khác.
- Khôi phục chế độ Standard RAG trong giao diện người dùng; Standard chỉ cần tồn tại như baseline benchmark.
- Refactor diện rộng không trực tiếp cải thiện tiêu chí chấm điểm.

## 4. Kế hoạch thực hiện

### P1 — Checkpoint gate và bảo vệ production

Mục tiêu: bảo đảm hai URL nộp bài có thể chấm được mà không tạo rủi ro mới.

Công việc:

- Xác minh repository public, clone sạch và hướng dẫn chạy đúng.
- Quét lại secret ở working tree và lịch sử Git.
- Xác minh frontend, backend health, CORS và biến môi trường production.
- Chuyển admin public sang read-only hoặc bảo vệ toàn bộ endpoint thay đổi dữ liệu.
- Khôi phục hoặc bổ sung smoke test tối thiểu cho health, chat, documents, graph và model list.
- Chạy frontend lint/build và backend test trước khi đóng checkpoint.
- Nộp checkpoint 2 sớm, sau đó mới tiếp tục nâng cấp trên các commit riêng.

Tiêu chí hoàn thành:

- URL frontend mở được ở cửa sổ ẩn danh.
- API health trả về thành công.
- Repo clone được và README đủ để chạy.
- Người dùng công khai không thể upload, sửa hoặc xóa dữ liệu.
- Không phát hiện secret đang hoạt động trong repo hoặc bundle.

### P2 — Chuẩn hóa bộ dữ liệu demo

Mục tiêu: dùng một tập dữ liệu nhỏ, có chủ đích và đủ quan hệ để trình diễn đúng vấn đề.

Phạm vi đề xuất:

- Chọn 6–8 văn bản cùng một miền nghiệp vụ, ưu tiên AML/KYC.
- Chỉ giữ khoảng 40–80 chunks có cấu trúc trong active demo index.
- Các tài liệu dài hoặc không đồng bộ được đưa ra khỏi active index; không xóa vĩnh viễn nếu chưa có phê duyệt.
- Phân biệt rõ nguồn chính thức và dữ liệu tổng hợp phục vụ demo.

Metadata bắt buộc cho văn bản:

- `doc_num`
- `title`
- `source_type`
- `source_url`
- `is_synthetic`
- `issued_date`
- `effective_date`
- `expiration_date`
- `status`
- `version`

Metadata bắt buộc cho chunks và quan hệ:

- `document_id`, `article`, `clause`, `text`
- `relation_type`
- `source_document_id`, `source_article`, `source_clause`
- `target_document_id`, `target_article`, `target_clause`
- `effective_from`, `effective_to`
- `evidence_text`

Tiêu chí hoàn thành:

- 100% tài liệu demo có metadata bắt buộc.
- 100% chunks demo có ít nhất số điều; khoản được điền khi văn bản có cấu trúc khoản.
- Không có dangling reference trong các quan hệ dùng để demo.
- Có tối thiểu 8 tham chiếu chéo hợp lệ.
- Có tối thiểu 3 trường hợp sửa đổi, thay thế hoặc hết hiệu lực.
- Có tối thiểu 2 trường hợp xung đột được gắn nhãn và có bằng chứng.
- Có manifest ghi rõ nguồn, giấy phép/quyền sử dụng và dữ liệu tổng hợp.

### P3 — Gia cố kiến trúc Advanced RAG

Mục tiêu: biến các tuyên bố chính thành hành vi xác định, quan sát được và test được.

Luồng mục tiêu:

```text
Question
  -> Query decomposition
  -> Vector + BM25 retrieval
  -> RRF fusion
  -> Temporal filtering
  -> One-hop graph expansion
  -> Evidence reranking
  -> Conflict analysis
  -> LLM synthesis
  -> Strict citation validation
  -> Answer + sources + graph trace
```

Công việc:

1. Graph expansion xác định:
   - Lấy các chunks top-k sau hybrid search.
   - Theo tối đa một hop đối với `references`, `amends`, `supersedes` và `conflicts_with`.
   - Chỉ thêm node đích hợp lệ, có hiệu lực và có chunk thật.
   - Gắn lý do thêm nguồn để frontend giải thích được.

2. Temporal resolver:
   - Hỗ trợ `as_of`; mặc định là ngày hiện tại.
   - Loại văn bản chưa có hiệu lực, hết hiệu lực hoặc bị thay thế tại thời điểm hỏi.
   - Với partial supersession, chỉ loại đúng điều/khoản bị thay thế.
   - Trả về lý do lọc để phục vụ audit và giao diện.

3. Citation guard fail-closed:
   - Mọi kết luận pháp lý phải map được về một `chunk_id` trong evidence set.
   - Nếu không đủ bằng chứng, trả lời không đủ dữ liệu thay vì tạo kết luận.
   - Citation không tồn tại hoặc không khớp nội dung phải làm response thất bại an toàn.

4. Conflict detection:
   - Ưu tiên rule/metadata đã gắn nhãn.
   - LLM chỉ giải thích xung đột, không tự tạo quan hệ mới trong runtime.
   - Mỗi cảnh báo phải chứa ít nhất hai nguồn, hai chunks và mô tả điểm khác nhau.

5. Relation validator khi ingest:
   - Không cho kích hoạt relation thiếu node đích.
   - Kiểm tra ngày hiệu lực và phạm vi điều/khoản.
   - Ghi lỗi ingest rõ ràng để admin xử lý.

Tiêu chí hoàn thành:

- Truy vấn demo theo được tham chiếu chéo mà không phụ thuộc tool calling của model.
- Nguồn hết hiệu lực hoặc phần bị thay thế không xuất hiện trong context cuối.
- Không đủ nguồn thì hệ thống từ chối kết luận.
- Mỗi conflict có hai nguồn thực và điều/khoản cụ thể.
- Trace thể hiện rõ nguồn từ search và nguồn được thêm qua graph.

### P4 — Test và benchmark

Mục tiêu: chứng minh Advanced RAG tốt hơn baseline bằng dữ liệu đo được, không dùng số liệu giả định như kết quả thực tế.

Gold set:

- 10–15 câu hỏi có đáp án, nguồn đúng, nguồn không được dùng và quan hệ cần theo.
- Bao phủ tra cứu trực tiếp, cross-reference, hiệu lực, partial supersession, conflict và insufficient evidence.

Hai cấu hình benchmark:

- Standard baseline: vector hoặc BM25, không temporal filtering, không graph expansion.
- Advanced: hybrid retrieval + RRF + temporal filtering + graph expansion + strict citation.

Chỉ số:

- Recall@5.
- Citation validity rate.
- Stale-source rate.
- Reference resolution rate.
- Conflict detection success rate.
- Tỷ lệ trả lời đúng khi thiếu bằng chứng.
- Latency p50 và p95.

Tiêu chí hoàn thành:

- Có script benchmark chạy lặp lại được.
- Có kết quả JSON/CSV và bảng tóm tắt trong docs.
- Advanced phải tạo khác biệt rõ ở stale-source, reference resolution và citation validity.
- Mọi con số trên slide phải truy ngược được về file kết quả.

### P5 — Tối ưu frontend cho ban giám khảo

Mục tiêu: trong một lần demo ngắn, người chấm nhìn thấy vấn đề, cơ chế xử lý và bằng chứng.

Công việc:

- Giữ bốn câu hỏi mẫu đã được benchmark là tốt nhất.
- Gắn nhãn rõ dữ liệu chính thức và dữ liệu tổng hợp phục vụ demo.
- Hiển thị các bước search, temporal filtering, graph expansion và citation validation bằng ngôn ngữ dễ hiểu.
- Phân biệt nguồn được tìm trực tiếp với nguồn được thêm qua tham chiếu.
- Hiển thị cảnh báo xung đột ngay trong câu trả lời và liên kết tới hai bằng chứng.
- Click citation mở đúng tài liệu, điều/khoản và đoạn liên quan.
- Knowledge graph chỉ hiển thị subgraph liên quan đến câu hỏi, tránh graph toàn bộ quá rối.
- Admin công khai chỉ đọc: xem danh sách, chi tiết tài liệu và chi tiết điều/khoản.
- Thêm disclaimer: hệ thống hỗ trợ tra cứu, không thay thế phê duyệt pháp chế.
- Có trạng thái loading, empty, insufficient evidence và API error rõ ràng.

Tiêu chí hoàn thành:

- Bốn câu hỏi mẫu chạy ổn định từ giao diện.
- Mỗi câu trả lời có citation click được và trace dễ hiểu.
- Không có chức năng ghi/xóa công khai.
- Frontend lint/build thành công và không có lỗi console nghiêm trọng.
- Luồng demo chính hoàn thành trong dưới 3 phút.

### P6 — Hồ sơ sản phẩm và tác động kinh doanh

Mục tiêu: nâng điểm ở tính khả thi, tác động, trình bày và khả năng triển khai.

Pilot đề xuất:

- Thời gian: 4 tuần.
- Người dùng: 10–20 nhân sự pháp chế/compliance.
- Phạm vi: 100–500 tài liệu đã được rà soát.
- Có human-in-the-loop cho câu trả lời rủi ro cao.

KPI mục tiêu, phải ghi là mục tiêu cho tới khi đo được:

- Recall@5 >= 90% trên gold set.
- Stale-source rate = 0 trên gold set.
- Citation validity >= 95%.
- p95 latency < 15 giây.
- Giảm 30–50% thời gian tra cứu.
- Tỷ lệ chấp nhận câu trả lời >= 80% trong pilot.

Tài liệu cần có:

- README: bài toán, kiến trúc, quick start, demo URL, giới hạn và disclaimer.
- Architecture/data flow và threat model ngắn.
- Dataset manifest và nguồn dữ liệu.
- Benchmark report có thể tái tạo.
- AI usage log theo thể lệ.
- License và third-party notices.
- Slide deck khoảng 8 phần: vấn đề, người dùng, giải pháp, kiến trúc, demo, benchmark, pilot/ROI, roadmap.
- Video demo không quá 5 phút, ưu tiên quay một luồng hoàn chỉnh thay vì liệt kê tính năng.

### P7 — Freeze, deploy và nộp bài

Mục tiêu: khóa một phiên bản ổn định đủ sớm để có thời gian xử lý sự cố.

Công việc:

- Chạy toàn bộ backend tests, benchmark, frontend lint/build và smoke test production.
- Deploy backend trước, sau đó frontend.
- Test bằng cửa sổ ẩn danh và mạng khác nếu có thể.
- Kiểm tra bốn câu hỏi demo sau deploy.
- Gắn tag/release cho phiên bản nộp.
- Chốt slide, video, URL, repository, AI log và các biểu mẫu.
- Dùng mốc 10:00 ngày 19/07 làm hạn an toàn nếu tài liệu có mốc thời gian không thống nhất.

Tiêu chí hoàn thành:

- Repo public và URL production hoạt động.
- Commit/tag nộp bài được ghi lại.
- Tất cả artifact mở được bằng tài khoản/thiết bị không đăng nhập.
- Có ít nhất 90 phút buffer trước hạn an toàn.

## 5. Lịch thực hiện đề xuất trong 13 giờ

| Khoảng thời gian | Công việc | Đầu ra bắt buộc |
|---|---|---|
| Đã xong | P0 bảo mật | Secret đã được xử lý theo xác nhận |
| H0–H0:45 | P1 checkpoint gate | Repo/URL/an toàn admin/tests được xác minh |
| H0:45–H1:15 | Nộp checkpoint 2 | Frontend URL và GitHub URL hợp lệ |
| H1:15–H3:45 | P2 dữ liệu | Demo corpus, relations và manifest nhất quán |
| H3:45–H5:45 | P3 kiến trúc | Graph expansion, temporal resolver, strict citation |
| H5:45–H6:45 | P4 benchmark | Gold set và kết quả Standard vs Advanced |
| H6:45–H7:45 | P5 frontend | Luồng demo, provenance, conflict và graph trace |
| H7:45–H8:30 | Deploy freeze lần 1 | Bản production ổn định |
| H8:30–H10:00 | P6 slide và pilot | Slide gần hoàn chỉnh, KPI/ROI có căn cứ |
| H10:00–H10:45 | Docs và hồ sơ | README, AI log, manifest, license |
| H10:45–H11:45 | Video | Video demo hoàn chỉnh |
| H11:45–H13:00 | Buffer và nộp | Smoke test cuối, upload và kiểm tra artifact |

Nếu trễ tiến độ, cắt theo thứ tự: hiệu ứng giao diện, tính năng phụ admin, mở rộng corpus, cải thiện thẩm mỹ slide. Không cắt dữ liệu nhất quán, temporal filtering, citation validation, URL/repo hoặc hồ sơ bắt buộc.

## 6. Quy tắc triển khai

- Hoàn thành và test một thành phần trước khi chuyển sang thành phần tiếp theo.
- Freeze dataset trước khi sửa retrieval để benchmark có ý nghĩa.
- Mỗi thay đổi phải có tiêu chí chấp nhận và test tương ứng.
- Không dùng câu trả lời pháp lý không có nguồn để làm câu hỏi mẫu.
- Không đưa KPI dự kiến lên slide như kết quả đã đo.
- Không xóa dữ liệu gốc; archive hoặc loại khỏi active index trước, chỉ xóa khi được phê duyệt.
- Không commit hoặc push tự động nếu chủ dự án chưa yêu cầu; khi được yêu cầu, commit theo từng thành phần đã test.
- Duy trì một phiên bản production ổn định trong khi phát triển bản tiếp theo.

## 7. Bảng theo dõi

| Hạng mục | Trạng thái | Điều kiện đóng |
|---|---|---|
| P0 — Bảo mật | Hoàn thành | Chủ dự án đã xác nhận |
| P1 — Checkpoint gate | Chưa xác minh | Public repo, URL và admin protection đạt |
| P2 — Dữ liệu demo | Chưa làm | Metadata và relations đạt tiêu chí |
| P3 — Advanced RAG | Chưa làm | Cross-reference, temporal, conflict, citation có test |
| P4 — Benchmark | Chưa làm | Gold set và report tái tạo được |
| P5 — Frontend demo | Chưa làm | Bốn luồng mẫu chạy ổn định |
| P6 — Hồ sơ | Chưa làm | README, slide, video, AI log, license đầy đủ |
| P7 — Nộp bài | Chưa làm | Tag ổn định, artifact và URL đã kiểm tra |

## 8. Definition of Done

Hệ thống được coi là sẵn sàng nộp khi:

- Repository public, an toàn và có thể chạy theo README.
- Frontend/backend production hoạt động ổn định.
- Bộ dữ liệu demo nhất quán, có nguồn gốc và quan hệ pháp lý rõ ràng.
- Advanced RAG thực sự theo tham chiếu, lọc hiệu lực, xử lý thay thế một phần và cảnh báo xung đột.
- Không tạo kết luận pháp lý khi không có citation hợp lệ.
- Benchmark chứng minh được lợi ích so với baseline.
- Bốn câu hỏi mẫu thể hiện đủ năng lực cốt lõi và chạy ổn định.
- Admin public không cho phép thay đổi dữ liệu.
- Slide, video, AI log, dataset manifest, license và biểu mẫu nộp bài đầy đủ.
- Bản production cuối đã được smoke test và đóng băng trước hạn an toàn.
