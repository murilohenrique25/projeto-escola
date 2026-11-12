import asyncio
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.app.models.notification import Notification

# Global SSE connections: professor_id (str) -> asyncio.Queue
_sse_connections: dict[str, asyncio.Queue] = {}


def add_sse_connection(professor_id: str) -> asyncio.Queue:
    """Cria e registra uma Queue SSE para o professor."""
    queue: asyncio.Queue = asyncio.Queue()
    _sse_connections[professor_id] = queue
    return queue


def remove_sse_connection(professor_id: str) -> None:
    """Remove a Queue SSE do dicionário."""
    _sse_connections.pop(professor_id, None)


def create_notification(
    db: Session,
    professor_id: UUID,
    documento_id: UUID,
    comment_id: UUID,
) -> Notification:
    """Cria registro Notification no banco e envia evento SSE se houver conexão ativa."""
    notification = Notification(
        usuario_id=professor_id,
        documento_id=documento_id,
        comment_id=comment_id,
        lida=False,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    # Envia evento SSE se o professor tiver conexão ativa
    key = str(professor_id)
    if key in _sse_connections:
        queue = _sse_connections[key]
        try:
            queue.put_nowait({
                "type": "new_comment",
                "notification_id": str(notification.id),
            })
        except asyncio.QueueFull:
            pass

    return notification


def list_notifications(
    db: Session,
    user_id: UUID,
) -> tuple[list[Notification], int]:
    """Retorna (lista de notificações, contagem de não lidas) para o usuário."""
    notifications = (
        db.query(Notification)
        .filter(Notification.usuario_id == user_id)
        .order_by(Notification.criado_em.desc())
        .all()
    )
    unread_count = sum(1 for n in notifications if not n.lida)
    return notifications, unread_count


def mark_as_read(
    db: Session,
    notification_id: UUID,
    user_id: UUID,
) -> Notification:
    """Marca notificação como lida. HTTP 404 se não encontrada; HTTP 403 se não pertence ao usuário."""
    notification = db.query(Notification).filter(Notification.id == notification_id).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")

    if notification.usuario_id != user_id:
        raise HTTPException(status_code=403, detail="Acesso negado")

    notification.lida = True
    db.commit()
    db.refresh(notification)
    return notification
