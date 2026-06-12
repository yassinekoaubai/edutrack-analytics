from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
import enum

if TYPE_CHECKING:
    from .academic import Module
    from .analytics import Alerte
    from .import_log import ImportLog

class RoleEnum(str, enum.Enum):
    """
    Enumeration of user roles within the system.
    """
    ADMIN = "ADMIN"
    DIRECTION = "DIRECTION"
    PROF = "PROF"
    PEDAGOGIE = "PEDAGOGIE"
    ACCUEIL = "ACCUEIL"

class Utilisateur(SQLModel, table=True):
    """
    Represents a staff member or faculty user.
    """
    __tablename__ = "utilisateurs"
    id: Optional[int] = Field(default=None, primary_key=True)
    nom: str = Field(max_length=50)
    prenom: str = Field(max_length=50)
    email: str = Field(max_length=120, unique=True, index=True)
    password_hash: str
    role: RoleEnum = Field(default=RoleEnum.PROF)
    actif: bool = True
    date_creation: datetime = Field(default_factory=datetime.utcnow)
    derniere_connexion: Optional[datetime] = None

    modules_enseignes: List["UtilisateurModule"] = Relationship(back_populates="utilisateur")
    imports: List["ImportLog"] = Relationship(back_populates="auteur")
    alertes_traitees: List["Alerte"] = Relationship(back_populates="traite_par")

class UtilisateurModule(SQLModel, table=True):
    """
    Link between users and the modules they teach.
    """
    __tablename__ = "utilisateurs_modules"
    id_utilisateur: int = Field(foreign_key="utilisateurs.id", primary_key=True)
    id_module: int = Field(foreign_key="modules.id", primary_key=True)
    est_responsable: bool = False

    utilisateur: Utilisateur = Relationship(back_populates="modules_enseignes")
    module: "Module" = Relationship(back_populates="profs")
