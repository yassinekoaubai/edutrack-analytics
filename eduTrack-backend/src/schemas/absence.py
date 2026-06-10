from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import date

# 1. Create - for POST /absences
class AbsenceCreate(BaseModel):
    id_etudiant: int
    id_module: int
    date_absence: date
    nb_heures: Optional[float] = Field(default=None, ge=0.0, le=24.0)
    justifiee: bool = Field(default=False)
    motif: Optional[str] = Field(default=None, max_length=1000)

    @field_validator('nb_heures')
    @classmethod
    def check_nb_heures(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError('Le nombre d\'heures ne peut pas être négatif')
        return round(v, 1) if v is not None else None

# 2. Update - for PATCH /absences/{id}
class AbsenceUpdate(BaseModel):
    id_etudiant: Optional[int] = None
    id_module: Optional[int] = None
    date_absence: Optional[date] = None
    nb_heures: Optional[float] = Field(default=None, ge=0.0, le=24.0)
    justifiee: Optional[bool] = None
    motif: Optional[str] = Field(default=None, max_length=1000)

# 3. Read - for GET response
class AbsenceRead(AbsenceCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)

# 4. Simple read schemas to avoid circular imports
class EtudiantSimpleRead(BaseModel):
    id: int
    nom: str
    prenom: str
    email: Optional[str]
    model_config = ConfigDict(from_attributes=True)

class ModuleSimpleRead(BaseModel):
    id: int
    code_module: str
    nom_module: str
    model_config = ConfigDict(from_attributes=True)

# 5. Read with relationships - for GET with joins
class AbsenceReadWithRelationships(AbsenceRead):
    etudiant: Optional[EtudiantSimpleRead] = None
    module: Optional[ModuleSimpleRead] = None