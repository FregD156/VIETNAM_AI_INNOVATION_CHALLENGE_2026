from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    stream: bool = True
    model: Optional[str] = None
    as_of: Optional[date] = None
