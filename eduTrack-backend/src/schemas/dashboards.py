from pydantic import BaseModel
from typing import List, Dict, Any

class OverviewResponse(BaseModel):
    moyenne_generale: float
    taux_reussite: float
    taux_absence: float
    nombre_etudiants_a_risque: int
    progression_globale: str

class ModuleStat(BaseModel):
    module_name: str
    moyenne: float
    mediane: float
    ecart_type: float
    taux_echec: float

class ClassCompare(BaseModel):
    class_name: str
    moyenne_generale: float
    taux_absence: float
    total_students: int