import os
import re
import shutil
import subprocess
import tempfile
import threading
from typing import Any, Callable, Dict, Optional
from app.core.paths import project_paths


class IngestionError(Exception):
    pass


class IngestionBusyError(IngestionError):
    pass


class IngestionService:
    _lock = threading.Lock()
    MAX_FILE_SIZE = 5 * 1024 * 1024
    ARTIFACTS = ("data.db", "faiss.index")

    def __init__(
        self,
        project_root: Optional[str] = None,
        runner: Optional[Callable[..., Any]] = None,
    ):
        paths = project_paths(project_root)
        self.project_root = str(paths["root"])
        self.index_dir = str(paths["indexes"])
        self.raw_dir = str(paths["documents"])
        self.runner = runner or subprocess.run

    def ingest_markdown(self, filename: str, content: str) -> Dict[str, Any]:
        safe_name = self._validate(filename, content)
        if not self._lock.acquire(blocking=False):
            raise IngestionBusyError("Một tài liệu khác đang được lập chỉ mục.")

        target_file = os.path.join(self.raw_dir, safe_name)
        if os.path.exists(target_file):
            self._lock.release()
            raise IngestionError("Tên tài liệu đã tồn tại trong kho dữ liệu.")

        os.makedirs(self.raw_dir, exist_ok=True)
        backup_dir = tempfile.mkdtemp(prefix="rag-ingestion-")
        existing_artifacts = set()
        try:
            for artifact in self.ARTIFACTS:
                source = os.path.join(self.index_dir, artifact)
                if os.path.exists(source):
                    shutil.copy2(source, os.path.join(backup_dir, artifact))
                    existing_artifacts.add(artifact)

            with open(target_file, "x", encoding="utf-8") as file_handle:
                file_handle.write(content)

            self.runner(
                ["python3", "indexing/build_index.py"],
                cwd=os.path.join(self.project_root, "backend"),
                check=True,
                capture_output=True,
                text=True,
                timeout=1800,
            )
            return {
                "status": "indexed",
                "filename": safe_name,
                "restart_required": False,
                "message": "Đã lập chỉ mục và nạp kho tri thức mới vào hệ thống.",
            }
        except Exception as error:
            if os.path.exists(target_file):
                os.remove(target_file)
            for artifact in self.ARTIFACTS:
                destination = os.path.join(self.index_dir, artifact)
                backup = os.path.join(backup_dir, artifact)
                if artifact in existing_artifacts:
                    shutil.copy2(backup, destination)
                elif os.path.exists(destination):
                    os.remove(destination)
            raise IngestionError(f"Lập chỉ mục thất bại; dữ liệu cũ đã được khôi phục: {error}") from error
        finally:
            shutil.rmtree(backup_dir, ignore_errors=True)
            self._lock.release()

    def _validate(self, filename: str, content: str) -> str:
        safe_name = os.path.basename((filename or "").strip())
        if safe_name != filename or not safe_name.lower().endswith(".md"):
            raise IngestionError("Chỉ chấp nhận tên file Markdown (.md) an toàn.")
        if not re.fullmatch(r"[A-Za-z0-9._-]+\.md", safe_name):
            raise IngestionError("Tên file chỉ được chứa chữ, số, dấu chấm, gạch ngang và gạch dưới.")
        encoded = (content or "").encode("utf-8")
        if not encoded or len(encoded) > self.MAX_FILE_SIZE:
            raise IngestionError("File phải có nội dung và không vượt quá 5 MB.")
        if not any(line.startswith("# ") for line in content.splitlines()):
            raise IngestionError("Tài liệu phải có tiêu đề Markdown cấp 1 (# Tiêu đề).")
        return safe_name
