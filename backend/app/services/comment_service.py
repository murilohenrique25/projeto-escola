from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.app.models.comment import Comment
from backend.app.models.document import Document
from backend.app.models.user import User
from backend.app.schemas.comment import ComentarioCreate


def create_comment(db: Session, data: ComentarioCreate, user: User) -> Comment:
    doc = db.query(Document).filter(Document.id == data.documento_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    if doc.status != "revisao":
        raise HTTPException(status_code=422, detail="Documento não está em revisão")

    comment = Comment(
        documento_id=data.documento_id,
        revisor_id=user.id,
        texto_comentario=data.texto_comentario,
        offset_inicio=data.offset_inicio,
        offset_fim=data.offset_fim,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    from backend.app.services.notification_service import create_notification
    create_notification(
        db,
        professor_id=doc.autor_id,
        documento_id=doc.id,
        comment_id=comment.id,
    )

    return comment


def list_comments(db: Session, documento_id: UUID, user: User) -> list[Comment]:
    return db.query(Comment).filter(Comment.documento_id == documento_id).all()
