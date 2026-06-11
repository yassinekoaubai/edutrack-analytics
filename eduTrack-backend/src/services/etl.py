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
from db.models import Etudiant, ImportLog, Module, Evaluation, Note, Absence, Retard, Filiere, Classe
from schemas.imports import ModuleImportRow, ImportResult
from schemas.module import ModuleCreate
from sqlmodel import Session, select
import pandas as pd
from sqlalchemy.dialects.postgresql import insert

def process_etudiant_import(df: pd.DataFrame, filename: str, session: Session) -> ImportResult:
    df = clean_etudiant_df(df)
    validated_students, errors = validate_etudiant_df(df)
    nb_ok = 0
    for student_data in validated_students:
        try:
            # Upsert on email
            stmt = insert(Etudiant).values(student_data.model_dump())
            stmt = stmt.on_conflict_do_update(
                index_elements=['email'],
                set_={
                    'nom': stmt.excluded.nom,
                    'prenom': stmt.excluded.prenom,
                    'statut': stmt.excluded.statut,
                    'annee_entree': stmt.excluded.annee_entree,
                    'date_naissance': stmt.excluded.date_naissance
                }
            )
            session.execute(stmt)
            nb_ok += 1
        except Exception as e:
            errors.append(f"Erreur DB pour {student_data.email}: {e}")
    session.commit()
    log = ImportLog(nom_fichier=filename, type_donnees="etudiants", nb_lignes_ok=nb_ok, nb_lignes_rejet=len(errors), statut="Terminé")
    session.add(log)
    session.commit()
    try:
        run_alert_detection(session)
    except Exception as e:
        print(f"WARNING: Alert detection failed: {e}")
    return ImportResult(nb_lignes_ok=nb_ok, nb_lignes_rejet=len(errors), erreurs=errors[:10], message="Import terminé")

def process_module_import(df: pd.DataFrame, filename: str, session: Session) -> ImportResult:
    df = clean_module_df(df)
    validated_modules, errors = validate_module_df(df)
    nb_ok = 0
    for module_data in validated_modules:
        try:
            # Upsert on nom (assuming unique or logic)
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
    return ImportResult(nb_lignes_ok=nb_ok, nb_lignes_rejet=len(errors), erreurs=errors[:10], message="Import terminé")

def process_evaluation_import(df: pd.DataFrame, filename: str, session: Session) -> ImportResult:
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
    return ImportResult(nb_lignes_ok=nb_ok, nb_lignes_rejet=len(errors), erreurs=errors[:10], message="Import terminé")

def process_note_import(df: pd.DataFrame, filename: str, session: Session) -> ImportResult:
    df = clean_note_df(df, session)
    validated_notes, errors = validate_note_df(df, session)
    nb_ok = 0
    if validated_notes:
        values = [n.model_dump() for n in validated_notes]
        stmt = insert(Note).values(values)
        stmt = stmt.on_conflict_do_update(
            index_elements=['id_etudiant', 'id_evaluation'],
            set_={'valeur': stmt.excluded.valeur, 'date_saisie': stmt.excluded.date_saisie}
        )
        result = session.execute(stmt)
        session.commit()
        nb_ok = max(0, result.rowcount) 
    log = ImportLog(nom_fichier=filename, type_donnees="notes", nb_lignes_ok=nb_ok, nb_lignes_rejet=len(errors), statut="Terminé")
    session.add(log)
    session.commit()
    try:
        run_alert_detection(session)
    except Exception as e:
        print(f"WARNING: Alert detection failed: {e}")
    return ImportResult(nb_lignes_ok=nb_ok, nb_lignes_rejet=len(errors), erreurs=errors[:10])

def process_absence_import(df: pd.DataFrame, filename: str, session: Session) -> ImportResult:
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
    except Exception as e:
        print(f"WARNING: Alert detection failed: {e}")
    return ImportResult(nb_lignes_ok=nb_ok, nb_lignes_rejet=len(errors), erreurs=errors[:10])

def process_retard_import(df: pd.DataFrame, filename: str, session: Session) -> ImportResult:
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
    except Exception as e:
        print(f"WARNING: Alert detection failed: {e}")
    return ImportResult(nb_lignes_ok=nb_ok, nb_lignes_rejet=len(errors), erreurs=errors[:10])

def process_filiere_import(df: pd.DataFrame, filename: str, session: Session) -> ImportResult:
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
    return ImportResult(nb_lignes_ok=nb_ok, nb_lignes_rejet=len(errors), erreurs=errors[:10])

def process_classe_import(df: pd.DataFrame, filename: str, session: Session) -> ImportResult:
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
    return ImportResult(nb_lignes_ok=nb_ok, nb_lignes_rejet=len(errors), erreurs=errors[:10])
