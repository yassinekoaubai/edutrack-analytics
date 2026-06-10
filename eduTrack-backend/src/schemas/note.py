from typing import Optional, Any, List
from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime

class NoteImportRow(BaseModel):
    id: Optional[Any] = None
    id_etudiant: Optional[Any] = None
    numero_etudiant: Optional[Any] = None
    id_evaluation: Optional[Any] = None
    nom_evaluation: Optional[Any] = None
    valeur: Optional[Any] = None
    date_saisie: Optional[Any] = None

class NoteCreate(BaseModel):
    id_etudiant: int
    id_evaluation: int
    valeur: Optional[float] = Field(default=None, ge=0.0, le=20.0) # None = absent
    date_saisie: Optional[datetime] = Field(default=None)

    @field_validator('valeur')
    @classmethod
    def check_valeur(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return None
        if v < 0 or v > 20:
            raise ValueError('La note doit être entre 0 et 20')
        return round(v, 2)
 
class NoteUpdate(BaseModel):
    valeur: Optional[float] = Field(default=None, ge=0.0, le=20.0)
    commentaire: Optional[str] = Field(default=None, max_length=500)

class NoteRead(NoteCreate):
    id: int
    date_saisie: datetime
    model_config = ConfigDict(from_attributes=True)

# Relationship Read Schemas (Simple versions to avoid circular imports)
class EtudiantSimpleRead(BaseModel):
    id: int
    nom: str
    prenom: str
    email: Optional[str]
    model_config = ConfigDict(from_attributes=True)

class EvaluationSimpleRead(BaseModel):
    id: int
    nom_eval: Optional[str]
    coefficient_eval: float
    model_config = ConfigDict(from_attributes=True)

class NoteReadWithRelationships(NoteRead):
    etudiant: Optional[EtudiantSimpleRead] = None
    evaluation: Optional[EvaluationSimpleRead] = None
