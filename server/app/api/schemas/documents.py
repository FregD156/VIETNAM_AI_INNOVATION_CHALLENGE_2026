from pydantic import BaseModel


class AdminUploadRequest(BaseModel):
    filename: str
    content: str
