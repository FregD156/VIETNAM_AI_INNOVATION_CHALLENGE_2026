from pathlib import Path
from typing import Optional, Union

from app.core.config import PROJECT_ROOT


DATABASE_DIR = PROJECT_ROOT / "database"
DOCUMENTS_DIR = DATABASE_DIR / "documents" / "seed"
INDEXES_DIR = DATABASE_DIR / "indexes"
SQLITE_DATABASE_FILE = INDEXES_DIR / "data.db"
FAISS_INDEX_FILE = INDEXES_DIR / "faiss.index"

# New paths for Phase 0 - Corpus Preparation
CRAWLED_SHB_DATA_DIR = DATABASE_DIR / "crawled_shb_data"
PREPARED_DIR = DATABASE_DIR / "prepared"
MANIFESTS_DIR = PREPARED_DIR / "manifests"
CANONICAL_DIR = PREPARED_DIR / "canonical"
MARKDOWN_DIR = PREPARED_DIR / "markdown"
REPORTS_DIR = PREPARED_DIR / "reports"
CACHE_DIR = PREPARED_DIR / "cache"
INDEXES_STAGING_DIR = DATABASE_DIR / "indexes-staging"


def project_paths(project_root: Optional[Union[str, Path]] = None) -> dict[str, Path]:
    """Resolve storage paths for production and isolated ingestion tests."""
    root = Path(project_root).resolve() if project_root else PROJECT_ROOT
    database = root / "database"
    indexes = database / "indexes"
    prepared = database / "prepared"
    return {
        "root": root,
        "database": database,
        "documents": database / "documents" / "seed",
        "indexes": indexes,
        "sqlite": indexes / "data.db",
        "faiss": indexes / "faiss.index",
        # Phase 0 additions
        "crawled_shb_data": database / "crawled_shb_data",
        "prepared": prepared,
        "manifests": prepared / "manifests",
        "canonical": prepared / "canonical",
        "markdown": prepared / "markdown",
        "reports": prepared / "reports",
        "cache": prepared / "cache",
        "indexes_staging": database / "indexes-staging",
    }

