import os
from typing import List, Dict, Any, Generator, Optional
from dotenv import load_dotenv
from openai import OpenAI
from app.integrations.reranker_client import OpenAIExtended

load_dotenv()

# --- CẤU HÌNH CHAT ---
CHAT_MODEL_NAME = os.getenv('CHAT_MODEL_NAME', 'gpt-4o-mini')
CHAT_BASE_URL = os.getenv("CHAT_BASE_URL", "https://api.openai.com/v1")
CHAT_API_KEY = os.getenv("CHAT_API_KEY", '')

# --- CẤU HÌNH EMBEDDING ---
EMBEDDING_MODEL_NAME = os.getenv('EMBEDDING_MODEL_NAME', 'text-embedding-3-small')
EMBEDDING_BASE_URL = os.getenv("EMBEDDING_BASE_URL", "https://api.openai.com/v1")
EMBEDDING_API_KEY = os.getenv("EMBEDDING_API_KEY", '')

# --- CẤU HÌNH RERANK ---
RERANKER_MODEL_NAME = os.getenv("RERANKER_MODEL_NAME")
RERANKER_BASE_URL = os.getenv("RERANKER_BASE_URL")
RERANKER_API_KEY = os.getenv("RERANKER_API_KEY")


def _configured_model_names(variable: str, defaults: str = "") -> List[str]:
    raw_value = os.getenv(variable, defaults)
    return [name.strip() for name in raw_value.split(",") if name.strip()]


def get_available_chat_models() -> List[Dict[str, str]]:
    """Return selectable models without exposing provider credentials."""
    base_url = CHAT_BASE_URL.lower()
    
    # Xác định provider và kiểm tra xem API key thực tế tương ứng có tồn tại hay không
    is_key_provided = True
    if "groq" in base_url:
        default_provider_key = "groq"
        default_provider = "Groq"
        is_key_provided = bool(os.getenv("GROQ_API_KEY") or CHAT_API_KEY)
    elif "fpt" in base_url:
        default_provider_key = "fpt"
        default_provider = "FPT AI Factory"
        is_key_provided = bool(os.getenv("FPT_API_KEY") or CHAT_API_KEY)
    elif "openai" in base_url:
        default_provider_key = "openai"
        default_provider = "OpenAI"
        is_key_provided = bool(os.getenv("OPENAI_API_KEY") or CHAT_API_KEY)
    elif "localhost" in base_url or "127.0.0.1" in base_url:
        default_provider_key = "ollama"
        default_provider = "Local"
        # Vô hiệu hóa model local mặc định khi chạy offline không có cấu hình rõ ràng
        is_key_provided = False
    else:
        default_provider_key = "configured"
        default_provider = "Configured endpoint"
        is_key_provided = bool(CHAT_API_KEY)

    models = []
    # Chỉ thêm model mặc định nếu API Key thực tế tương ứng được khai báo
    if is_key_provided and CHAT_MODEL_NAME:
        models.append(
            {
                "id": "",
                "label": f"{CHAT_MODEL_NAME} · Mặc định",
                "provider": default_provider,
            }
        )

    provider_models = []
    if os.getenv("GROQ_API_KEY"):
        provider_models.extend(
            ("groq", name, "Groq")
            for name in _configured_model_names(
                "GROQ_CHAT_MODELS",
                "openai/gpt-oss-20b,openai/gpt-oss-120b,qwen/qwen3.6-27b",
            )
        )
    if os.getenv("FPT_API_KEY") or os.getenv("EMBEDDING_API_KEY"):
        provider_models.extend(
            ("fpt", name, "FPT AI Factory")
            for name in _configured_model_names(
                "FPT_CHAT_MODELS",
                "Llama-3.3-70B-Instruct",
            )
        )
    if os.getenv("OPENAI_API_KEY"):
        provider_models.extend(
            ("openai", name, "OpenAI")
            for name in _configured_model_names("OPENAI_CHAT_MODELS")
        )
    if os.getenv("OLLAMA_BASE_URL"):
        provider_models.extend(
            ("ollama", name, "Ollama")
            for name in _configured_model_names(
                "OLLAMA_CHAT_MODELS",
                "qwen2.5:3b",
            )
        )

    seen_ids = {""}
    for provider, model_name, provider_label in provider_models:
        if provider == default_provider_key and model_name == CHAT_MODEL_NAME:
            continue
        model_id = f"{provider}/{model_name}"
        if model_id in seen_ids:
            continue
        seen_ids.add(model_id)
        models.append(
            {
                "id": model_id,
                "label": f"{model_name} · {provider_label}",
                "provider": provider_label,
            }
        )
    return models


