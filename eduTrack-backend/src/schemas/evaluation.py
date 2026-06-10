from datetime import date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class EvaluationBase(BaseModel):
    id_module: int
    nom_eval: Optional[str] = Field(default=None, max_length=100)
    date_prevue: Optional[date] = None
    coefficient_eval: float = Field(default=1.0)
    semestre: Optional[str] = Field(default=None, max_length=10)
    model_config = ConfigDict(from_attributes=True)

class EvaluationCreate(EvaluationBase):
    pass

class EvaluationRead(EvaluationBase):
    id: int