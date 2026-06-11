from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from db.session import get_session as get_db
from db import models
from schemas.dashboards import (
    OverviewResponse,
    ModuleStat,
    ClassCompare,
    GradeDistributionBucket,
    ScatterPoint,
)
from sqlalchemy import func

router = APIRouter()

BUCKETS = [
    ("[0-8)", 0, 8),
    ("[8-10)", 8, 10),
    ("[10-12)", 10, 12),
    ("[12-14)", 12, 14),
    ("[14-16)", 14, 16),
    ("[16-20]", 16, 21),
]


def _student_averages(db: Session) -> dict[int, float]:
    rows = (
        db.query(models.Note.id_etudiant, func.avg(models.Note.valeur))
        .filter(models.Note.valeur.isnot(None))
        .group_by(models.Note.id_etudiant)
        .all()
    )
    return {row[0]: float(row[1]) for row in rows}


def _student_absence_hours(db: Session) -> dict[int, float]:
    rows = (
        db.query(
            models.Absence.id_etudiant,
            func.coalesce(func.sum(models.Absence.nb_heures), 0),
        )
        .group_by(models.Absence.id_etudiant)
        .all()
    )
    return {row[0]: float(row[1]) for row in rows}


@router.get("/overview", response_model=OverviewResponse)
def get_dashboard_overview(db: Session = Depends(get_db)):
    total_students = db.query(models.Etudiant).count()
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

    avg_note = db.query(func.avg(models.Note.valeur)).filter(
        models.Note.valeur.isnot(None)
    ).scalar() or 0.0

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

    unjustified_absences = db.query(models.Absence).filter(
        models.Absence.justifiee.is_(False)
    ).count()

    students_at_risk = (
        db.query(models.Etudiant)
        .join(models.Alerte)
        .filter(models.Alerte.statut == "Nouvelle")
        .distinct()
        .count()
    )

    critical_alerts = db.query(models.Alerte).filter(
        models.Alerte.statut == "Nouvelle"
    ).count()

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


@router.get("/modules/stats", response_model=List[ModuleStat])
def get_modules_stats(db: Session = Depends(get_db)):
    modules = db.query(models.Module).all()
    stats = []

    for module in modules:
        notes = [
            n.valeur
            for n in db.query(models.Note)
            .join(models.Evaluation)
            .filter(models.Evaluation.id_module == module.id)
            .all()
        ]
        notes_clean = [n for n in notes if n is not None]
        if not notes_clean:
            continue

        import numpy as np

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


@router.get("/classes/compare", response_model=List[ClassCompare])
def compare_classes(db: Session = Depends(get_db)):
    classes = db.query(models.Classe).all()
    result = []

    for classe in classes:
        student_ids = [
            ins.id_etudiant
            for ins in db.query(models.Inscription)
            .filter(models.Inscription.id_classe == classe.id)
            .all()
        ]
        if not student_ids:
            continue

        avg_note = (
            db.query(func.avg(models.Note.valeur))
            .filter(
                models.Note.id_etudiant.in_(student_ids),
                models.Note.valeur.isnot(None),
            )
            .scalar()
        )

        total_abs = (
            db.query(func.coalesce(func.sum(models.Absence.nb_heures), 0))
            .filter(models.Absence.id_etudiant.in_(student_ids))
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


@router.get("/grades/distribution", response_model=List[GradeDistributionBucket])
def grade_distribution(db: Session = Depends(get_db)):
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


@router.get("/scatter", response_model=List[ScatterPoint])
def scatter_data(db: Session = Depends(get_db)):
    averages = _student_averages(db)
    absence_hours = _student_absence_hours(db)
    students = db.query(models.Etudiant).all()
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
