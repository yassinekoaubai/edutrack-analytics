from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_session
from models import Etudiant, Inscription, Classe, Note, Absence, Retard
from schemas import EtudiantListItem, EtudiantRead, NoteListItem, AbsenceListItem, RetardListItem
from services.analysis import predict_risk_score

router = APIRouter(tags=["Student Profiles"])

@router.get("/students/", response_model=List[EtudiantListItem], status_code=status.HTTP_200_OK)
def get_students(skip: int = 0, limit: int = 500, db: Session = Depends(get_session)):
    """
    Retrieve a list of students with their current class assignments.
    Returns: List of student overview records.
    """
    try:
        students = db.query(Etudiant).offset(skip).limit(limit).all()
        result = []
        for student in students:
            classe_nom = None
            inscription = (
                db.query(Inscription)
                .filter(Inscription.id_etudiant == student.id)
                .order_by(Inscription.annee_scolaire.desc())
                .first()
            )
            if inscription:
                classe = db.query(Classe).filter(Classe.id == inscription.id_classe).first()
                if classe:
                    classe_nom = classe.nom
            
            result.append(
                EtudiantListItem(
                    id=student.id,
                    nom=student.nom,
                    prenom=student.prenom,
                    date_naissance=student.date_naissance,
                    email=student.email,
                    statut=student.statut,
                    annee_entree=student.annee_entree,
                    classe=classe_nom,
                )
            )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des étudiants: {str(e)}"
        )

@router.get("/notes", response_model=List[NoteListItem], status_code=status.HTTP_200_OK)
def list_student_notes(skip: int = 0, limit: int = 5000, db: Session = Depends(get_session)):
    """
    Retrieve a list of all student grades/notes.
    Returns: List of academic grade records.
    """
    try:
        notes = db.query(Note).offset(skip).limit(limit).all()
        result = []
        for note in notes:
            module_id = note.evaluation.id_module if note.evaluation else 0
            coefficient = float(note.evaluation.coefficient_eval) if note.evaluation else 1.0
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des notes: {str(e)}"
        )

@router.get("/absences", response_model=List[AbsenceListItem], status_code=status.HTTP_200_OK)
def list_student_absences(skip: int = 0, limit: int = 5000, db: Session = Depends(get_session)):
    """
    Retrieve a list of all student absence records.
    Returns: List of absence records.
    """
    try:
        absences = db.query(Absence).offset(skip).limit(limit).all()
        return absences
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des absences: {str(e)}"
        )

@router.get("/retards", response_model=List[RetardListItem], status_code=status.HTTP_200_OK)
def list_student_retards(skip: int = 0, limit: int = 5000, db: Session = Depends(get_session)):
    """
    Retrieve a list of all student tardiness records.
    Returns: List of tardiness records.
    """
    try:
        retards = db.query(Retard).offset(skip).limit(limit).all()
        return retards
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des retards: {str(e)}"
        )

@router.get("/students/{id}", response_model=EtudiantRead, status_code=status.HTTP_200_OK)
def get_student_detail(id: int, db: Session = Depends(get_session)):
    """
    Retrieve detailed profile and analytics for a specific student.
    Returns: Comprehensive student profile including grades, counts, and risk score.
    """
    try:
        student = db.query(Etudiant).filter(Etudiant.id == id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Étudiant avec l'ID {id} non trouvé."
            )
            
        notes = db.query(Note).filter(Note.id_etudiant == id).all()
        absences_count = db.query(Absence).filter(Absence.id_etudiant == id).count()
        retards_count = db.query(Retard).filter(Retard.id_etudiant == id).count()
        
        formatted_notes = []
        for n in notes:
            module_nom = "Inconnu"
            if n.evaluation and n.evaluation.module:
                module_nom = n.evaluation.module.nom
            formatted_notes.append({"module": module_nom, "valeur": n.valeur})
        
        risk_score = predict_risk_score(id, db)
        
        return EtudiantRead(
            id=student.id,
            nom=student.nom,
            prenom=student.prenom,
            email=student.email,
            statut=student.statut,
            annee_entree=student.annee_entree,
            notes=formatted_notes,
            absences_count=absences_count,
            retards_count=retards_count,
            classement=0,
            risk_score=risk_score
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération du détail de l'étudiant: {str(e)}"
        )
