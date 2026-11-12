import uuid
from datetime import datetime
from sqlalchemy import Column, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from backend.app.database.base import Base
from backend.app.models.user import UUIDType


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    usuario_id = Column(UUIDType, ForeignKey("users.id"), nullable=True)
    documento_id = Column(UUIDType, ForeignKey("documents.id"), nullable=True)
    comment_id = Column(UUIDType, ForeignKey("comments.id"), nullable=True)
    lida = Column(Boolean, nullable=False, default=False)
    criado_em = Column(DateTime, nullable=False, default=datetime.utcnow)

    usuario = relationship("User", back_populates="notifications")
    documento = relationship("Document", back_populates="notifications")
    comment = relationship("Comment", back_populates="notifications")
