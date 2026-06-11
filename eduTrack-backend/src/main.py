from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.session import init_db
from api import imports, dashboards, students, alerts, academic, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="EduTrack Analytics API",
    description="Plateforme d'Analyse de Performance des Étudiants (Maroc Ynov Campus)",
    version="1.0.0"
)

_cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in _cors_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registering endpoints cleanly
app.include_router(auth.router)
app.include_router(imports.router)
app.include_router(dashboards.router, prefix="/dashboard", tags=["Dashboard KPIs"])
app.include_router(students.router, prefix="/students", tags=["Students Profiles"])
app.include_router(alerts.router, prefix="/alerts", tags=["Pedagogical Alerts"])
app.include_router(academic.router, tags=["Academic Data"])

@app.get("/")
def root_redirect():
    return {"message": "Welcome to EduTrack Analytics API. Go to /docs for Swagger UI UI."}

