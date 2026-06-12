from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_session
from models import Module, Evaluation, UtilisateurModule, Utilisateur, Programme
from schemas import ModuleListItem, EvaluationListItem

router = APIRouter(tags=["Academic Modules"])

@router.get("/modules", response_model=List[ModuleListItem], status_code=status.HTTP_200_OK)
def list_modules(db: Session = Depends(get_session)):
    """
    Retrieve a list of all course modules with their assigned professors and coefficients.
    Returns: List of module records.
    """
    try:
        modules = db.query(Module).all()
        result = []
        for module in modules:
            professor = None
            assignment = (
                db.query(UtilisateurModule)
                .filter(UtilisateurModule.id_module == module.id)
                .first()
            )
            if assignment:
                user = db.query(Utilisateur).filter(Utilisateur.id == assignment.id_utilisateur).first()
                if user:
                    professor = f"{user.prenom} {user.nom}"

            programme = (
                db.query(Programme)
                .filter(Programme.id_module == module.id)
                .first()
            )
            coefficient = float(programme.coefficient_filiere) if programme else 1.0

            result.append(
                ModuleListItem(
                    id=module.id,
                    nom=module.nom,
                    professor=professor,
                    coefficient=coefficient,
                )
            )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des modules: {str(e)}"
        )

@router.get("/evaluations", response_model=List[EvaluationListItem], status_code=status.HTTP_200_OK)
def list_evaluations(db: Session = Depends(get_session)):
    """
    Retrieve a list of all planned evaluations/assessments.
    Returns: List of evaluation records.
    """
    try:
        evaluations = db.query(Evaluation).all()
        return evaluations
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des évaluations: {str(e)}"
        )
