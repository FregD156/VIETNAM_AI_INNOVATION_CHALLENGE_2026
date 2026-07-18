import re
from typing import Any, Dict, List, Tuple


class CitationGuard:
    CITATION_PATTERN = re.compile(r"\[(\d+)\]")

    def validate(
        self, answer: str, citations: Dict[str, Dict[str, Any]]
    ) -> Tuple[str, Dict[str, Dict[str, Any]], List[str]]:
        warnings: List[str] = []
        active_citations = {
            str(key): value
            for key, value in citations.items()
            if not self._is_inactive(value)
        }
        referenced = set(self.CITATION_PATTERN.findall(answer or ""))
        invalid = referenced - set(active_citations)

        if invalid:
            warnings.append(
                "Đã loại bỏ chỉ dẫn nguồn không tồn tại hoặc không còn hiệu lực: "
                + ", ".join(f"[{key}]" for key in sorted(invalid, key=int))
            )
            answer = self.CITATION_PATTERN.sub(
                lambda match: match.group(0) if match.group(1) in active_citations else "",
                answer,
            )

        if active_citations and not (referenced & set(active_citations)):
            warnings.append("Câu trả lời chưa gắn trích dẫn trực tiếp; cần kiểm tra nguồn trước khi áp dụng.")
        if not active_citations:
            warnings.append("Không có nguồn đang hiệu lực đủ để kiểm chứng câu trả lời.")

        used = referenced & set(active_citations)
        validated = {
            key: {**value, "validation_status": "active"}
            for key, value in active_citations.items()
            if key in used
        }
        return (answer or "").strip(), validated, warnings

    @staticmethod
    def _is_inactive(citation: Dict[str, Any]) -> bool:
        metadata = citation.get("metadata", citation)
        status = str(metadata.get("status", "")).lower()
        return "hết hiệu lực" in status or "superseded" in status or "repealed" in status
