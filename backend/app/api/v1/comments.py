from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.core.dependencies import get_current_user
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.schemas.comment import ComentarioCreate, ComentarioOut
from backend.app.services.comment_service import create_comment, list_comments

router = APIRouter()


@router.post("/", response_model=ComentarioOut, status_code=status.HTTP_201_CREATED)
def create_comment_endpoint(
    data: ComentarioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_comment(db, data, current_user)


@router.get("/", response_model=list[ComentarioOut])
def list_comments_endpoint(
    documento_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_comments(db, documento_id, current_user)
