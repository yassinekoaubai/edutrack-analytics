from pydantic import BaseModel
from typing import List

class OverviewResponse(BaseModel):
    moyenne_generale: float
    taux_reussite: float
    taux_absence: float
    nombre_etudiants_a_risque: int
    progression_globale: str
    total_students: int = 0
    students_passing: int = 0
    unjustified_absences: int = 0
    critical_alerts: int = 0

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

class GradeDistributionBucket(BaseModel):
    label: str
    min_score: float
    max_score: float
    count: int

class ScatterPoint(BaseModel):
    student_id: int
    student_name: str
    gpa: float
    total_absences: float
    statut: str
