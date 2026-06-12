from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .user import Utilisateur

class ImportLog(SQLModel, table=True):
    """
    Logs data import operations.
    """
    __tablename__ = "import_logs"
    id: Optional[int] = Field(default=None, primary_key=True)
    nom_fichier: Optional[str] = Field(default=None, max_length=255)
    date_import: datetime = Field(default_factory=datetime.utcnow)
    type_donnees: Optional[str] = Field(default=None, max_length=50)
    nb_lignes_ok: int = 0
    nb_lignes_rejet: int = 0
    statut: Optional[str] = Field(default=None, max_length=20)
    id_auteur: Optional[int] = Field(default=None, foreign_key="utilisateurs.id")

    auteur: Optional["Utilisateur"] = Relationship(back_populates="imports")
