from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, UniqueConstraint, Numeric
from datetime import date, datetime
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from .student import Etudiant, Filiere
    from .user import UtilisateurModule
    from .analytics import Absence, Retard

class Module(SQLModel, table=True):
    """
    Represents a subject or course module.
    """
    __tablename__ = "modules"
    id: Optional[int] = Field(default=None, primary_key=True)
    nom: str = Field(max_length=100)
    nombre_horaire: Optional[int] = None
    seuil_validation: float = Field(default=10.0, sa_column=Column(Numeric(4,2)))

    programmes: List["Programme"] = Relationship(back_populates="module")
    evaluations: List["Evaluation"] = Relationship(back_populates="module")
    absences: List["Absence"] = Relationship(back_populates="module")
    retards: List["Retard"] = Relationship(back_populates="module")
    profs: List["UtilisateurModule"] = Relationship(back_populates="module")

class Programme(SQLModel, table=True):
    """
    Link between a filiere and a module defining the academic program.
    """
    __tablename__ = "programmes"
    id_filiere: int = Field(foreign_key="filieres.id", primary_key=True)
    id_module: int = Field(foreign_key="modules.id", primary_key=True)
    semestre: Optional[str] = Field(default=None, max_length=10)
    coefficient_filiere: float = Field(default=1.0, sa_column=Column(Numeric(3,1)))

    filiere: "Filiere" = Relationship(back_populates="programmes")
    module: Module = Relationship(back_populates="programmes")

class Evaluation(SQLModel, table=True):
    """
    Represents an assessment or exam within a module.
    """
    __tablename__ = "evaluations"
    id: Optional[int] = Field(default=None, primary_key=True)
    id_module: int = Field(foreign_key="modules.id")
    nom_eval: Optional[str] = Field(default=None, max_length=100)
    date_prevue: Optional[date] = None
    coefficient_eval: float = Field(default=1.0, sa_column=Column(Numeric(3,1)))
    semestre: Optional[str] = Field(default=None, max_length=10)

    module: Module = Relationship(back_populates="evaluations")
    notes: List["Note"] = Relationship(back_populates="evaluation")

class Note(SQLModel, table=True):
    """
    Represents a student's grade for a specific evaluation.
    """
    __tablename__ = "notes"
    id: Optional[int] = Field(default=None, primary_key=True)
    id_etudiant: int = Field(foreign_key="etudiants.id", nullable=False)
    id_evaluation: int = Field(foreign_key="evaluations.id", nullable=False)
    valeur: Optional[float] = Field(default=None, nullable=True)
    date_saisie: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    etudiant: "Etudiant" = Relationship(back_populates="notes")
    evaluation: "Evaluation" = Relationship(back_populates="notes")

    __table_args__ = (
        UniqueConstraint('id_etudiant', 'id_evaluation', name='uq_etudiant_evaluation'),
    )
