from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, model_validator


# Status transition rules:
# rascunho → revisao: only professor
# revisao → finalizado: only coordenadora
# revisao → rascunho: only coordenadora
_ALLOWED_TRANSITIONS: dict[tuple[str, str], str] = {
    ("rascunho", "revisao"): "professor",
    ("revisao", "finalizado"): "coordenadora",
    ("revisao", "rascunho"): "coordenadora",
}


def validate_status_transition(current_status: str, new_status: str, user_perfil: str) -> None:
    """Validate that a status transition is allowed for the given user profile.

    Raises ValueError if the transition is invalid.
    """
    if current_status == new_status:
        return

    allowed_perfil = _ALLOWED_TRANSITIONS.get((current_status, new_status))
    if allowed_perfil is None:
        raise ValueError(
            f"Transição de status '{current_status}' → '{new_status}' não é permitida."
        )
    if user_perfil != allowed_perfil:
        raise ValueError(
            f"Transição de status '{current_status}' → '{new_status}' "
            f"só é permitida para '{allowed_perfil}'."
        )


class DocumentoCreate(BaseModel):
    titulo: str
    conteudo_json: dict = {}


class DocumentoUpdate(BaseModel):
    titulo: str | None = None
    conteudo_json: dict | None = None
    status: Literal["rascunho", "revisao", "finalizado"] | None = None


class DocumentoOut(BaseModel):
    id: UUID
    titulo: str
    conteudo_json: dict
    autor_id: UUID
    status: str
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)
