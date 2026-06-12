from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ModuleListItem(BaseModel):
    """
    Schema for a module item in a list.
    """
    id: int
    nom: str
    professor: Optional[str] = None
    coefficient: float = 1.0
    model_config = ConfigDict(from_attributes=True)

class EvaluationListItem(BaseModel):
    """
    Schema for an evaluation item in a list.
    """
    id: int
    id_module: int
    nom_eval: Optional[str] = None
    date_prevue: Optional[date] = None
    coefficient_eval: float = 1.0
    model_config = ConfigDict(from_attributes=True)

class NoteListItem(BaseModel):
    """
    Schema for a grade/note item in a list.
    """
    id: int
    id_etudiant: int
    id_evaluation: int
    id_module: int
    valeur: Optional[float] = None
    coefficient_eval: float = 1.0
    date_saisie: datetime
    model_config = ConfigDict(from_attributes=True)
