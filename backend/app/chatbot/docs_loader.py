from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Dict


class DocsLoader:
    def __init__(self, docs_root: str | None = None) -> None:
        default_root = Path(__file__).resolve().parents[3] / "docs"
        self.docs_root = Path(docs_root or default_root)

    @lru_cache(maxsize=1)
    def load_documents(self) -> Dict[str, str]:
        documents: Dict[str, str] = {}
        if not self.docs_root.exists():
            return documents

        for path in sorted(self.docs_root.glob("*.md")):
            if path.is_file():
                documents[path.stem] = path.read_text(encoding="utf-8")

        return documents
