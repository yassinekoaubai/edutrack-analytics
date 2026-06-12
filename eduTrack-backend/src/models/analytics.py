from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, Numeric, Text
from datetime import date, datetime
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .student import Etudiant
    from .academic import Module
    from .user import Utilisateur

class Absence(SQLModel, table=True):
    """
    Records student absences for a module.
    """
    __tablename__ = "absences"
    id: Optional[int] = Field(default=None, primary_key=True)
    id_etudiant: int = Field(foreign_key="etudiants.id")
    id_module: int = Field(foreign_key="modules.id")
    date_absence: date
    nb_heures: Optional[float] = Field(default=None, sa_column=Column(Numeric(3,1)))
    justifiee: bool = False
    motif: Optional[str] = Field(default=None, sa_column=Column(Text))

    etudiant: "Etudiant" = Relationship(back_populates="absences")
    module: "Module" = Relationship(back_populates="absences")

class Retard(SQLModel, table=True):
    """
    Records student tardiness for a module.
    """
    __tablename__ = "retards"
    id: Optional[int] = Field(default=None, primary_key=True)
    id_etudiant: int = Field(foreign_key="etudiants.id")
    id_module: int = Field(foreign_key="modules.id")
    date_retard: datetime
    duree_minutes: Optional[int] = None
    justifie: bool = False

    etudiant: "Etudiant" = Relationship(back_populates="retards")
    module: "Module" = Relationship(back_populates="retards")

class ParametreRisque(SQLModel, table=True):
    """
    Configuration parameters for detecting academic risk.
    """
    __tablename__ = "parametres_risque"
    id: Optional[int] = Field(default=None, primary_key=True)
    type_risque: Optional[str] = Field(default=None, max_length=50)
    seuil: Optional[float] = Field(default=None, sa_column=Column(Numeric(5,2)))
    operateur: Optional[str] = Field(default=None, max_length=3)
    annee_scolaire: Optional[str] = Field(default=None, max_length=9)

    alertes: list["Alerte"] = Relationship(back_populates="parametre")

class Alerte(SQLModel, table=True):
    """
    Represents an automatically detected academic alert.
    """
    __tablename__ = "alertes"
    id: Optional[int] = Field(default=None, primary_key=True)
    id_etudiant: int = Field(foreign_key="etudiants.id")
    id_parametre: int = Field(foreign_key="parametres_risque.id")
    date_detection: datetime = Field(default_factory=datetime.utcnow)
    valeur_mesuree: Optional[float] = Field(default=None, sa_column=Column(Numeric(5,2)))
    message: Optional[str] = Field(default=None, sa_column=Column(Text))
    statut: str = Field(default="Nouvelle", max_length=20)
    id_traite_par: Optional[int] = Field(default=None, foreign_key="utilisateurs.id")

    etudiant: "Etudiant" = Relationship(back_populates="alertes")
    parametre: ParametreRisque = Relationship(back_populates="alertes")
    traite_par: Optional["Utilisateur"] = Relationship(back_populates="alertes_traitees")
