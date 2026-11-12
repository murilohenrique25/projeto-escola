from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    perfil: Literal["professor", "coordenadora"]
    escola_id: int
    cidade_id: int


class UserOut(BaseModel):
    id: UUID
    email: str
    perfil: str
    escola_id: int

    model_config = {"from_attributes": True}
