# schemas/imports.py - garde seulement ImportRow + ImportResult
import datetime
from sqlmodel import SQLModel, Field
from typing import List, Optional, Any
from pydantic import field_validator

class EtudiantImportRow(SQLModel):
    nom: Optional[Any] = None
    prenom: Optional[Any] = None
    email: Optional[Any] = None
    date_naissance: Optional[Any] = None
    statut: Optional[Any] = None
    annee_entree: Optional[Any] = None

    @field_validator('*', mode='before')
    @classmethod
    def empty_to_none(cls, v):
        if v == '' or v == 'N/A' or v == 'nan':
            return None
        return v

class ModuleImportRow(SQLModel):
    id: Optional[int] = None
    nom: Optional[str] = None
    nombre_horaire: Optional[Any] = None
    seuil_validation: Optional[Any] = None

    @field_validator('*', mode='before')
    @classmethod
    def empty_to_none(cls, v):
        if v == '' or v == 'N/A' or v == 'nan':
            return None
        return v
    
class EvaluationImportRow(SQLModel):
    id: Optional[Any] = None
    id_module: Optional[Any] = None
    module: Optional[Any] = None # nom du module si id_module absent
    nom_eval: Optional[Any] = None
    date_prevue: Optional[Any] = None
    coefficient_eval: Optional[Any] = None
    semestre: Optional[Any] = None

    @field_validator('*', mode='before')
    @classmethod
    def empty_to_none(cls, v):
        if v == '' or v == 'N/A' or v == 'nan':
            return None
        return v

class ImportResult(SQLModel):
    nb_lignes_ok: int
    nb_lignes_rejet: int
    erreurs: List[str] = []
    message: str = "Import terminé"

class NoteImportRow(SQLModel):
    id: Optional[Any] = None
    id_etudiant: Optional[Any] = None
    id_evaluation: Optional[Any] = None
    valeur: Optional[Any] = None
    date_saisie: Optional[Any] = None

class NoteCreate(SQLModel):
    id_etudiant: int = Field(foreign_key="etudiants.id")
    id_evaluation: int = Field(foreign_key="evaluations.id")
    valeur: Optional[float] = Field(default=None, ge=0.0, le=20.0) # None = absent
    commentaire: Optional[str] = Field(default=None, max_length=500)
    date_saisie: Optional[datetime.datetime] = Field(default=None)

    @field_validator('valeur')
    @classmethod
    def check_valeur(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return None
        if v < 0 or v > 20:
            raise ValueError('La note doit être entre 0 et 20')
        return round(v, 2)