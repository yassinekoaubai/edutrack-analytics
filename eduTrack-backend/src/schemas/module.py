from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

# --- Base Schema ---
class ModuleBase(BaseModel):
    nom: str = Field(max_length=100)
    nombre_horaire: Optional[int] = None
    seuil_validation: float = Field(default=10.0)
    model_config = ConfigDict(from_attributes=True)

# --- Create Schema ---
class ModuleCreate(ModuleBase):
    pass

# --- Update Schema ---
class ModuleUpdate(BaseModel):
    nom: Optional[str] = Field(default=None, max_length=100)
    nombre_horaire: Optional[int] = None
    seuil_validation: Optional[float] = None

# --- Read Schema ---
class ModuleRead(ModuleBase):
    id: int

# --- Relationship Read Schemas ---
class EvaluationRead(BaseModel):
    id: int
    nom_eval: Optional[str]
    date_prevue: Optional[datetime]
    coefficient_eval: float
    semestre: Optional[str]
    model_config = ConfigDict(from_attributes=True)

class UtilisateurRead(BaseModel):
    id: int
    nom: str
    prenom: str
    email: str
    model_config = ConfigDict(from_attributes=True)

class ModuleReadWithRelationships(ModuleRead):
    evaluations: List[EvaluationRead] = []
    profs: List[UtilisateurRead] = []