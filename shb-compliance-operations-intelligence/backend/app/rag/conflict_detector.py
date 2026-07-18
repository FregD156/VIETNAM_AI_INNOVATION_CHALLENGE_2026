import json
import re
from typing import List, Dict, Any, Optional
from app.integrations.llm_client import ChatService

CONFLICT_SCHEMA = {"type": "json_object"}

class ConflictDetector:
    def __init__(self):
        self.chat_service = ChatService()
        self.last_status = "not_evaluated"
        
    def detect_conflicts(self, docs: List[Dict[str, Any]], model: Optional[str] = None) -> List[Dict[str, Any]]:
        # 1. Check if we have both national law/circulars and SHB policies
        has_national = False
        has_shb = False
        
        for d in docs:
            meta = d.get("metadata", {})
            doc_num = meta.get("doc_num", "").upper()
            title = meta.get("title", "").upper()
            if "TT-NHNN" in doc_num or "QH" in doc_num or "LUẬT" in title or "THÔNG TƯ" in title:
                has_national = True
            if "SHB" in doc_num or "SHB" in title:
                has_shb = True
                
        # If we don't have both, no conflict can exist between internal & external
        if not (has_national and has_shb):
            self.last_status = "insufficient_evidence"
            return []
            
        # 2. Prepare the prompt for LLM comparison
        context = ""
        for i, d in enumerate(docs):
            context += f"[{i+1}]: {d.get('content')}\n"
            
        prompt = (
            f"Hãy đối chiếu các đoạn văn bản pháp luật quốc gia (Thông tư, Luật) và quy định nội bộ ngân hàng (SHB) dưới đây. "
            f"Phát hiện xem có sự mâu thuẫn, xung đột hoặc vi phạm pháp luật nào không (ví dụ: Quy chế nội bộ SHB vượt quá hạn mức cho phép của Ngân hàng Nhà nước, "
            f"hoặc thiếu các điều kiện bắt buộc).\n\n"
            f"--- Ngữ cảnh các điều khoản ---\n{context}\n\n"
            f"Yêu cầu:\n"
            f"1. Xác định rõ loại xung đột (type), mức độ nghiêm trọng (severity: 'high', 'medium', 'low'), mô tả chi tiết xung đột (description), "
            f"điều khoản luật quốc gia tương ứng (law_clause), điều khoản quy chế nội bộ SHB tương ứng (policy_clause), và hướng khắc phục đề xuất (resolution).\n"
            f"2. Trả về kết quả dưới dạng JSON thuần túy theo cấu trúc: {{'conflicts': [{{'type': '...', 'severity': '...', 'description': '...', 'law_clause': '...', 'policy_clause': '...', 'resolution': '...'}}]}}. Nếu không có mâu thuẫn nào, trả về mảng 'conflicts' rỗng."
        )
        
        try:
            response_content = ""
            messages = [
                {"role": "system", "content": "Bạn là chuyên gia kiểm soát tuân thủ ngân hàng thông minh. Hãy phân tích các văn bản và phát hiện mâu thuẫn một cách chính xác. Trả về kết quả dạng JSON chứa key 'conflicts'."},
                {"role": "user", "content": prompt + " /no_think"}
            ]
            
            try:
                for message in self.chat_service.generate_response(
                    messages,
                    response_format=CONFLICT_SCHEMA,
                    stream=False,
                    model=model
                ):
                    response_content = getattr(message, "content", "") or ""
            except Exception as schema_err:
                print(f"Lỗi gọi với schema: {schema_err}. Tiến hành gọi không kèm schema...")
                for message in self.chat_service.generate_response(
                    messages,
                    stream=False,
                    model=model
                ):
                    response_content = getattr(message, "content", "") or ""
                
            # Clean response text
            clean_content = re.sub(r'```json\s*|\s*```', '', response_content).strip()
            # Find JSON block
            json_match = re.search(r'\{.*\}', clean_content, re.DOTALL)
            if json_match:
                clean_content = json_match.group(0)
            
            # Remove trailing commas
            clean_content = re.sub(r',\s*([\]}])', r'\1', clean_content)
            
            data = json.loads(clean_content)
            conflicts = data.get("conflicts", [])
            required = {"type", "severity", "description", "law_clause", "policy_clause", "resolution"}
            conflicts = [item for item in conflicts if isinstance(item, dict) and required <= set(item)]
            self.last_status = "detected" if conflicts else "no_conflict_found"
            return conflicts
        except Exception as e:
            print(f"Lỗi khi phát hiện mâu thuẫn: {e}")
            self.last_status = "analysis_failed"
            return []
