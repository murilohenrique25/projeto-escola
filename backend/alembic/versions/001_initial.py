"""initial

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ENUMs
    perfil_enum = postgresql.ENUM("professor", "coordenadora", name="perfil_enum", create_type=False)
    perfil_enum.create(op.get_bind(), checkfirst=True)

    status_enum = postgresql.ENUM("rascunho", "revisao", "finalizado", name="status_enum", create_type=False)
    status_enum.create(op.get_bind(), checkfirst=True)

    # Create table: escolas
    op.create_table(
        "escolas",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create table: cidades
    op.create_table(
ssword", sa.String(), nullable=False),
        sa.Column(
            "perfil",
            sa.Enum("professor", "coordenadora", name="perfil_enum"),
            nullable=False,
        ),
        sa.Column("escola_id", sa.Integer(), nullable=False),
        sa.Column("cidade_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["escola_id"], ["escolas.id"]),
        sa.ForeignKeyConstraint(["cidade_id"], ["cidades.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )

    # Create table: documents
    op.create_table(
        "documents",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("titulo", sa.String(), nullable=False),
        sa.Column(
            "conteudo_json",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("autor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "status",
            sa.Enum("rascunho", "revisao", "finalizado", name="status_enum"),
            server_default=sa.text("'rascunho'"),
            nullable=False,
        ),
        sa.Column(
            "criado_em",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "atualizado_em",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["autor_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create table: comments
    op.create_table(
        "comments",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("documento_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("revisor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("texto_comentario", sa.Text(), nullable=False),
        sa.Column("offset_inicio", sa.Integer(), nullable=False),
        sa.Column("offset_fim", sa.Integer(), nullable=False),
        sa.Column(
            "criado_em",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("offset_inicio >= 0", name="ck_offset_inicio_nonneg"),
        sa.CheckConstraint("offset_fim > 0", name="ck_offset_fim_positive"),
        sa.ForeignKeyConstraint(["documento_id"], ["documents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["revisor_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create table: notifications
    op.create_table(
        "notifications",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("documento_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("comment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "lida",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "criado_em",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["usuario_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["documento_id"], ["documents.id"]),
        sa.ForeignKeyConstraint(["comment_id"], ["comments.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("comments")
    op.drop_table("documents")
    op.drop_table("users")
    op.drop_table("cidades")
    op.drop_table("escolas")

    # Drop ENUMs
    sa.Enum(name="status_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="perfil_enum").drop(op.get_bind(), checkfirst=True)
