from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Tuple


class DocumentationService:
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

    def get_context(self, query: str, max_chars: int = 4000) -> str:
        documents = self.load_documents()
        if not documents:
            return ""

        normalized = (query or "").strip().lower()
        scored: List[Tuple[int, str, str]] = []

        for name, content in documents.items():
            text = f"{name}\n{content}".lower()
            score = 0
            if normalized:
                for keyword in self._keywords(name, normalized):
                    if keyword in text:
                        score += 3
                if normalized in text:
                    score += 6

            if score > 0:
                scored.append((score, name, content))

        if not scored:
            return ""

        scored.sort(key=lambda item: item[0], reverse=True)
        best_name, best_content = scored[0][1], scored[0][2]
        relevant = self._summarize(best_name, best_content)
        if len(relevant) > max_chars:
            relevant = relevant[: max_chars - 3] + "..."
        return relevant

    def _keywords(self, name: str, normalized: str) -> List[str]:
        keywords = [name]
        if "workflow" in normalized:
            keywords.extend(["workflow", "builder"])
        if "history" in normalized:
            keywords.extend(["history", "execution"])
        if "saved" in normalized or "workflow" in normalized:
            keywords.extend(["saved", "workflow"])
        if "recent" in normalized or "run" in normalized:
            keywords.extend(["recent", "run"])
        if "user" in normalized:
            keywords.extend(["user", "management"])
        if "password" in normalized:
            keywords.extend(["password", "account"])
        if "login" in normalized or "registration" in normalized:
            keywords.extend(["login", "registration"])
        return list(dict.fromkeys(keywords))

    def _summarize(self, name: str, content: str) -> str:
        lines = [line.strip() for line in content.splitlines() if line.strip()]
        title = lines[0].lstrip("#").strip() if lines else name.replace("-", " ").title()
        body_lines: List[str] = []
        for line in lines[1:]:
            if line.startswith("##"):
                continue
            body_lines.append(line)
        summary = " ".join(body_lines).strip()
        if len(summary) > 1800:
            summary = summary[:1797] + "..."
        if not summary:
            return f"Documentation for {title}: use the markdown file for complete details."
        return f"Documentation title: {title}\n\n{summary}"