class ChatService:
    def __init__(self, api_key: Optional[str] = None):
        # Cung cấp key giữ chỗ để tránh crash khi khởi tạo client của thư viện openai
        chat_key = api_key or CHAT_API_KEY or "no_key_provided"
        embed_key = EMBEDDING_API_KEY or "no_key_provided"

        # Client cho Chat (LLM)
        self.chat_client = OpenAI(
            base_url=CHAT_BASE_URL,
            api_key=chat_key
        )
        
        # Client cho Embedding
        self.embedding_client = OpenAI(
            base_url=EMBEDDING_BASE_URL,
            api_key=embed_key
        )
        
        # Client cho Rerank (optional)
        if (
            RERANKER_MODEL_NAME
            and RERANKER_BASE_URL
            and RERANKER_API_KEY
        ):
            self.rerank_client = OpenAIExtended(
                base_url=RERANKER_BASE_URL,
                api_key=RERANKER_API_KEY
            )
        else:
            self.rerank_client = None

    def get_embedding(self, text: str) -> List[float]:
        """Lấy vector embedding từ model."""
        try:
            response = self.embedding_client.embeddings.create(
                model=EMBEDDING_MODEL_NAME,
                input=text,
                timeout=15.0
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Lỗi embedding: {e}")
            return []

    def get_rerank_scores(self, query: str, documents: List[str]) -> List[float]:
        """
        Nếu không cấu hình reranker thì trả về score mặc định
        để giữ nguyên thứ tự documents.
        """
        if not documents:
            return []

        # Không dùng reranker -> giữ nguyên thứ tự
        if self.rerank_client is None:
            return [1.0] * len(documents)

        try:
            response = self.rerank_client.reranker.create(
                model=RERANKER_MODEL_NAME,
                query=query,
                documents=documents
            )

            score_map = {
                res.index: res.relevance_score
                for res in response.results
            }

            return [
                score_map.get(i, 0.0)
                for i in range(len(documents))
            ]

        except Exception as e:
            print(f"Lỗi rerank: {e}")
            return [1.0] * len(documents)
    def _get_client_and_model(self, model_spec: Optional[str]):
        if not model_spec:
            return self.chat_client, CHAT_MODEL_NAME

        parts = model_spec.split('/', 1)
        if len(parts) == 2:
            provider, actual_model = parts[0].lower(), parts[1]
        else:
            # Fallback if provider prefix is omitted
            provider = "groq" if "llama" in model_spec or "mixtral" in model_spec else "ollama"
            actual_model = model_spec

        if provider == "groq":
            groq_key = os.getenv("GROQ_API_KEY") or os.getenv("CHAT_API_KEY")
            return OpenAI(base_url="https://api.groq.com/openai/v1", api_key=groq_key), actual_model
        elif provider == "ollama":
            ollama_url = os.getenv("OLLAMA_BASE_URL") or "http://localhost:11434/v1"
            return OpenAI(base_url=ollama_url, api_key="ollama"), actual_model
        elif provider == "openai":
            openai_key = os.getenv("OPENAI_API_KEY") or ""
            return OpenAI(base_url="https://api.openai.com/v1", api_key=openai_key), actual_model
        elif provider == "fpt":
            fpt_key = os.getenv("FPT_API_KEY") or os.getenv("EMBEDDING_API_KEY") or ""
            return OpenAI(base_url="https://mkp-api.fptcloud.com/v1", api_key=fpt_key), actual_model
        
        return self.chat_client, CHAT_MODEL_NAME

    def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        tools: Optional[List[Dict[str, Any]]] = None,
        response_format: Optional[Dict[str, str]] = None,
        stream: bool = False,
        model: Optional[str] = None
    ) -> Generator[Any, None, None]:
        """Gọi LLM chat completion."""
        client, target_model = self._get_client_and_model(model)

        kwargs = {
            "model": target_model,
            "messages": messages,
            "stream": stream,
            "max_tokens": 2048
        }

        # Only pass extra_body for Ollama/local compatibility
        if "localhost" in str(client.base_url) or "127.0.0.1" in str(client.base_url):
            kwargs["extra_body"] = {
                "chat_template_kwargs": {
                    "enable_thinking": False
                }
            }


        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"
        
        if response_format:
            kwargs["response_format"] = response_format

        try:
            if "timeout" not in kwargs:
                kwargs["timeout"] = 45.0
            response = client.chat.completions.create(**kwargs)

            if stream:
                for chunk in response:
                    yield chunk
            else:
                yield response.choices[0].message
        except Exception as e:
            error_msg = f"Lỗi khi gọi LLM ({target_model}): {str(e)}"
            print(error_msg)
            if stream:
                yield {"error": error_msg}
            else:
                raise Exception(error_msg)
