from typing import List, Optional
from sqlmodel import Session, select, func
from db.models import Etudiant, Note, Absence, Retard, Alerte, ParametreRisque
from datetime import datetime

def get_or_create_default_params(session: Session) -> List[ParametreRisque]:
    params = session.exec(select(ParametreRisque)).all()
    if not params:
        params = [
            ParametreRisque(type_risque="Moyenne basse", seuil=10.0, operateur="<"),
            ParametreRisque(type_risque="Absences excessives", seuil=6.0, operateur=">"),
            ParametreRisque(type_risque="Retards fréquents", seuil=3.0, operateur=">"),
        ]
        for p in params:
            session.add(p)
        session.commit()
        # Refresh to get IDs
        params = session.exec(select(ParametreRisque)).all()
    return params

def run_alert_detection(session: Session):
    """
    Analyzes current data to detect and persist pedagogical alerts.
    """
    params = get_or_create_default_params(session)
    
    # 1. GPA Detection
    gpa_param = next((p for p in params if p.type_risque == "Moyenne basse"), None)
    if gpa_param:
        stmt = select(Note.id_etudiant, func.avg(Note.valeur).label("avg_note")).group_by(Note.id_etudiant)
        results = session.exec(stmt).all()
        for student_id, avg_note in results:
            if avg_note is not None and avg_note < gpa_param.seuil:
                _create_alert_if_new(session, student_id, gpa_param, float(avg_note), 
                                    f"Moyenne générale de {round(avg_note, 2)}/20 (inférieure à {gpa_param.seuil})")

    # 2. Absence Detection
    abs_param = next((p for p in params if p.type_risque == "Absences excessives"), None)
    if abs_param:
        stmt = select(Absence.id_etudiant, func.sum(Absence.nb_heures).label("total_hours")).group_by(Absence.id_etudiant)
        results = session.exec(stmt).all()
        for student_id, total_hours in results:
            if total_hours is not None and total_hours > abs_param.seuil:
                _create_alert_if_new(session, student_id, abs_param, float(total_hours), 
                                    f"Total de {total_hours}h d'absences (seuil: {abs_param.seuil}h)")

    # 3. Tardy Detection
    retard_param = next((p for p in params if p.type_risque == "Retards fréquents"), None)
    if retard_param:
        stmt = select(Retard.id_etudiant, func.count(Retard.id).label("count_retards")).group_by(Retard.id_etudiant)
        results = session.exec(stmt).all()
        for student_id, count_retards in results:
            if count_retards is not None and count_retards > retard_param.seuil:
                _create_alert_if_new(session, student_id, retard_param, float(count_retards), 
                                    f"Nombre de retards cumulés: {count_retards} (seuil: {retard_param.seuil})")
    
    session.commit()

def _create_alert_if_new(session: Session, student_id: int, param: ParametreRisque, value: float, message: str):
    # Avoid duplicate active alerts for the same reason
    existing = session.exec(
        select(Alerte).where(
            Alerte.id_etudiant == student_id,
            Alerte.id_parametre == param.id,
            Alerte.statut == "Nouvelle"
        )
    ).first()
    
    if not existing:
        alert = Alerte(
            id_etudiant=student_id,
            id_parametre=param.id,
            valeur_mesuree=value,
            message=message,
            statut="Nouvelle"
        )
        session.add(alert)

def predict_risk_score(student_id: int, session: Session) -> float:
    """
    Calculates a risk score (0-100) based on multiple pedagogical factors.
    Based on logic from 03_Modeling_Risk.ipynb.
    """
    # 1. Fetch data
    gpa = session.exec(select(func.avg(Note.valeur)).where(Note.id_etudiant == student_id)).one_or_none() or 10.0
    absences = session.exec(select(func.sum(Absence.nb_heures)).where(Absence.id_etudiant == student_id)).one_or_none() or 0.0
    retards = session.exec(select(func.count(Retard.id)).where(Retard.id_etudiant == student_id)).one_or_none() or 0.0
    
    # 2. Score Calculation (Weights)
    # GPA component (0-50 pts): Lower GPA = Higher Risk
    # We consider < 10 to be high risk. 0 GPA = 50 pts, 10 GPA = 10 pts, 20 GPA = 0 pts.
    gpa_score = max(0, (20 - gpa) * 2.5) 
    
    # Absences component (0-30 pts): 1h = 2.5 pts, max at 12h
    abs_score = min(30.0, absences * 2.5)
    
    # Retards component (0-20 pts): 1 retard = 4 pts, max at 5 retards
    ret_score = min(20.0, retards * 4.0)
    
    total_score = gpa_score + abs_score + ret_score
    return round(min(100.0, total_score), 1)
