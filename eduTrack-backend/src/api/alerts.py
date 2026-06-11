from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List
from db.session import get_session as get_db
from db import models
from schemas.alerts import AtRiskStudentResponse

router = APIRouter()

@router.get("/", response_model=List[AtRiskStudentResponse])
def get_alerts(db: Session = Depends(get_db)):
    """
    Returns a list of at-risk students with the following logic:
    - Average grade < 10 -> "moyenne faible"
    - Absence count > 5 -> "absences excessives"
    - Both -> "critique"
    """
    # Query students with their average grade and absence count
    # We use distinct to avoid Cartesian product issues when joining multiple tables
    results = db.query(
        models.Etudiant,
        models.Classe.nom.label("classe_nom"),
        func.avg(models.Note.valeur).label("moyenne"),
        func.count(models.Absence.id.distinct()).label("nb_absences")
    ).outerjoin(models.Inscription, models.Etudiant.id == models.Inscription.id_etudiant) \
     .outerjoin(models.Classe, models.Inscription.id_classe == models.Classe.id) \
     .outerjoin(models.Note, models.Etudiant.id == models.Note.id_etudiant) \
     .outerjoin(models.Absence, models.Etudiant.id == models.Absence.id_etudiant) \
     .group_by(models.Etudiant.id, models.Classe.nom) \
     .all()

    at_risk_students = []
    
    for etudiant, classe_nom, moyenne, nb_absences in results:
        # Handle cases where moyenne is None (no notes)
        has_low_grade = moyenne is not None and moyenne < 10
        has_excessive_absences = nb_absences > 5
        
        if not has_low_grade and not has_excessive_absences:
            continue
            
        risk_level = ""
        recommandation = ""
        
        if has_low_grade and has_excessive_absences:
            risk_level = "critique"
            recommandation = "Suivi personnalisé urgent requis"
        elif has_low_grade:
            risk_level = "moyenne faible"
            recommandation = "Renforcement pédagogique recommandé"
        elif has_excessive_absences:
            risk_level = "absences excessives"
            recommandation = "Rappel d'assiduité nécessaire"
            
        at_risk_students.append(AtRiskStudentResponse(
            id=etudiant.id,
            nom=etudiant.nom,
            prenom=etudiant.prenom,
            classe=classe_nom,
            moyenne=round(float(moyenne), 2) if moyenne is not None else 0.0,
            nombre_absences=nb_absences,
            risk_level=risk_level,
            recommandation=recommandation
        ))
        
    return at_risk_students