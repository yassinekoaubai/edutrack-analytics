from pydantic import BaseModel
from datetime import datetime

class AlertResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    type_alerte: str  # Absence excessif, Moyenne basse, etc.
    description: str
    date_generation: datetime