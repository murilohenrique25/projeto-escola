from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.core.dependencies import get_current_user
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.schemas.document import DocumentoCreate, DocumentoOut, DocumentoUpdate
from backend.app.services import document_service

router = APIRouter()


@router.get("/", response_model=list[DocumentoOut])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return document_service.list_documents(db, current_user)


@router.post("/", response_model=DocumentoOut, status_code=status.HTTP_201_CREATED)
def create_document(
    data: DocumentoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return document_service.create_document(db, data, current_user)


@router.get("/{doc_id}", response_model=DocumentoOut)
def get_document(
    doc_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return document_service.get_document(db, doc_id, current_user)


@router.put("/{doc_id}", response_model=DocumentoOut)
def update_document(
    doc_id: UUID,
    data: DocumentoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return document_service.update_document(db, doc_id, data, current_user)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    doc_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document_service.delete_document(db, doc_id, current_user)
