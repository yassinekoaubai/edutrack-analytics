from sqlmodel import SQLModel, Session, create_engine
from .config import DATABASE_URL
from . import models  

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

engine = create_engine(DATABASE_URL, echo=False) # set True only for debug

def init_db():
    print("Initializing database...")
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session