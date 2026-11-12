from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.schemas.auth import LoginRequest, TokenResponse
from backend.app.services.auth_service import authenticate_user
from backend.app.core.security import create_access_token

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, request.email, request.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )
    token = create_access_token({
        "sub": str(user.id),
        "perfil": user.perfil,
        "escola_id": user.escola_id,
    })
    return TokenResponse(access_token=token)
