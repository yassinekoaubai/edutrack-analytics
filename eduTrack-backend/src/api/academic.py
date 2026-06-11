from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from db.session import get_session as get_db
from db import models
from schemas.academic import (
    ModuleListItem,
    EvaluationListItem,
    NoteListItem,
    AbsenceListItem,
    RetardListItem,
    ImportLogListItem,
)

router = APIRouter()


@router.get("/modules", response_model=List[ModuleListItem])
def list_modules(db: Session = Depends(get_db)):
    modules = db.query(models.Module).all()
    result = []
    for module in modules:
        professor = None
        assignment = (
            db.query(models.UtilisateurModule)
            .filter(models.UtilisateurModule.id_module == module.id)
            .first()
        )
        if assignment:
            user = db.query(models.Utilisateur).filter(
                models.Utilisateur.id == assignment.id_utilisateur
            ).first()
            if user:
                professor = f"{user.prenom} {user.nom}"

        programme = (
            db.query(models.Programme)
            .filter(models.Programme.id_module == module.id)
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


@router.get("/evaluations", response_model=List[EvaluationListItem])
def list_evaluations(db: Session = Depends(get_db)):
    evaluations = db.query(models.Evaluation).all()
    return [
        EvaluationListItem(
            id=item.id,
            id_module=item.id_module,
            nom_eval=item.nom_eval,
            date_prevue=item.date_prevue,
            coefficient_eval=float(item.coefficient_eval),
        )
        for item in evaluations
    ]


@router.get("/notes", response_model=List[NoteListItem])
def list_notes(skip: int = 0, limit: int = 5000, db: Session = Depends(get_db)):
    notes = db.query(models.Note).offset(skip).limit(limit).all()
    result = []
    for note in notes:
        module_id = note.evaluation.id_module if note.evaluation else 0
        coefficient = (
            float(note.evaluation.coefficient_eval)
            if note.evaluation
            else 1.0
        )
        result.append(
            NoteListItem(
                id=note.id,
                id_etudiant=note.id_etudiant,
                id_evaluation=note.id_evaluation,
                id_module=module_id,
                valeur=note.valeur,
                coefficient_eval=coefficient,
                date_saisie=note.date_saisie,
            )
        )
    return result


@router.get("/absences", response_model=List[AbsenceListItem])
def list_absences(skip: int = 0, limit: int = 5000, db: Session = Depends(get_db)):
    absences = db.query(models.Absence).offset(skip).limit(limit).all()
    return [
        AbsenceListItem(
            id=item.id,
            id_etudiant=item.id_etudiant,
            id_module=item.id_module,
            date_absence=item.date_absence,
            nb_heures=float(item.nb_heures) if item.nb_heures is not None else None,
            justifiee=item.justifiee,
            motif=item.motif,
        )
        for item in absences
    ]


@router.get("/retards", response_model=List[RetardListItem])
def list_retards(skip: int = 0, limit: int = 5000, db: Session = Depends(get_db)):
    retards = db.query(models.Retard).offset(skip).limit(limit).all()
    return [
        RetardListItem(
            id=item.id,
            id_etudiant=item.id_etudiant,
            id_module=item.id_module,
            date_retard=item.date_retard,
            duree_minutes=item.duree_minutes,
            justifie=item.justifie,
        )
        for item in retards
    ]


@router.get("/import-logs", response_model=List[ImportLogListItem])
def list_import_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logs = (
        db.query(models.ImportLog)
        .order_by(models.ImportLog.date_import.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return logs
