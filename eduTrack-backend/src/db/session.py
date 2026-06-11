from sqlalchemy import inspect, text
from sqlmodel import SQLModel, Session, create_engine
from .config import DATABASE_URL
from . import models

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

engine = create_engine(DATABASE_URL, echo=False) # set True only for debug

def _ensure_utilisateur_columns() -> None:
    inspector = inspect(engine)
    if "utilisateurs" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("utilisateurs")}

    with engine.begin() as connection:
        if "password_hash" not in columns and "mot_de_passe" in columns:
            connection.execute(text("ALTER TABLE utilisateurs RENAME COLUMN mot_de_passe TO password_hash"))

        if "role" not in columns:
            connection.execute(text("ALTER TABLE utilisateurs ADD COLUMN role VARCHAR(50) DEFAULT 'PROF'"))


def init_db():
    print("Initializing database...")
    SQLModel.metadata.create_all(engine)
    _ensure_utilisateur_columns()

def get_session():
    with Session(engine) as session:
        yield session