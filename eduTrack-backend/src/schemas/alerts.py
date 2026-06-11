from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class AlertResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    type_alerte: str  # Absence excessif, Moyenne basse, etc.
    description: str
    date_generation: datetime

class AtRiskStudentResponse(BaseModel):
    id: int
    nom: str
    prenom: str
    classe: Optional[str] = None
    moyenne: float
    nombre_absences: int
    risk_level: str  # "critique" | "moyenne faible" | "absences excessives"
    recommandation: str