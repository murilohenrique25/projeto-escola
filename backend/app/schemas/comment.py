from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ComentarioCreate(BaseModel):
    documento_id: UUID
    texto_comentario: str
    offset_inicio: int = Field(ge=0)
    offset_fim: int = Field(gt=0)

    @model_validator(mode="after")
    def offset_fim_maior_que_inicio(self) -> "ComentarioCreate":
        if self.offset_fim <= self.offset_inicio:
            raise ValueError("offset_fim deve ser maior que offset_inicio")
        return self


class ComentarioOut(BaseModel):
    id: UUID
    documento_id: UUID
    revisor_id: UUID
    texto_comentario: str
    offset_inicio: int
    offset_fim: int
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)
