# schemas/imports.py - garde seulement ImportRow + ImportResult
import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional, Any

class EtudiantImportRow(BaseModel):
    nom: Any # Required - pas Optional
    prenom: Any # Required - pas Optional
    email: Optional[Any] = None
    date_naissance: Optional[Any] = None
    statut: Optional[Any] = None
    annee_entree: Optional[Any] = None

class ModuleImportRow(BaseModel):
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

class EvaluationImportRow(BaseModel):
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

class ImportResult(BaseModel):
    nb_lignes_ok: int
    nb_lignes_rejet: int
    erreurs: List[str] = []
    message: str = "Import terminé"

class NoteImportRow(BaseModel):
    id: Optional[Any] = None
    id_etudiant: Optional[Any] = None
    numero_etudiant: Optional[Any] = None
    id_evaluation: Optional[Any] = None
    nom_evaluation: Optional[Any] = None
    valeur: Optional[Any] = None
    date_saisie: Optional[Any] = None

    @field_validator('*', mode='before')
    @classmethod
    def empty_to_none(cls, v):
        if v == '' or v == 'N/A' or v == 'nan':
            return None
        return v

class AbsenceImportRow(BaseModel):
    id: Optional[Any] = None
    id_etudiant: Optional[Any] = None
    numero_etudiant: Optional[Any] = None 
    id_module: Optional[Any] = None
    code_module: Optional[Any] = None
    date_absence: Optional[Any] = None
    nb_heures: Optional[Any] = None
    justifiee: Optional[Any] = None
    motif: Optional[Any] = None

    @field_validator('*', mode='before')
    @classmethod
    def empty_to_none(cls, v):
        if v == '' or v == 'N/A' or v == 'nan':
            return None
        return v

class AbsenceCreate(BaseModel):
    id_etudiant: int
    id_module: int
    date_absence: datetime.date
    nb_heures: Optional[float] = Field(default=None, ge=0.0, le=24.0)
    justifiee: bool = Field(default=False)
    motif: Optional[str] = Field(default=None, max_length=1000)

    @field_validator('nb_heures')
    @classmethod
    def check_nb_heures(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return None
        if v < 0:
            raise ValueError('Le nombre d\'heures ne peut pas être négatif')
        return round(v, 1)
    
class RetardImportRow(BaseModel):
    id: Optional[Any] = None
    id_etudiant: Optional[Any] = None
    numero_etudiant: Optional[Any] = None
    email_etudiant: Optional[Any] = None
    id_module: Optional[Any] = None
    code_module: Optional[Any] = None
    nom_module: Optional[Any] = None
    date_retard: Optional[Any] = None
    duree_minutes: Optional[Any] = None
    justifie: Optional[Any] = None

    @field_validator('*', mode='before')
    @classmethod
    def empty_to_none(cls, v):
        if v == '' or v == 'N/A' or v == 'nan':
            return None
        return v