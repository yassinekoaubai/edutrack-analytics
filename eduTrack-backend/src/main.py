import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import auth, imports, dashboard, students, alerts, modules, classes
from utils.seed import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler for the FastAPI application.
    Initializes the database on startup.
    """
    init_db()
    yield

app = FastAPI(
    title="EduTrack Analytics API",
    description="Plateforme d'Analyse de Performance des Étudiants (Maroc Ynov Campus)",
    version="1.1.0",
    lifespan=lifespan
)

@app.on_event("startup")
def on_startup():
    """
    Startup event to seed the database with initial data.
    """
    seed_database()

# CORS Configuration
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

# Registering Routers
app.include_router(auth.router)
app.include_router(imports.router)
app.include_router(dashboard.router)
app.include_router(students.router)
app.include_router(alerts.router)
app.include_router(modules.router)
app.include_router(classes.router)

@app.get("/", tags=["Root"], status_code=status.HTTP_200_OK)
def root_endpoint():
    """
    Root endpoint providing a welcome message and API metadata.
    Returns: Welcome message and version info.
    """
    return {
        "message": "Welcome to EduTrack Analytics API.",
        "docs": "/docs",
        "version": "1.1.0"
    }
