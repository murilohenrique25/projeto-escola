import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, Enum as SAEnum, DateTime, Text, TypeDecorator
from sqlalchemy.orm import relationship

from backend.app.database.base import Base
from backend.app.models.user import UUIDType


class JSONType(TypeDecorator):
    """JSON armazenado como Text para compatibilidade com SQLite."""
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        import json
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        import json
        return json.loads(value)


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    titulo = Column(String, nullable=False)
    conteudo_json = Column(JSONType, nullable=False, default=dict)
    autor_id = Column(UUIDType, ForeignKey("users.id"), nullable=False)
    status = Column(
        SAEnum("rascunho", "revisao", "finalizado", name="status_enum"),
        nullable=False,
        default="rascunho",
    )
    criado_em = Column(DateTime, nullable=False, default=datetime.utcnow)
    atualizado_em = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    autor = relationship("User", back_populates="documents")
    comments = relationship("Comment", back_populates="documento", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="documento", cascade="all, delete-orphan")
