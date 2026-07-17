# AGENTS.md — SHB Graph-RAG Interactive Frontend

File này hướng dẫn AI coding agent (Claude Code, Cursor, Copilot Workspace, v.v.) hiểu bối cảnh, quy ước và ràng buộc khi làm việc trên dự án này. Agent PHẢI đọc và tuân thủ file này trước khi sinh code.

---

## 1. TỔNG QUAN DỰ ÁN

**Tên dự án**: SHB Graph-RAG Interactive Frontend
**Mục tiêu**: Giao diện web cho hệ thống Advanced RAG Knowledge Base, phục vụ cán bộ ngân hàng/RM tra cứu văn bản pháp quy qua chatbot AI, khám phá đồ thị tri thức (Knowledge Graph) và quản trị việc cập nhật văn bản.
**Đối tượng dùng**: Cán bộ ngân hàng, chuyên viên tuân thủ (Compliance), Admin nội bộ. Chỉ tối ưu Desktop, không cần responsive mobile.
**Ràng buộc thời gian**: Dự án dạng hackathon 48 giờ — ưu tiên tốc độ hoàn thiện và tính demo-able hơn là kiến trúc hoàn hảo dài hạn.

---

## 2. TECH STACK — BẮT BUỘC TUÂN THỦ

| Hạng mục | Lựa chọn | Ghi chú |
|---|---|---|
| Framework | React 18+ (Vite) | Không dùng Next.js, không dùng CRA |
| Ngôn ngữ | JavaScript (JSX) | Không bắt buộc TypeScript trừ khi được yêu cầu |
| State Management | React Context API | KHÔNG dùng Redux/Zustand/Recoil |
| Styling | Vanilla CSS (CSS Variables, Flexbox, Grid) | KHÔNG dùng Tailwind, styled-components, CSS-in-JS |
| Graph Visualization | React Flow | Fallback: vis-network nếu React Flow không đáp ứng |
| Icons | react-icons (bộ Lucide `lu`) | Import theo named import, không import cả bộ |
| Font | Google Fonts — Outfit hoặc Inter | Load qua `<link>` trong `index.html`, không self-host trừ khi yêu cầu |
| Diff text (Admin) | `diff` hoặc `jsdiff` (npm) | Dùng cho Diff Preview, không tự viết thuật toán diff |

**Agent không được tự ý đổi stack** (ví dụ thêm Tailwind, đổi sang Redux) trừ khi người dùng yêu cầu rõ ràng trong prompt.

---

