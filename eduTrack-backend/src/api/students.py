from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.session import get_session as get_db
from db import models
from schemas.etudiant import EtudiantBase, EtudiantRead

router = APIRouter()

@router.get("/", response_model=List[EtudiantBase])
def get_students(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """
    Retrieve list of students with their global segments.
    """
    students = db.query(models.Etudiant).offset(skip).limit(limit).all()
    return students

@router.get("/{id}", response_model=EtudiantRead)
def get_student_by_id(id: int, db: Session = Depends(get_db)):
    """
    Analyse individuelle: Returns detailed profiling for a target student.
    """
    student = db.query(models.Etudiant).filter(models.Etudiant.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found.")
        
    # Gather related models
    notes = db.query(models.Note).filter(models.Note.id_etudiant == id).all()
    absences = db.query(models.Absence).filter(models.Absence.id_etudiant == id).count()
    retards = db.query(models.Retard).filter(models.Retard.id_etudiant == id).count()
    
    # Formatting notes into dictionaries
    # Note: in models.py, Note has evaluation relationship, which has module relationship
    formatted_notes = []
    for n in notes:
        module_nom = "Inconnu"
        if n.evaluation and n.evaluation.module:
            module_nom = n.evaluation.module.nom
        formatted_notes.append({"module": module_nom, "valeur": n.valeur})
    
    return EtudiantRead(
        id=student.id,
        nom=student.nom,
        prenom=student.prenom,
        email=student.email,
        statut=student.statut,
        annee_entree=student.annee_entree,
        notes=formatted_notes,
        absences_count=absences,
        retards_count=retards,
        classement=12 # Placeholder
    )