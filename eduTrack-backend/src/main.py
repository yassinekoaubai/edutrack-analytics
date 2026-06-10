from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from sqlmodel import Session
from db.session import init_db, get_session
from api import imports, dashboards, students, alerts

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="EduTrack Analytics API",
    description="Plateforme d'Analyse de Performance des Étudiants (Maroc Ynov Campus)",
    version="1.0.0"
)


# Registering endpoints cleanly
app.include_router(imports.router, prefix="/import", tags=["Imports Data Management"])
app.include_router(dashboards.router, prefix="/dashboard", tags=["Dashboard KPIs"])
app.include_router(students.router, prefix="/students", tags=["Students Profiles"])
app.include_router(alerts.router, prefix="/alerts", tags=["Pedagogical Alerts"])

@app.get("/")
def root_redirect():
    return {"message": "Welcome to EduTrack Analytics API. Go to /docs for Swagger UI UI."}

