from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from sqlmodel import Session
from db.session import init_db, get_session
from api import imports

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db() # replace with Alembic in prod
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(imports.router)

@app.get("/")
def read_root():
    return {"status": "ok"}

