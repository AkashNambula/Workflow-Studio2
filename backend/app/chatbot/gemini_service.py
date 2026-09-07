from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, Dict

from dotenv import load_dotenv

try:
    from google import genai as genai
except Exception:  # pragma: no cover - runtime fallback
    try:
        import google.generativeai as genai
    except Exception:  # pragma: no cover - runtime fallback
        genai = None

logger = logging.getLogger(__name__)
DEFAULT_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash-latest"]


def _load_environment() -> None:
    backend_dir = Path(__file__).resolve().parents[2]
    env_path = backend_dir / ".env"
    if env_path.exists():
        load_dotenv(env_path, override=False)
    else:
        load_dotenv(override=False)


_load_environment()


class GeminiService:
    def __init__(self, api_key: str | None = None) -> None:
        _load_environment()
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model = None
        self.model_name = None
        if self.api_key and genai is not None:
            try:
                if hasattr(genai, "configure"):
                    genai.configure(api_key=self.api_key)
                if hasattr(genai, "Client"):
                    try:
                        self.client = genai.Client(api_key=self.api_key)
                        self.model = self.client.models
                        self.model_name = DEFAULT_MODELS[0]
                        logger.info("Gemini client initialized successfully with sdk %s", type(genai).__name__)
                    except Exception as exc:
                        logger.warning("Gemini client initialization failed: %s", exc)
                        self.client = None
                        self.model = None
                else:
                    for model_name in DEFAULT_MODELS:
                        try:
                            self.model = genai.GenerativeModel(model_name)
                            self.model_name = model_name
                            logger.info("Gemini client initialized successfully with model %s", model_name)
                            break
                        except Exception as exc:
                            logger.warning("Gemini model %s failed to initialize: %s", model_name, exc)
                    if self.model is None:
                        logger.warning("No Gemini model could be initialized")
            except Exception:
                logger.exception("Failed to initialize Gemini client")
                self.model = None
        elif not self.api_key:
            logger.warning("GEMINI_API_KEY is not configured")
        else:
            logger.warning("google.generativeai is not available in the current backend environment")

    def generate_response(self, prompt: str) -> str:
        if not self.api_key or self.model is None:
            logger.warning("Gemini client is unavailable; returning fallback response")
            return "The assistant is temporarily unavailable because the Gemini API key is not configured or the client could not be initialized."

        try:
            if self.client is not None:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                )
            else:
                response = self.model.generate_content(prompt)
            text = getattr(response, "text", None)
            if text:
                logger.info("Gemini generated a response successfully with model %s", self.model_name)
                return text.strip()
            logger.warning("Gemini returned an empty response")
            return "I’m unable to generate a response right now."
        except Exception as exc:  # pragma: no cover - defensive fallback
            logger.exception("Gemini generation failed")
            return f"The assistant could not reach Gemini right now: {exc}"