from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from database import get_session
from models import Etudiant, Inscription, Classe, Note, Absence
from schemas import AtRiskStudentResponse

router = APIRouter(prefix="/alerts", tags=["Pedagogical Alerts"])

@router.get("/", response_model=List[AtRiskStudentResponse], status_code=status.HTTP_200_OK)
def get_pedagogical_alerts(db: Session = Depends(get_session)):
    """
    Identifies and returns students at academic risk based on grades and attendance.
    Returns: List of at-risk student records with recommendations.
    """
    try:
        results = db.query(
            Etudiant,
            Classe.nom.label("classe_nom"),
            func.avg(Note.valeur).label("moyenne"),
            func.count(Absence.id.distinct()).label("nb_absences")
        ).outerjoin(Inscription, Etudiant.id == Inscription.id_etudiant) \
         .outerjoin(Classe, Inscription.id_classe == Classe.id) \
         .outerjoin(Note, Etudiant.id == Note.id_etudiant) \
         .outerjoin(Absence, Etudiant.id == Absence.id_etudiant) \
         .group_by(Etudiant.id, Classe.nom) \
         .all()

        at_risk_students = []
        
        for etudiant, classe_nom, moyenne, nb_absences in results:
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'analyse des alertes: {str(e)}"
        )
