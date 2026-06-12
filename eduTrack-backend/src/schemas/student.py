from datetime import date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class EtudiantBase(BaseModel):
    """
    Base student schema with common fields.
    """
    nom: str = Field(..., max_length=50)
    prenom: str = Field(..., max_length=50)
    date_naissance: Optional[date] = None
    email: Optional[str] = Field(None, max_length=120)
    statut: str = Field("Actif", max_length=20)
    annee_entree: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class EtudiantListItem(EtudiantBase):
    """
    Schema for a student item in a list.
    """
    id: int
    classe: Optional[str] = None

class EtudiantRead(EtudiantBase):
    """
    Detailed student schema for read operations.
    """
    id: int
    notes: Optional[List[Dict[str, Any]]] = None
    absences_count: Optional[int] = None
    retards_count: Optional[int] = None
    classement: Optional[int] = None
    risk_score: Optional[float] = None

class ClasseListItem(BaseModel):
    """
    Schema for a class item in a list.
    """
    id: int
    nom: str
    niveau: Optional[str] = None
    annee_scolaire: Optional[str] = None
    filiere_nom: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