## 3. CẤU TRÚC THƯ MỤC CHUẨN

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.jsx
│   │   └── Sidebar.jsx
│   ├── chat/
│   │   ├── ChatWorkspace.jsx
│   │   ├── ChatHistoryList.jsx
│   │   ├── MessageItem.jsx
│   │   ├── CitationTag.jsx
│   │   ├── CitationModal.jsx
│   │   ├── WarningCard.jsx
│   │   ├── ActionableDraft.jsx
│   │   └── ChatInputArea.jsx
│   ├── graph/
│   │   ├── GraphWorkspace.jsx
│   │   ├── SearchBar.jsx
│   │   ├── GraphCanvas.jsx
│   │   ├── NodeDetailSidebar.jsx
│   │   ├── VersionTimeline.jsx
│   │   └── nodes/ (custom React Flow node components)
│   └── admin/
│       ├── AdminWorkspace.jsx
│       ├── DragDropUpload.jsx
│       └── GraphChangePreview.jsx
├── context/
│   ├── ChatContext.jsx
│   ├── GraphContext.jsx
│   └── AdminContext.jsx
├── hooks/
│   ├── useChatStream.js
│   ├── useGraphData.js
│   └── useFileUpload.js
├── services/
│   ├── api.js          (fetch wrapper, base URL, error handling)
│   ├── chatService.js
│   ├── graphService.js
│   └── adminService.js
├── utils/
│   ├── graphParser.js  (chuyển response Neo4j -> nodes/edges React Flow)
│   └── formatters.js
├── styles/
│   ├── index.css       (CSS variables, reset, global)
│   ├── theme.css        (bảng màu SHB, dark mode tokens)
│   └── animations.css
├── mocks/
│   ├── mockChatResponse.json
│   ├── mockGraphData.json
│   └── mockDiffData.json
├── App.jsx
└── main.jsx
```

**Quy tắc**: mỗi component 1 file, đặt tên PascalCase trùng tên file. Không gộp nhiều component không liên quan vào 1 file trừ khi component phụ (<20 dòng) chỉ dùng nội bộ.

---

## 4. QUY ƯỚC STATE MANAGEMENT

Tách **3 Context riêng biệt**, KHÔNG gộp thành 1 `AppContext` để tránh re-render thừa:

- **ChatContext**: `chatHistory`, `isStreaming`, `activeConversationId`
- **GraphContext**: `graphData` (nodes/edges), `selectedNode`, `searchQuery`
- **AdminContext**: `uploadQueue`, `diffPreviewData`

Mỗi Context export kèm custom hook riêng, ví dụ:
```javascript
export const useChatContext = () => useContext(ChatContext);
```

Component chỉ subscribe đúng Context nó cần — GraphCanvas không được subscribe ChatContext.

`activeTab` ('chat' | 'graph' | 'admin') quản lý ở cấp `AppLayout` bằng `useState` cục bộ, không cần đưa vào Context toàn cục.

---

## 5. QUY ƯỚC STYLING (VANILLA CSS) — DESIGN SYSTEM SHB CHÍNH THỨC

> Bảng màu "navy + gold" ở bản kế hoạch đầu tiên là suy đoán sai — đã thay bằng bản sắc thật của SHB (rebrand 2026): cam SHB signature + Midnight Navy, mô-típ hình khối "vuông ôm tròn" lấy từ logo mới (hình vuông + hình tròn + chữ S, triết lý "trời tròn, đất vuông"). File nguồn chân lý: `styles/theme.css` và `styles/animations.css` (đã tạo sẵn, xem `demo.html` để xem trực quan trước khi code component).

- Tất cả màu sắc, spacing, font-size khai báo dưới dạng CSS Variables trong `styles/theme.css`, KHÔNG hardcode giá trị màu trực tiếp trong file component CSS.
- Bảng token chính thức:
```css
:root {
  --navy-abyss: #0A1628;            /* nền chính toàn app */
  --navy-surface: #101E36;          /* panel nổi */
  --navy-surface-raised: #16294A;   /* modal, dropdown */
  --orange-signature: #F0631D;      /* cam SHB — dùng TIẾT CHẾ, chỉ CTA/moment quan trọng */
  --orange-ember: #FFAB6B;          /* cam nhạt — hover/glow nhẹ */
  --sea-blue: #1C7293;              /* cạnh REFERENCES, thông tin thứ cấp */
  --emerald-active: #2F9E68;        /* Clause còn hiệu lực */
  --brick-expired: #C0442C;         /* Clause hết hiệu lực — khác cam brand để tránh nhầm lẫn */
  --paper-ivory: #F5EFE6;           /* bề mặt "giấy" cho trích dẫn pháp lý gốc */
  --font-ui: 'Be Vietnam Pro', system-ui, sans-serif;
  --font-legal: 'Source Serif 4', Georgia, serif;   /* CHỈ dùng cho văn bản pháp lý gốc */
  --font-data: 'IBM Plex Mono', monospace;           /* mã điều khoản, timestamp */
  --radius-panel: 8px;      /* panel nghiệp vụ — gần vuông, KHÔNG bo tròn hết cỡ */
  --radius-circle: 999px;   /* CHỈ dùng cho node đồ thị, avatar, dot trạng thái */
}
```
(Xem `styles/theme.css` để có bảng đầy đủ kèm comment giải thích từng token.)
- **Nguyên tắc hình khối "vuông ôm tròn"** — áp dụng nhất quán, không tùy tiện: mọi panel/khung nghiệp vụ (ChatWorkspace, MessageItem, AdminWorkspace, modal) dùng `--radius-panel` (gần vuông); mọi node đồ thị, nút hành động chính, chấm trạng thái dùng `--radius-circle` (tròn tuyệt đối). Không bo tròn kiểu pill cho mọi thứ.
- Mỗi component có file CSS riêng cùng tên (`MessageItem.jsx` + `MessageItem.css`), import trực tiếp trong file JSX.
- **KHÔNG dùng glassmorphism tràn lan.** `backdrop-filter`/blur chỉ dùng có lý do chức năng cho modal/overlay nổi trên nội dung (ví dụ `CitationModal`), không dùng trang trí cho card/panel thường — dùng `.panel` (nền phẳng `--navy-surface` + viền mảnh) làm mặc định.
- **Bề mặt kép có chủ đích**: nội dung trích dẫn pháp lý gốc (trong `CitationModal`, `NodeDetailSidebar`) PHẢI dùng class `.paper-surface` (`--paper-ivory` + `--font-legal`), tương phản có chủ đích với phần UI tối xung quanh — không dùng font/nền UI thường cho nội dung này.
- Animation: dùng đúng các keyframes đã định nghĩa sẵn trong `styles/animations.css` (`.interactive` cho hover, `.warning-icon` cho wiggle 1 lần, `.stream-cursor` cho streaming, `.node-reveal` cho GraphCanvas load, `.signature-reveal` cho khoảnh khắc chọn node). KHÔNG tự thêm animation lặp vô hạn (float/pulse/gradient-chạy) ở nơi khác — đó là dấu hiệu giao diện AI tự sinh chung chung, đi ngược lại định hướng "đặc biệt, chuyên nghiệp" của dự án.
- Animation (wiggle, stream cursor, skeleton loading) đặt trong `animations.css`, đặt tên keyframes rõ nghĩa: `@keyframes wiggle`, `@keyframes streamCursor`.

---

## 6. QUY ƯỚC TÍCH HỢP API / MOCK DATA

- **Luôn code theo mock data trước**, đặt trong `src/mocks/`. Không chờ backend sẵn sàng mới bắt đầu UI.
- Schema mock PHẢI khớp với hợp đồng API đã thống nhất với backend. Nếu chưa có, agent tạo schema hợp lý dựa trên phần "3. CHI TIẾT TÍNH NĂNG" trong `plan_client.md` và đánh dấu rõ bằng comment `// TODO: xác nhận lại schema với backend`.
- Tất cả lời gọi API đi qua `services/api.js` (1 wrapper fetch chung xử lý base URL, headers, lỗi), KHÔNG gọi `fetch()` trực tiếp rải rác trong component.
- Biến môi trường (API base URL) đặt trong `.env` (`VITE_API_BASE_URL`), KHÔNG hardcode URL trong code.
- Ví dụ response mong đợi cho Chat API (tham khảo, agent điều chỉnh nếu backend khác):
```json
{
  "answer": "markdown string...",
  "citations": [{ "id": "clause_5_tt39", "label": "Điều 5 - TT39", "sourceText": "..." }],
  "has_conflict": false,
  "actionable_draft": { "type": "email", "content": "..." }
}
```

