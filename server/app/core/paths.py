from pathlib import Path

from app.core.config import PROJECT_ROOT


DATABASE_DIR = PROJECT_ROOT / "database"
DOCUMENTS_DIR = DATABASE_DIR / "documents" / "seed"
INDEXES_DIR = DATABASE_DIR / "indexes"
SQLITE_DATABASE_FILE = INDEXES_DIR / "data.db"
FAISS_INDEX_FILE = INDEXES_DIR / "faiss.index"


def project_paths(project_root: str | Path | None = None) -> dict[str, Path]:
    """Resolve storage paths for production and isolated ingestion tests."""
    root = Path(project_root).resolve() if project_root else PROJECT_ROOT
    database = root / "database"
    indexes = database / "indexes"
    return {
        "root": root,
        "database": database,
        "documents": database / "documents" / "seed",
        "indexes": indexes,
        "sqlite": indexes / "data.db",
        "faiss": indexes / "faiss.index",
    }
