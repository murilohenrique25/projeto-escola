from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.app.models.document import Document
from backend.app.models.user import User
from backend.app.schemas.document import DocumentoCreate, DocumentoUpdate, validate_status_transition


def list_documents(db: Session, user: User) -> list[Document]:
    """Coordenadora vê documentos da mesma escola; Professor vê apenas os próprios."""
    if user.perfil == "coordenadora":
        return (
            db.query(Document)
            .join(User, Document.autor_id == User.id)
            .filter(User.escola_id == user.escola_id)
            .all()
        )
    # professor
    return db.query(Document).filter(Document.autor_id == user.id).all()


def create_document(db: Session, data: DocumentoCreate, user: User) -> Document:
    """Cria documento com autor_id = user.id e status rascunho."""
    doc = Document(
        titulo=data.titulo,
        conteudo_json=data.conteudo_json,
        autor_id=user.id,
        status="rascunho",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def get_document(db: Session, doc_id, user: User) -> Document:
    """Retorna documento por ID; HTTP 403 se escola diferente."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurso não encontrado")
    autor = db.query(User).filter(User.id == doc.autor_id).first()
    if autor is None or autor.escola_id != user.escola_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado")
    return doc


def update_document(db: Session, doc_id, data: DocumentoUpdate, user: User) -> Document:
    """Atualiza campos; valida transição de status; HTTP 422 para transição inválida; HTTP 403 para cross-escola."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurso não encontrado")
    autor = db.query(User).filter(User.id == doc.autor_id).first()
    if autor is None or autor.escola_id != user.escola_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado")

    if data.status is not None and data.status != doc.status:
        try:
            validate_status_transition(doc.status, data.status, user.perfil)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    if data.titulo is not None:
        doc.titulo = data.titulo
    if data.conteudo_json is not None:
        doc.conteudo_json = data.conteudo_json
    if data.status is not None:
        doc.status = data.status

    db.commit()
    db.refresh(doc)
    return doc


def delete_document(db: Session, doc_id, user: User) -> None:
    """Deleta documento; cascade de comentários é automático pelo FK; HTTP 403 para cross-escola; HTTP 404 se não encontrado."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurso não encontrado")
    autor = db.query(User).filter(User.id == doc.autor_id).first()
    if autor is None or autor.escola_id != user.escola_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado")
    db.delete(doc)
    db.commit()
