import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.orm import relationship

from backend.app.database.base import Base
from backend.app.models.user import UUIDType


class Comment(Base):
    __tablename__ = "comments"

    __table_args__ = (
        CheckConstraint("offset_inicio >= 0", name="ck_offset_inicio_nonneg"),
        CheckConstraint("offset_fim > 0", name="ck_offset_fim_positive"),
    )

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    documento_id = Column(UUIDType, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    revisor_id = Column(UUIDType, ForeignKey("users.id"), nullable=False)
    texto_comentario = Column(Text, nullable=False)
    offset_inicio = Column(Integer, nullable=False)
    offset_fim = Column(Integer, nullable=False)
    criado_em = Column(DateTime, nullable=False, default=datetime.utcnow)

    documento = relationship("Document", back_populates="comments")
    revisor = relationship("User", foreign_keys=[revisor_id])
    notifications = relationship("Notification", back_populates="comment", cascade="all, delete-orphan")
