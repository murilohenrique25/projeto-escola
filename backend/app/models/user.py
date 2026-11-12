import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Enum as SAEnum, TypeDecorator
from sqlalchemy.orm import relationship

from backend.app.database.base import Base


class UUIDType(TypeDecorator):
    """UUID armazenado como String para compatibilidade com SQLite."""
    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        import uuid as _uuid
        return _uuid.UUID(value)


class Escola(Base):
    __tablename__ = "escolas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String, nullable=False)


class Cidade(Base):
    __tablename__ = "cidades"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String, nullable=False)


class User(Base):
    __tablename__ = "users"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    perfil = Column(SAEnum("professor", "coordenadora", name="perfil_enum"), nullable=False)
    escola_id = Column(Integer, ForeignKey("escolas.id"), nullable=False)
    cidade_id = Column(Integer, ForeignKey("cidades.id"), nullable=False)

    escola = relationship("Escola", foreign_keys=[escola_id])
    cidade = relationship("Cidade", foreign_keys=[cidade_id])
    documents = relationship("Document", back_populates="autor", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="usuario", cascade="all, delete-orphan")
