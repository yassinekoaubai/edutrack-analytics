from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import numpy as np
from typing import List
from database import get_session
from models import Etudiant, Note, Absence, Alerte, Module, Evaluation
from schemas import OverviewResponse, ModuleStat, GradeDistributionBucket, ScatterPoint

router = APIRouter(prefix="/dashboard", tags=["Dashboard KPIs"])

BUCKETS = [
    ("[0-8)", 0, 8),
    ("[8-10)", 8, 10),
    ("[10-12)", 10, 12),
    ("[12-14)", 12, 14),
    ("[14-16)", 14, 16),
    ("[16-20]", 16, 21),
]

def _student_averages(db: Session) -> dict[int, float]:
    """
    Internal helper to calculate student averages.
    """
    rows = (
        db.query(Note.id_etudiant, func.avg(Note.valeur))
        .filter(Note.valeur.isnot(None))
        .group_by(Note.id_etudiant)
        .all()
    )
    return {row[0]: float(row[1]) for row in rows}

def _student_absence_hours(db: Session) -> dict[int, float]:
    """
    Internal helper to calculate total student absence hours.
    """
    rows = (
        db.query(
            Absence.id_etudiant,
            func.coalesce(func.sum(Absence.nb_heures), 0),
        )
        .group_by(Absence.id_etudiant)
        .all()
    )
    return {row[0]: float(row[1]) for row in rows}

@router.get("/overview", response_model=OverviewResponse, status_code=status.HTTP_200_OK)
def get_dashboard_overview(db: Session = Depends(get_session)):
    """
    Retrieve high-level global KPIs for the dashboard.
    Returns: Global metrics including general average, success rate, and alert counts.
    """
    try:
        total_students = db.query(Etudiant).count()
        if total_students == 0:
            return OverviewResponse(
                moyenne_generale=0.0,
                taux_reussite=0.0,
                taux_absence=0.0,
                nombre_etudiants_a_risque=0,
                progression_globale="Stable",
                total_students=0,
                students_passing=0,
                unjustified_absences=0,
                critical_alerts=0,
            )

        avg_note = db.query(func.avg(Note.valeur)).filter(Note.valeur.isnot(None)).scalar() or 0.0
        averages = _student_averages(db)
        students_with_notes = len(averages)
        students_passing = sum(1 for avg in averages.values() if avg >= 10)
        taux_reussite = (
            round(students_passing / students_with_notes * 100, 1)
            if students_with_notes > 0
            else 0.0
        )

        absence_hours = _student_absence_hours(db)
        total_absence_hours = sum(absence_hours.values())
        taux_absence = round(total_absence_hours / total_students, 1) if total_students else 0.0

        unjustified_absences = db.query(Absence).filter(Absence.justifiee.is_(False)).count()
        students_at_risk = db.query(Etudiant).join(Alerte).filter(Alerte.statut == "Nouvelle").distinct().count()
        critical_alerts = db.query(Alerte).filter(Alerte.statut == "Nouvelle").count()

        return OverviewResponse(
            moyenne_generale=round(float(avg_note), 2),
            taux_reussite=taux_reussite,
            taux_absence=taux_absence,
            nombre_etudiants_a_risque=students_at_risk,
            progression_globale="Stable",
            total_students=total_students,
            students_passing=students_passing,
            unjustified_absences=unjustified_absences,
            critical_alerts=critical_alerts,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération de l'overview: {str(e)}"
        )

@router.get("/modules/stats", response_model=List[ModuleStat], status_code=status.HTTP_200_OK)
def get_dashboard_modules_stats(db: Session = Depends(get_session)):
    """
    Retrieve statistical performance indicators for each course module.
    Returns: List of module stats (mean, median, std dev, failure rate).
    """
    try:
        modules = db.query(Module).all()
        stats = []

        for module in modules:
            notes = [
                n.valeur
                for n in db.query(Note)
                .join(Evaluation)
                .filter(Evaluation.id_module == module.id)
                .all()
            ]
            notes_clean = [n for n in notes if n is not None]
            if not notes_clean:
                continue

            stats.append(
                ModuleStat(
                    module_name=module.nom,
                    moyenne=round(float(np.mean(notes_clean)), 2),
                    mediane=round(float(np.median(notes_clean)), 2),
                    ecart_type=round(float(np.std(notes_clean)), 2),
                    taux_echec=round(
                        float(sum(1 for x in notes_clean if x < 10) / len(notes_clean) * 100), 2
                    ),
                )
            )
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du calcul des stats modules: {str(e)}"
        )

@router.get("/grades/distribution", response_model=List[GradeDistributionBucket], status_code=status.HTTP_200_OK)
def get_dashboard_grade_distribution(db: Session = Depends(get_session)):
    """
    Retrieve the frequency distribution of student averages across pre-defined buckets.
    Returns: List of buckets with student counts.
    """
    try:
        averages = _student_averages(db)
        buckets = [
            GradeDistributionBucket(label=label, min_score=lo, max_score=hi, count=0)
            for label, lo, hi in BUCKETS
        ]

        for avg in averages.values():
            for bucket in buckets:
                if avg >= bucket.min_score and avg < bucket.max_score:
                    bucket.count += 1
                    break

        return buckets
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du calcul de la distribution: {str(e)}"
        )

@router.get("/scatter", response_model=List[ScatterPoint], status_code=status.HTTP_200_OK)
def get_dashboard_scatter_data(db: Session = Depends(get_session)):
    """
    Retrieve correlation data points between student GPAs and their total absences.
    Returns: List of data points for a scatter plot analysis.
    """
    try:
        averages = _student_averages(db)
        absence_hours = _student_absence_hours(db)
        students = db.query(Etudiant).all()
        points = []

        for student in students:
            gpa = averages.get(student.id, 0.0)
            abs_hours = absence_hours.get(student.id, 0.0)
            points.append(
                ScatterPoint(
                    student_id=student.id,
                    student_name=f"{student.prenom} {student.nom}",
                    gpa=round(gpa, 2),
                    total_absences=round(abs_hours, 1),
                    statut=student.statut,
                )
            )
        return points
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération du nuage de points: {str(e)}"
        )
