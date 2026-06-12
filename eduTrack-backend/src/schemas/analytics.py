from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class AbsenceListItem(BaseModel):
    """
    Schema for an absence record in a list.
    """
    id: int
    id_etudiant: int
    id_module: int
    date_absence: date
    nb_heures: Optional[float] = None
    justifiee: bool = False
    motif: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class RetardListItem(BaseModel):
    """
    Schema for a tardiness record in a list.
    """
    id: int
    id_etudiant: int
    id_module: int
    date_retard: datetime
    duree_minutes: Optional[int] = None
    justifie: bool = False
    model_config = ConfigDict(from_attributes=True)

class AtRiskStudentResponse(BaseModel):
    """
    Schema for students identified as being at pedagogical risk.
    """
    id: int
    nom: str
    prenom: str
    classe: Optional[str] = None
    moyenne: float
    nombre_absences: int
    risk_level: str
    recommandation: str

class OverviewResponse(BaseModel):
    """
    Schema for dashboard overview KPIs.
    """
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
    """
    Schema for module statistical indicators.
    """
    module_name: str
    moyenne: float
    mediane: float
    ecart_type: float
    taux_echec: float

class ClassCompare(BaseModel):
    """
    Schema for class performance comparison.
    """
    class_name: str
    moyenne_generale: float
    taux_absence: float
    total_students: int

class GradeDistributionBucket(BaseModel):
    """
    Schema for grade distribution frequency buckets.
    """
    label: str
    min_score: float
    max_score: float
    count: int

class ScatterPoint(BaseModel):
    """
    Schema for correlation scatter plot data points.
    """
    student_id: int
    student_name: str
    gpa: float
    total_absences: float
    statut: str
