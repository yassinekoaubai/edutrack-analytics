from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime

# 1. Create - for POST /retards
class RetardCreate(BaseModel):
    id_etudiant: int
    id_module: int
    date_retard: datetime
    duree_minutes: Optional[int] = Field(default=None, ge=0, le=600) # max 10h
    justifie: bool = Field(default=False)

    @field_validator('duree_minutes')
    @classmethod
    def check_duree(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError('La durée ne peut pas être négative')
        return v

# 2. Update - for PATCH /retards/{id}
class RetardUpdate(BaseModel):
    id_etudiant: Optional[int] = None
    id_module: Optional[int] = None
    date_retard: Optional[datetime] = None
    duree_minutes: Optional[int] = Field(default=None, ge=0, le=600)
    justifie: Optional[bool] = None

# 3. Read - for GET response
class RetardRead(RetardCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)

# 4. Simple read schemas to avoid circular imports - reuse if already defined elsewhere
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
class RetardReadWithRelationships(RetardRead):
    etudiant: Optional[EtudiantSimpleRead] = None
    module: Optional[ModuleSimpleRead] = None