---

## 7. QUY ƯỚC RIÊNG TỪNG PHÂN HỆ

### 7.1 Chat Workspace
- Streaming effect: nếu backend hỗ trợ SSE, dùng `EventSource` hoặc `ReadableStream` thật. Nếu KHÔNG, giả lập bằng cách nhận full response rồi `setInterval`/`requestAnimationFrame` render dần ký tự — nhưng phải comment rõ đây là giả lập, không quảng cáo là streaming thật trong code/demo.
- `CitationTag` chỉ nhận `id` + `label`, việc fetch nội dung gốc để hiển thị trong `CitationModal` thực hiện lazy (khi click mới gọi, không preload hết).
- `WarningCard` chỉ render khi `has_conflict === true`, animation wiggle chạy 1 lần khi mount, không lặp vô hạn (tránh gây khó chịu UX).
- `ActionableDraft`: nút "Đồng bộ CRM" gọi mock endpoint riêng (`adminService.syncCrm()`), luôn có trạng thái loading + toast xác nhận thành công/thất bại.

### 7.2 Graph Workspace
- `graphParser.js` là nơi DUY NHẤT chuyển đổi dữ liệu Neo4j thô sang định dạng `{nodes, edges}` của React Flow. Không parse rải rác trong component.
- Custom node component cho `Clause` phải có 2 biến thể rõ ràng theo prop `status` ('active' | 'expired'), style qua CSS class, không dùng inline style động phức tạp.
- Test hiệu năng `backdrop-filter` khi zoom/pan sớm (ngay khi có > 20 node giả lập) — nếu giật, giảm blur hoặc tắt glass khi đang zoom (dùng React Flow's `onMoveStart`/`onMoveEnd`).
- `VersionTimeline` nhận mảng các phiên bản đã sort theo năm, render dọc, không tự sort lại trong component render (sort 1 lần khi nhận data).

### 7.3 Admin Workspace
- `DragDropUpload` dùng native Drag & Drop API (`onDragOver`, `onDrop`), không cần thư viện ngoài trừ khi cần progress bar phức tạp.
- `GraphChangePreview` dùng thư viện `diff` (jsdiff) để tính diff ở cấp word hoặc line, render kết quả `<span>` màu đỏ (removed) / xanh (added), không tự viết thuật toán so khớp chuỗi.

---

## 8. QUY TẮC LÀM VIỆC CHO AGENT

1. **Ưu tiên MVP trước, polish sau.** Khi được giao 1 tính năng, luôn implement bản chạy được (happy path) trước, rồi mới thêm edge case, animation, error state.
2. **Không tự ý thêm thư viện ngoài danh sách ở mục 2** trừ khi thực sự cần thiết và phải nêu rõ lý do trong commit message / phản hồi.
3. **Không sửa cấu trúc thư mục đã thống nhất** ở mục 3 trừ khi người dùng yêu cầu refactor.
4. **Luôn dùng mock data khi backend chưa sẵn sàng**, không được để UI "treo" chờ API thật.
5. **Comment bằng tiếng Việt cho phần business logic** (vd. quy tắc hiển thị WarningCard, luồng CRM sync) để đội ngũ non-dev dễ review; comment kỹ thuật thuần (vd. giải thích 1 thuật toán) có thể bằng tiếng Anh.
6. **Không hardcode text tiếng Việt rải rác** — gom các chuỗi UI chính vào 1 file `constants/strings.js` nếu số lượng lớn, để dễ sửa sau.
7. **Khi không chắc chắn về schema API hoặc hành vi nghiệp vụ**, agent nên đưa ra giả định hợp lý, code theo giả định đó, và đánh dấu rõ bằng `// ASSUMPTION:` để người review dễ tìm và chỉnh sửa — không dừng lại chờ hỏi nếu có thể suy luận hợp lý từ `plan_client.md`.
8. **Giữ code đơn giản, dễ đọc hơn là "clever".** Đây là hackathon, ưu tiên code người khác trong team đọc hiểu nhanh.

---

## 9. LỆNH THƯỜNG DÙNG

```bash
# Cài đặt
npm install

# Chạy dev server
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Cài thư viện chính
npm install reactflow react-icons diff
```

---

## 10. TIÊU CHÍ HOÀN THÀNH (DEFINITION OF DONE) CHO 1 TÍNH NĂNG

Một tính năng được coi là "xong" khi:
- [ ] Chạy được với mock data, không lỗi console.
- [ ] Có state loading/error cơ bản (không bắt buộc pixel-perfect).
- [ ] Tuân thủ bảng màu và font trong `theme.css`.
- [ ] Không hardcode dữ liệu test trong component (đưa vào `mocks/`).
- [ ] Đã thử tích hợp với API thật nếu backend đã sẵn sàng, hoặc để rõ `// TODO: integrate real API`.

---

*File này áp dụng cho toàn bộ vòng đời phát triển frontend của dự án. Cập nhật file này nếu có thay đổi lớn về kiến trúc hoặc tech stack.*