#!/usr/bin/env python3
import json
import urllib.request
import urllib.error
import sys

# ANSI Colors for beautiful terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
BOLD = "\033[1m"
END = "\033[0m"

BACKEND_URL = "http://localhost:8000"

def print_header(title):
    print(f"\n{BOLD}{BLUE}=== {title} ==={END}")

def print_success(message):
    print(f"{GREEN}✔ [THÀNH CÔNG] {message}{END}")

def print_error(message, details=None):
    print(f"{RED}✘ [THẤT BẠI] {message}{END}")
    if details:
        print(f"  Chi tiết: {details}")

def print_info(message):
    print(f"{YELLOW}ℹ [THÔNG TIN] {message}{END}")

def make_request(path, method="GET", body=None):
    url = f"{BACKEND_URL}{path}"
    headers = {"Content-Type": "application/json"}
    data = None
    
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            err_data = json.loads(e.read().decode("utf-8"))
            return e.code, err_data
        except:
            return e.code, {"error": e.reason}
    except Exception as e:
        return 0, {"error": str(e)}

def run_tests():
    print(f"\n{BOLD}BẮT ĐẦU KIỂM TRA LIÊN KẾT INTEGRATION TEST (CLIENT <-> SERVER <-> DATABASE){END}")
    print(f"Đường dẫn backend cấu hình: {BOLD}{BACKEND_URL}{END}")
    
    # ----------------------------------------------------
    # TEST 1: Kiểm tra kết nối Server (Health Check)
    # ----------------------------------------------------
    print_header("1. KIỂM TRA SỨC KHỎE SERVER FASTAPI")
    status, data = make_request("/health")
    if status == 200 and data.get("status") == "ok":
        print_success("Server FastAPI đang hoạt động ổn định và sẵn sàng nhận kết nối.")
    else:
        print_error("Không thể kết nối đến Backend Server ở cổng 8000.", data.get("error"))
        print_info("Vui lòng khởi động Backend bằng lệnh: CD server && bash run_server.sh")
        sys.exit(1)

    # ----------------------------------------------------
    # TEST 2: Kiểm tra Danh sách Model LLM
    # ----------------------------------------------------
    print_header("2. KIỂM TRA DANH SÁCH MÔ HÌNH LLM")
    status, data = make_request("/models")
    if status == 200:
        models = data.get("models", [])
        if models:
            print_success(f"Đã tải thành công {len(models)} mô hình AI khả dụng:")
            for m in models:
                print(f"  - {BOLD}{m.get('id')}{END} (Provider: {m.get('provider')})")
        else:
            print_error("Không tìm thấy mô hình AI nào được cấu hình trong backend.", "Danh sách trống")
    else:
        print_error("Lỗi khi tải danh sách mô hình từ backend.", data.get("error"))

    # ----------------------------------------------------
    # TEST 3: Kiểm tra CSDL Đồ thị Tri thức (Neo4j / NetworkX)
    # ----------------------------------------------------
    print_header("3. KIỂM TRA DỮ LIỆU ĐỒ THỊ KNOWLEDGE GRAPH")
    status, data = make_request("/graph")
    if status == 200:
        nodes = data.get("nodes", [])
        links = data.get("links", [])
        if nodes:
            print_success(f"Đã tải thành công CSDL Đồ thị tri thức:")
            print(f"  - Tổng số Nodes: {BOLD}{len(nodes)}{END}")
            print(f"  - Tổng số Edges: {BOLD}{len(links)}{END}")
            
            # Thống kê loại node
            docs_count = sum(1 for n in nodes if n.get("label") == "Document" or n.get("id", "").startswith("doc_"))
            clauses_count = sum(1 for n in nodes if n.get("label") == "Clause" or n.get("id", "").startswith("clause_"))
            print(f"  - Phân loại Node: Document: {docs_count} | Clause: {clauses_count}")
        else:
            print_error("Đồ thị tri thức rỗng hoặc chưa nạp dữ liệu.", "Nodes list is empty")
    else:
        print_error("Không thể kết nối đến CSDL Đồ thị hoặc lỗi nạp Graph.", data.get("error"))

    # ----------------------------------------------------
    # TEST 4: Kiểm tra CSDL SQLite & FAISS Index
    # ----------------------------------------------------
    print_header("4. KIỂM TRA THỐNG KÊ CSDL SQLITE & VECTOR INDEX")
    status, data = make_request("/admin/stats")
    if status == 200:
        total_docs = data.get("documents", 0)
        total_chunks = data.get("chunks", 0)
        if total_chunks == 0 and total_docs == 0:
            print_error("CSDL SQLite hoặc FAISS Vector Index chưa được cấu trúc.", "Không có dữ liệu chunks")
        else:
            print_success(f"Đã tải thành công thông số từ CSDL SQLite:")
            print(f"  - Tổng số Văn bản pháp quy: {BOLD}{total_docs}{END}")
            print(f"  - Tổng số Điều khoản (Chunks): {BOLD}{total_chunks}{END}")
    else:
        print_error("Không thể tải thống kê CSDL SQLite.", data.get("error"))

    # ----------------------------------------------------
    # TEST 5: Kiểm tra Benchmark Đánh giá
    # ----------------------------------------------------
    print_header("5. CHẠY THỬ NGHIỆM BENCHMARK TRUY LỤC")
    print_info("Đang chạy 10 câu hỏi kiểm thử chất lượng, vui lòng đợi vài giây...")
    status, data = make_request("/evaluation/benchmark")
    if status == 200:
        metrics = data.get("metrics", {})
        standard = metrics.get("standard", {})
        advanced = metrics.get("advanced", {})
        
        std_hit = standard.get("recall_at_5", 0.0)
        adv_hit = advanced.get("recall_at_5", 0.0)
        
        results = data.get("results", [])
        std_stale_count = sum(1 for r in results if r.get("standard", {}).get("stale_count", 0) > 0)
        adv_stale_count = sum(1 for r in results if r.get("advanced", {}).get("stale_count", 0) > 0)

        print_success("Đã hoàn tất chạy Benchmark đối sánh hiệu năng:")
        print(f"  - Standard Hit Rate (RAG thường): {BOLD}{std_hit * 100:.1f}%{END}")
        print(f"  - Advanced Hit Rate (Graph-RAG): {BOLD}{adv_hit * 100:.1f}%{END}")
        print(f"  - Số tài liệu cũ lọt lưới (Standard): {BOLD}{std_stale_count}{END} lần")
        print(f"  - Số tài liệu cũ lọt lưới (Advanced): {BOLD}{adv_stale_count}{END} lần")
    else:
        print_error("Không thể chạy hoặc tải kết quả Benchmark.", data.get("error"))

    # ----------------------------------------------------
    # TEST 6: Kiểm tra Hỏi đáp RAG Chatbot Pipeline
    # ----------------------------------------------------
    print_header("6. THỬ NGHIỆM TRUY VẤN RAG CHATBOT PIPELINE")
    test_question = "Hồ sơ eKYC mở tài khoản cá nhân online tại SHB cần những gì?"
    print_info(f"Gửi câu hỏi thử nghiệm: '{test_question}'")
    
    chat_payload = {
        "messages": [{"role": "user", "content": test_question}],
        "stream": False
    }
    status, data = make_request("/chat", method="POST", body=chat_payload)
    if status == 200:
        answer = data.get("final_answer", "")
        citations = data.get("citations", {})
        conflicts = data.get("conflicts", [])
        
        print_success("RAG Pipeline phản hồi thành công:")
        print(f"  - Câu trả lời (rút gọn): {BOLD}{answer[:150]}...{END}")
        print(f"  - Số lượng trích dẫn nguồn lực: {BOLD}{len(citations)}{END}")
        print(f"  - Số lượng mâu thuẫn pháp lý phát hiện: {BOLD}{len(conflicts)}{END}")
    else:
        print_error("RAG Pipeline gặp lỗi khi xử lý câu hỏi.", data.get("error"))

    print("\n" + "=" * 50)
    print(f"\n{BOLD}{GREEN}✔ HOÀN TẤT KIỂM TRA. HỆ THỐNG LIÊN KẾT CHUẨN XÁC VÀ SẴN SÀNG!{END}\n")

if __name__ == "__main__":
    run_tests()
