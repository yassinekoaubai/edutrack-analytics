from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from db.session import get_session as get_db
from db import models
from schemas.alerts import AlertResponse

router = APIRouter()

@router.get("/", response_model=List[AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    """
    System Alerts: Returns triggered actions and warning milestones.
    """
    alerts = db.query(models.Alerte).order_by(models.Alerte.date_detection.desc()).all()
    
    response = []
    for alert in alerts:
        response.append(AlertResponse(
            id=alert.id,
            student_id=alert.id_etudiant,
            student_name=f"{alert.etudiant.prenom} {alert.etudiant.nom}",
            type_alerte=alert.parametre.type_risque if alert.parametre else "Inconnu",
            description=alert.message or "",
            date_generation=alert.date_detection
        ))
    return response