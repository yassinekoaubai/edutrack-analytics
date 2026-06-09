from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field

# --- Base Schema ---
class ModuleBase(SQLModel):
    nom: str = Field(max_length=100)
    nombre_horaire: Optional[int] = None
    seuil_validation: float = Field(default=10.0)

# --- Create Schema ---
class ModuleCreate(ModuleBase):
    pass

# --- Update Schema ---
class ModuleUpdate(SQLModel):
    nom: Optional[str] = Field(default=None, max_length=100)
    nombre_horaire: Optional[int] = None
    seuil_validation: Optional[float] = None

# --- Read Schema ---
class ModuleRead(ModuleBase):
    id: int

# --- Relationship Read Schemas ---
class EvaluationRead(SQLModel):
    id: int
    nom_eval: Optional[str]
    date_prevue: Optional[datetime]
    coefficient_eval: float
    semestre: Optional[str]

class UtilisateurRead(SQLModel):
    id: int
    nom: str
    prenom: str
    email: str

class ModuleReadWithRelationships(ModuleRead):
    evaluations: List[EvaluationRead] = []
    profs: List[UtilisateurRead] = []