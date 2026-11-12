import asyncio
import json
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from backend.app.core.dependencies import get_current_user
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.services.notification_service import (
    add_sse_connection,
    list_notifications,
    mark_as_read,
    remove_sse_connection,
)

router = APIRouter()


class NotificationOut(BaseModel):
    id: UUID
    usuario_id: UUID
    documento_id: UUID | None
    comment_id: UUID | None
    lida: bool
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)


@router.get("/stream")
async def stream_notifications(
    current_user: User = Depends(get_current_user),
):
    """Retorna um StreamingResponse SSE com eventos de notificação em tempo real."""
    user_id = str(current_user.id)
    queue = add_sse_connection(user_id)

    async def event_generator():
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    # Heartbeat para manter a conexão viva
                    yield "data: {}\n\n"
        finally:
            remove_sse_connection(user_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/")
def list_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista notificações do usuário autenticado com contagem de não lidas."""
    notifications, unread_count = list_notifications(db, current_user.id)
    return {
        "notifications": [NotificationOut.model_validate(n) for n in notifications],
        "unread_count": unread_count,
    }


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def read_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Marca uma notificação como lida e retorna a notificação atualizada."""
    notification = mark_as_read(db, notification_id, current_user.id)
    return NotificationOut.model_validate(notification)
