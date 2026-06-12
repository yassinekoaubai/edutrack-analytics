import pandas as pd
from sqlmodel import Session, select
from models import Etudiant, ImportLog, Module, Evaluation, Note, Absence, Retard, Filiere, Classe
from schemas import ImportResult
from .validation import (
    validate_etudiant_df, validate_module_df, validate_evaluation_df, 
    validate_note_df, validate_absence_df, validate_retard_df,
    validate_filiere_df, validate_classe_df
)
from .cleaning import (
    clean_etudiant_df, clean_module_df, clean_evaluation_df, 
    clean_note_df, clean_absence_df, clean_retard_df,
    clean_filiere_df, clean_classe_df
)
from .analysis import run_alert_detection

def process_etudiant_import(df: pd.DataFrame, filename: str, session: Session) -> ImportResult:
    """
    Process student data import: clean, validate, and upsert records.
    Returns: Import result with statistics.
    """
    df = clean_etudiant_df(df)
    validated_students, errors = validate_etudiant_df(df)
    nb_ok = 0
    for student_data in validated_students:
        try:
            existing = session.exec(select(Etudiant).where(Etudiant.email == student_data.email)).first()
            if existing:
                for k, v in student_data.model_dump().items():
                    setattr(existing, k, v)
            else:
                session.add(Etudiant.model_validate(student_data))
            nb_ok += 1
        except Exception as e:
            errors.append(f"Erreur DB pour {student_data.email}: {str(e)}")
    
    session.commit()
    log = ImportLog(
        nom_fichier=filename, 
        type_donnees="etudiants", 
        nb_lignes_ok=nb_ok, 
        nb_lignes_rejet=len(errors), 
        statut="Terminé"
    )
    session.add(log)
    session.commit()
    
    try:
        run_alert_detection(session)
    except Exception:
        pass # Silent fail for background alert detection
        
    return ImportResult(
        filename=filename,
        type_donnees="etudiants",
        nb_lignes_total=len(df),
        nb_lignes_ok=nb_ok,
        nb_lignes_rejet=len(errors),
        statut="Succès" if nb_ok > 0 else "Erreur",
        message=f"Import terminé: {nb_ok} étudiants synchronisés."
    )

def process_module_import(df: pd.DataFrame, filename: str, session: Session) -> ImportResult:
    """
    Process module data import: clean, validate, and upsert records.
    Returns: Import result with statistics.
    """
    df = clean_module_df(df)
    validated_modules, errors = validate_module_df(df)
    nb_ok = 0
    for module_data in validated_modules:
        try:
            existing = session.exec(select(Module).where(Module.nom == module_data.nom)).first()
            if existing:
                existing.nombre_horaire = module_data.nombre_horaire
                existing.seuil_validation = module_data.seuil_validation
            else:
                session.add(Module.model_validate(module_data))
            nb_ok += 1
        except Exception:
            errors.append(f"Erreur DB pour {module_data.nom}")
            
    session.commit()
    log = ImportLog(nom_fichier=filename, type_donnees="modules", nb_lignes_ok=nb_ok, nb_lignes_rejet=len(errors), statut="Terminé")
    session.add(log)
    session.commit()
    
    return ImportResult(
        filename=filename,
        type_donnees="modules",
        nb_lignes_total=len(df),
        nb_lignes_ok=nb_ok,
        nb_lignes_rejet=len(errors),
        statut="Succès",
        message="Import des modules complété."
    )

def process_evaluation_import(df: pd.DataFrame, filename: str, session: Session) -> ImportResult:
    """
    Process evaluation data import.
    Returns: Import result with statistics.
    """
    db_modules = session.exec(select(Module)).all()
    df = clean_evaluation_df(df, session)
    valid_module_ids = {m.id for m in db_modules}
    validated_evals, errors = validate_evaluation_df(df, valid_module_ids)
    nb_ok = 0
    for eval_data in validated_evals:
        try:
            session.add(Evaluation.model_validate(eval_data))
            nb_ok += 1
        except Exception as e:
            errors.append(f"Erreur DB pour {eval_data.nom_eval}: {str(e)}")
            
    session.commit()
    log = ImportLog(nom_fichier=filename, type_donnees="evaluations", nb_lignes_ok=nb_ok, nb_lignes_rejet=len(errors), statut="Terminé")
    session.add(log)
    session.commit()
    
    return ImportResult(
        filename=filename,
        type_donnees="evaluations",
        nb_lignes_total=len(df),
        nb_lignes_ok=nb_ok,
        nb_lignes_rejet=len(errors),
        statut="Succès",
        message="Import des évaluations complété."
    )

