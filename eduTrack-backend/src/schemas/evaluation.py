from datetime import date
from typing import Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Numeric

class EvaluationBase(SQLModel):
    id_module: int
    nom_eval: Optional[str] = Field(default=None, max_length=100)
    date_prevue: Optional[date] = None
    coefficient_eval: float = Field(default=1.0, sa_column=Column(Numeric(3,1)))
    semestre: Optional[str] = Field(default=None, max_length=10)

class EvaluationCreate(EvaluationBase):
    pass

class EvaluationRead(EvaluationBase):
    id: int