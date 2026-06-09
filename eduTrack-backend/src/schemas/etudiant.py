from datetime import date, datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field

# --- Base Schema ---
class EtudiantBase(SQLModel):
    nom: str = Field(max_length=50)
    prenom: str = Field(max_length=50)
    date_naissance: Optional[date] = None
    email: Optional[str] = Field(default=None, max_length=120)
    statut: str = Field(default="Actif", max_length=20)
    annee_entree: Optional[int] = None

# --- Create Schema ---
class EtudiantCreate(EtudiantBase):
    pass

# --- Update Schema ---
class EtudiantUpdate(SQLModel):
    nom: Optional[str] = Field(default=None, max_length=50)
    prenom: Optional[str] = Field(default=None, max_length=50)
    date_naissance: Optional[date] = None
    email: Optional[str] = Field(default=None, max_length=120)
    statut: Optional[str] = Field(default=None, max_length=20)
    annee_entree: Optional[int] = None

# --- Read Schema ---
class EtudiantRead(EtudiantBase):
    id: int

# --- Relationship Read Schemas ---
class InscriptionRead(SQLModel):
    id: int
    annee_scolaire: str
    statut_inscription: str

class NoteRead(SQLModel):
    id: int
    valeur: Optional[float]
    date_saisie: datetime

class AbsenceRead(SQLModel):
    id: int
    date_absence: date
    nb_heures: Optional[float]
    justifiee: bool

class RetardRead(SQLModel):
    id: int
    date_retard: datetime
    duree_minutes: Optional[int]
    justifie: bool

class AlerteRead(SQLModel):
    id: int
    date_detection: datetime
    statut: str

class EtudiantReadWithRelationships(EtudiantRead):
    inscriptions: List[InscriptionRead] = []
    notes: List[NoteRead] = []
    absences: List[AbsenceRead] = []
    retards: List[RetardRead] = []
    alertes: List[AlerteRead] = []