def process_note_import(df: pd.DataFrame, filename: str, session: Session) -> ImportResult:
    """
    Process grade/note data import with duplicate handling.
    Returns: Import result with statistics.
    """
    df = clean_note_df(df, session)
    validated_notes, errors = validate_note_df(df, session)
    nb_ok = 0
    for note_data in validated_notes:
        try:
            existing = session.exec(select(Note).where(
                Note.id_etudiant == note_data.id_etudiant,
                Note.id_evaluation == note_data.id_evaluation
            )).first()
            if existing:
                existing.valeur = note_data.valeur
                existing.date_saisie = note_data.date_saisie
            else:
                session.add(Note.model_validate(note_data))
            nb_ok += 1
        except Exception:
            errors.append("Erreur lors de l'insertion d'une note.")
            
    session.commit()
    log = ImportLog(nom_fichier=filename, type_donnees="notes", nb_lignes_ok=nb_ok, nb_lignes_rejet=len(errors), statut="Terminé")
    session.add(log)
    session.commit()
    
    try:
        run_alert_detection(session)
    except Exception:
        pass
        
    return ImportResult(
        filename=filename,
        type_donnees="notes",
        nb_lignes_total=len(df),
        nb_lignes_ok=nb_ok,
        nb_lignes_rejet=len(errors),
        statut="Succès",
        message="Import des notes complété."
    )

def process_absence_import(df: pd.DataFrame, filename: str, session: Session) -> ImportResult:
    """
    Process absence data import.
    Returns: Import result with statistics.
    """
    df = clean_absence_df(df, session)
    validated_absences, errors = validate_absence_df(df, session)
    nb_ok = 0
    for absence_data in validated_absences:
        try:
            session.add(Absence.model_validate(absence_data))
            nb_ok += 1
        except Exception as e:
            errors.append(f"Erreur DB: {str(e)}")
            
    session.commit()
    log = ImportLog(nom_fichier=filename, type_donnees="absences", nb_lignes_ok=nb_ok, nb_lignes_rejet=len(errors), statut="Terminé")
    session.add(log)
    session.commit()
    
    try:
        run_alert_detection(session)
    except Exception:
        pass
        
    return ImportResult(
        filename=filename,
        type_donnees="absences",
        nb_lignes_total=len(df),
        nb_lignes_ok=nb_ok,
        nb_lignes_rejet=len(errors),
        statut="Succès",
        message="Import des absences complété."
    )

def process_retard_import(df: pd.DataFrame, filename: str, session: Session) -> ImportResult:
    """
    Process tardiness data import.
    Returns: Import result with statistics.
    """
    df = clean_retard_df(df, session)
    validated_retards, errors = validate_retard_df(df, session)
    nb_ok = 0
    for retard_data in validated_retards:
        try:
            session.add(Retard.model_validate(retard_data))
            nb_ok += 1
        except Exception as e:
            errors.append(f"Erreur DB: {str(e)}")
            
    session.commit()
    log = ImportLog(nom_fichier=filename, type_donnees="retards", nb_lignes_ok=nb_ok, nb_lignes_rejet=len(errors), statut="Terminé")
    session.add(log)
    session.commit()
    
    try:
        run_alert_detection(session)
    except Exception:
        pass
        
    return ImportResult(
        filename=filename,
        type_donnees="retards",
        nb_lignes_total=len(df),
        nb_lignes_ok=nb_ok,
        nb_lignes_rejet=len(errors),
        statut="Succès",
        message="Import des retards complété."
    )

def process_filiere_import(df: pd.DataFrame, filename: str, session: Session) -> ImportResult:
    """
    Process filiere data import.
    Returns: Import result with statistics.
    """
    df = clean_filiere_df(df)
    validated, errors = validate_filiere_df(df)
    nb_ok = 0
    for data in validated:
        try:
            existing = session.exec(select(Filiere).where(Filiere.nom_filiere == data['nom_filiere'])).first()
            if existing:
                for k, v in data.items():
                    setattr(existing, k, v)
            else:
                session.add(Filiere(**data))
            nb_ok += 1
        except Exception as e:
            errors.append(f"Erreur DB: {str(e)}")
    session.commit()
    return ImportResult(
        filename=filename,
        type_donnees="filieres",
        nb_lignes_total=len(df),
        nb_lignes_ok=nb_ok,
        nb_lignes_rejet=len(errors),
        statut="Succès",
        message="Import des filières complété."
    )

def process_classe_import(df: pd.DataFrame, filename: str, session: Session) -> ImportResult:
    """
    Process class data import.
    Returns: Import result with statistics.
    """
    df = clean_classe_df(df, session)
    filieres = session.exec(select(Filiere.id)).all()
    validated, errors = validate_classe_df(df, set(filieres))
    nb_ok = 0
    for data in validated:
        try:
            existing = session.exec(select(Classe).where(Classe.nom == data['nom'])).first()
            if existing:
                for k, v in data.items():
                    setattr(existing, k, v)
            else:
                session.add(Classe(**data))
            nb_ok += 1
        except Exception as e:
            errors.append(f"Erreur DB: {str(e)}")
    session.commit()
    return ImportResult(
        filename=filename,
        type_donnees="classes",
        nb_lignes_total=len(df),
        nb_lignes_ok=nb_ok,
        nb_lignes_rejet=len(errors),
        statut="Succès",
        message="Import des classes complété."
    )
