from decouple import config as decouple_config
from sqlmodel import Session, create_engine, SQLModel
from sqlalchemy import inspect, text

DATABASE_URL = decouple_config("DATABASE_URL", default="sqlite:///./edutrack.db")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

engine = create_engine(DATABASE_URL, echo=False)

def _run_migrations() -> None:
    """
    Migration utility to ensure the database schema is up-to-date.
    """
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
    """
    Initialize the database by creating all tables and running migrations.
    """
    SQLModel.metadata.create_all(engine)
    _run_migrations()

def get_session():
    """
    Dependency to get a SQLAlchemy session for database operations.
    Yields: A SQLModel session.
    """
    with Session(engine) as session:
        yield session
