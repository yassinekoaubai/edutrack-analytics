from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ImportResult(BaseModel):
    """
    Schema for the result of a data import operation.
    """
    filename: str
    type_donnees: str
    nb_lignes_total: int
    nb_lignes_ok: int
    nb_lignes_rejet: int
    statut: str
    message: str

class ImportLogListItem(BaseModel):
    """
    Schema for a historical import log record.
    """
    id: int
    nom_fichier: Optional[str] = None
    date_import: datetime
    type_donnees: Optional[str] = None
    nb_lignes_ok: int = 0
    nb_lignes_rejet: int = 0
    statut: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
