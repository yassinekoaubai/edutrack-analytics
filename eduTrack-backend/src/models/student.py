from sqlmodel import SQLModel, Field, Relationship
from datetime import date
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from .academic import Note
    from .analytics import Absence, Retard, Alerte

class Filiere(SQLModel, table=True):
    """
    Represents an academic department or field of study.
    """
    __tablename__ = "filieres"
    id: Optional[int] = Field(default=None, primary_key=True)
    nom_filiere: str = Field(max_length=100)
    departement: Optional[str] = Field(default=None, max_length=100)

    classes: List["Classe"] = Relationship(back_populates="filiere")
    programmes: List["Programme"] = Relationship(back_populates="filiere")

class Classe(SQLModel, table=True):
    """
    Represents a specific class or cohort of students.
    """
    __tablename__ = "classes"
    id: Optional[int] = Field(default=None, primary_key=True)
    nom: str = Field(max_length=50)
    niveau: Optional[str] = Field(default=None, max_length=20)
    annee_scolaire: Optional[str] = Field(default=None, max_length=9)
    id_filiere: Optional[int] = Field(default=None, foreign_key="filieres.id")

    filiere: Optional[Filiere] = Relationship(back_populates="classes")
    inscriptions: List["Inscription"] = Relationship(back_populates="classe")

class Etudiant(SQLModel, table=True):
    """
    Represents a student and their academic records.
    """
    __tablename__ = "etudiants"
    id: Optional[int] = Field(default=None, primary_key=True)
    nom: str = Field(max_length=50)
    prenom: str = Field(max_length=50)
    date_naissance: Optional[date] = None
    email: Optional[str] = Field(default=None, max_length=120, unique=True)
    statut: str = Field(default="Actif", max_length=20)
    annee_entree: Optional[int] = None

    inscriptions: List["Inscription"] = Relationship(back_populates="etudiant")
    notes: List["Note"] = Relationship(back_populates="etudiant")
    absences: List["Absence"] = Relationship(back_populates="etudiant")
    retards: List["Retard"] = Relationship(back_populates="etudiant")
    alertes: List["Alerte"] = Relationship(back_populates="etudiant")

class Inscription(SQLModel, table=True):
    """
    Represents a student's enrollment in a specific class for an academic year.
    """
    __tablename__ = "inscriptions"
    id: Optional[int] = Field(default=None, primary_key=True)
    id_etudiant: int = Field(foreign_key="etudiants.id")
    id_classe: int = Field(foreign_key="classes.id")
    annee_scolaire: str = Field(max_length=9)
    statut_inscription: str = Field(default="Inscrit", max_length=20)

    etudiant: Etudiant = Relationship(back_populates="inscriptions")
    classe: Classe = Relationship(back_populates="inscriptions")

# Need to import Programme here to avoid circularity in Relationship
from .academic import Programme
