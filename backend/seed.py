"""Script de seed para criar dados iniciais de teste."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.app.database.session import SessionLocal, engine
from backend.app.database.base import Base
import backend.app.models  # noqa: registra todos os modelos
from backend.app.models.user import Escola, Cidade, User
from backend.app.core.security import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Escola e cidade
escola = db.query(Escola).filter_by(id=1).first()
if not escola:
    escola = Escola(id=1, nome="Escola Teste")
    db.add(escola)

cidade = db.query(Cidade).filter_by(id=1).first()
if not cidade:
    cidade = Cidade(id=1, nome="Cidade Teste")
    db.add(cidade)

db.commit()

# Professor
if not db.query(User).filter_by(email="professor@teste.com").first():
    db.add(User(
        email="professor@teste.com",
        hashed_password=hash_password("senha123"),
        perfil="professor",
        escola_id=1,
        cidade_id=1,
    ))

# Coordenadora
if not db.query(User).filter_by(email="coordenadora@teste.com").first():
    db.add(User(
        email="coordenadora@teste.com",
        hashed_password=hash_password("senha123"),
        perfil="coordenadora",
        escola_id=1,
        cidade_id=1,
    ))

db.commit()
db.close()

print("Seed concluído!")
print("  Professor:    professor@teste.com / senha123")
print("  Coordenadora: coordenadora@teste.com / senha123")
