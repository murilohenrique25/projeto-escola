from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.schemas.user import UserCreate, UserOut
from backend.app.core.security import hash_password

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="E-mail já cadastrado",
        )

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        perfil=data.perfil,
        escola_id=data.escola_id,
        cidade_id=data.cidade_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
