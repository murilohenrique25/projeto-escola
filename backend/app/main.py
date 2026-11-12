from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.v1 import auth, comments, documents, notifications, users
from backend.app.database.base import Base
from backend.app.database.session import engine
import backend.app.models  # noqa: F401 — registra todos os modelos no Base.metadata

app = FastAPI(title="Sistema Pedagógico", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])
app.include_router(comments.router, prefix="/api/v1/comments", tags=["comments"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    return {"status": "ok"}
