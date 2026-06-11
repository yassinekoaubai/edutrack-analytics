from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class ModuleListItem(BaseModel):
    id: int
    nom: str
    professor: Optional[str] = None
    coefficient: float = 1.0
    model_config = ConfigDict(from_attributes=True)


class EvaluationListItem(BaseModel):
    id: int
    id_module: int
    nom_eval: Optional[str] = None
    date_prevue: Optional[date] = None
    coefficient_eval: float = 1.0
    model_config = ConfigDict(from_attributes=True)


class NoteListItem(BaseModel):
    id: int
    id_etudiant: int
    id_evaluation: int
    id_module: int
    valeur: Optional[float] = None
    coefficient_eval: float = 1.0
    date_saisie: datetime
    model_config = ConfigDict(from_attributes=True)


class AbsenceListItem(BaseModel):
    id: int
    id_etudiant: int
    id_module: int
    date_absence: date
    nb_heures: Optional[float] = None
    justifiee: bool = False
    motif: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class RetardListItem(BaseModel):
    id: int
    id_etudiant: int
    id_module: int
    date_retard: datetime
    duree_minutes: Optional[int] = None
    justifie: bool = False
    model_config = ConfigDict(from_attributes=True)


class ImportLogListItem(BaseModel):
    id: int
    nom_fichier: Optional[str] = None
    date_import: datetime
    type_donnees: Optional[str] = None
    nb_lignes_ok: int = 0
    nb_lignes_rejet: int = 0
    statut: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
