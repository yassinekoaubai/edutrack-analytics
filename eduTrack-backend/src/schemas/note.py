from typing import Optional, Any, List
from sqlmodel import SQLModel, Field
from datetime import datetime
from pydantic import field_validator

class NoteImportRow(SQLModel):
    id: Optional[Any] = None
    id_etudiant: Optional[Any] = None
    numero_etudiant: Optional[Any] = None
    id_evaluation: Optional[Any] = None
    nom_evaluation: Optional[Any] = None
    valeur: Optional[Any] = None
    commentaire: Optional[Any] = None
    date_saisie: Optional[Any] = None

class NoteCreate(SQLModel):
    id_etudiant: int = Field(foreign_key="etudiants.id")
    id_evaluation: int = Field(foreign_key="evaluations.id")
    valeur: float = Field(ge=0.0, le=20.0) # Notes sur 20
    commentaire: Optional[str] = Field(default=None, max_length=500)
    date_saisie: Optional[datetime] = Field(default=None)

    @field_validator('valeur')
    @classmethod
    def check_valeur(cls, v: float) -> float:
        if v < 0 or v > 20:
            raise ValueError('La note doit être entre 0 et 20')
        return round(v, 2)
 
class NoteUpdate(SQLModel):
    valeur: Optional[float] = Field(default=None, ge=0.0, le=20.0)
    commentaire: Optional[str] = Field(default=None, max_length=500)

class NoteRead(NoteCreate):
    id: int
    date_saisie: datetime

# Relationship Read Schemas (Simple versions to avoid circular imports)
class EtudiantSimpleRead(SQLModel):
    id: int
    nom: str
    prenom: str
    email: Optional[str]

class EvaluationSimpleRead(SQLModel):
    id: int
    nom_eval: Optional[str]
    coefficient_eval: float

class NoteReadWithRelationships(NoteRead):
    etudiant: Optional[EtudiantSimpleRead] = None
    evaluation: Optional[EvaluationSimpleRead] = None
