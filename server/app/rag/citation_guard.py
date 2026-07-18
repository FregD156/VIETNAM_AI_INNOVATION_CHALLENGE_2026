from __future__ import annotations

import re
from typing import Any


class CitationGuard:
    CITATION_PATTERN = re.compile(r"\[(\d+)\]")
    NON_NUMERIC_CITATION_PATTERN = re.compile(r"\[([^\]\d][^\]]*)\]")
    LEGAL_CLAIM_PATTERN = re.compile(
        r"\b(phải|không được|được phép|giới hạn|hạn mức|hiệu lực|thay thế|"
        r"điều|khoản|thông tư|quy định|vnd|triệu|tỷ|%)\b|\d",
        re.IGNORECASE | re.UNICODE,
    )
    ABSTENTION = (
        "Không đủ nguồn đang hiệu lực và được kiểm chứng để đưa ra kết luận. "
        "Vui lòng thu hẹp câu hỏi hoặc chuyển chuyên viên pháp chế rà soát."
    )

    def validate(
        self, answer: str, citations: dict[str, dict[str, Any]]
    ) -> tuple[str, dict[str, dict[str, Any]], list[str]]:
        warnings: list[str] = []
        active = {
            str(key): value
            for key, value in citations.items()
            if not self._is_inactive(value)
        }
        if not active:
            return self.ABSTENTION, {}, [
                "Không có nguồn đang hiệu lực trong evidence pack; hệ thống đã từ chối kết luận."
            ]

        answer = (answer or "").strip()
        non_numeric = self.NON_NUMERIC_CITATION_PATTERN.findall(answer)
        if non_numeric:
            answer = self.NON_NUMERIC_CITATION_PATTERN.sub("", answer)
            warnings.append("Đã loại placeholder trích dẫn không hợp lệ khỏi câu trả lời.")
        referenced = set(self.CITATION_PATTERN.findall(answer))
        invalid = referenced - set(active)
        if invalid:
            warnings.append(
                "Đã loại chỉ dẫn nguồn không tồn tại hoặc không hiệu lực: "
                + ", ".join(f"[{item}]" for item in sorted(invalid, key=int))
            )
            answer = self.CITATION_PATTERN.sub(
                lambda match: match.group(0) if match.group(1) in active else "",
                answer,
            )

        kept_lines: list[str] = []
        removed_claims = 0
        for line in answer.splitlines():
            stripped = line.strip()
            if not stripped:
                kept_lines.append(line)
                continue
            if self.LEGAL_CLAIM_PATTERN.search(stripped) and not self.CITATION_PATTERN.search(
                stripped
            ):
                removed_claims += 1
                continue
            kept_lines.append(line)
        answer = "\n".join(kept_lines).strip()
        if removed_claims:
            warnings.append(
                f"Đã loại {removed_claims} ý pháp lý không có trích dẫn trực tiếp."
            )

        used = set(self.CITATION_PATTERN.findall(answer)) & set(active)
        if not used:
            warnings.append(
                "Câu trả lời không có trích dẫn hợp lệ; hệ thống đã từ chối kết luận."
            )
            return self.ABSTENTION, {}, warnings

        validated = {
            key: {**active[key], "validation_status": "active"}
            for key in sorted(used, key=int)
        }
        return answer, validated, warnings

    @staticmethod
    def _is_inactive(citation: dict[str, Any]) -> bool:
        if citation.get("temporal_status") not in {None, "effective"}:
            return True
        metadata = citation.get("metadata", citation)
        status = str(metadata.get("status", "")).strip().lower()
        return status in {"hết hiệu lực", "superseded", "repealed"}
