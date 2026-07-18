from __future__ import annotations

import json
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.benchmark_service import BenchmarkService  # noqa: E402


def main() -> None:
    result = BenchmarkService().run()
    output_dir = PROJECT_ROOT / "docs" / "evaluation"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / "benchmark-results.json"
    output_file.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Saved {result['gold_cases']} cases to {output_file}")
    print(json.dumps(result["metrics"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
