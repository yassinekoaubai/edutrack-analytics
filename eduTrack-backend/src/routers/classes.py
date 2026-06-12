from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from database import get_session
from models import Classe, Inscription, Note, Absence
from schemas import ClassCompare, ClasseListItem

router = APIRouter(tags=["Classes Analytics"])

@router.get("/classes", response_model=List[ClasseListItem], status_code=status.HTTP_200_OK)
def list_classes(db: Session = Depends(get_session)):
    """
    Retrieve a list of all classes/cohorts.
    Returns: List of class overview records.
    """
    try:
        classes = db.query(Classe).all()
        result = []
        for c in classes:
            filiere_nom = c.filiere.nom_filiere if c.filiere else "Non assignée"
            result.append(
                ClasseListItem(
                    id=c.id,
                    nom=c.nom,
                    niveau=c.niveau,
                    annee_scolaire=c.annee_scolaire,
                    filiere_nom=filiere_nom
                )
            )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des classes: {str(e)}"
        )

@router.get("/dashboard/classes/compare", response_model=List[ClassCompare], status_code=status.HTTP_200_OK)
def compare_classes_performance(db: Session = Depends(get_session)):
    """
    Compare average performance and attendance across all classes.
    Returns: List of comparative statistical records per class.
    """
    try:
        classes = db.query(Classe).all()
        result = []

        for classe in classes:
            student_ids = [
                ins.id_etudiant
                for ins in db.query(Inscription)
                .filter(Inscription.id_classe == classe.id)
                .all()
            ]
            if not student_ids:
                continue

            avg_note = (
                db.query(func.avg(Note.valeur))
                .filter(
                    Note.id_etudiant.in_(student_ids),
                    Note.valeur.isnot(None),
                )
                .scalar()
            )

            total_abs = (
                db.query(func.coalesce(func.sum(Absence.nb_heures), 0))
                .filter(Absence.id_etudiant.in_(student_ids))
                .scalar()
            )
            taux_abs = round(float(total_abs) / len(student_ids), 1) if student_ids else 0.0

            result.append(
                ClassCompare(
                    class_name=classe.nom,
                    moyenne_generale=round(float(avg_note), 2) if avg_note else 0.0,
                    taux_absence=taux_abs,
                    total_students=len(student_ids),
                )
            )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la comparaison des classes: {str(e)}"
        )
