from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

# --- Base Schema ---
class EtudiantBase(BaseModel):
    nom: str = Field(max_length=50)
    prenom: str = Field(max_length=50)
    date_naissance: Optional[date] = None
    email: Optional[str] = Field(default=None, max_length=120)
    statut: str = Field(default="Actif", max_length=20)
    annee_entree: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

# --- Create Schema ---
class EtudiantCreate(EtudiantBase):
    pass

# --- Update Schema ---
class EtudiantUpdate(BaseModel):
    nom: Optional[str] = Field(default=None, max_length=50)
    prenom: Optional[str] = Field(default=None, max_length=50)
    date_naissance: Optional[date] = None
    email: Optional[str] = Field(default=None, max_length=120)
    statut: Optional[str] = Field(default=None, max_length=20)
    annee_entree: Optional[int] = None

# --- Read Schema ---
class EtudiantRead(EtudiantBase):
    id: int
    notes: Optional[List[dict]] = None
    absences_count: Optional[int] = None
    retards_count: Optional[int] = None
    classement: Optional[int] = None

# --- Relationship Read Schemas ---
class InscriptionRead(BaseModel):
    id: int
    annee_scolaire: str
    statut_inscription: str
    model_config = ConfigDict(from_attributes=True)

class NoteRead(BaseModel):
    id: int
    valeur: Optional[float]
    date_saisie: datetime
    model_config = ConfigDict(from_attributes=True)

class AbsenceRead(BaseModel):
    id: int
    date_absence: date
    nb_heures: Optional[float]
    justifiee: bool
    model_config = ConfigDict(from_attributes=True)

class RetardRead(BaseModel):
    id: int
    date_retard: datetime
    duree_minutes: Optional[int]
    justifie: bool
    model_config = ConfigDict(from_attributes=True)

class AlerteRead(BaseModel):
    id: int
    date_detection: datetime
    statut: str
    model_config = ConfigDict(from_attributes=True)

class EtudiantReadWithRelationships(EtudiantRead):
    inscriptions: List[InscriptionRead] = []
    notes: List[NoteRead] = []
    absences: List[AbsenceRead] = []
    retards: List[RetardRead] = []
    alertes: List[AlerteRead] = []
