from .validation import validate_etudiant_df, validate_module_df, validate_evaluation_df, validate_note_df
from .cleaning import clean_etudiant_df, clean_module_df, clean_evaluation_df, clean_note_df
from db.models import Etudiant, ImportLog, Module, Evaluation, Note
from schemas.imports import ModuleImportRow, ImportResult
from schemas.module import ModuleCreate
from sqlmodel import Session, select
import pandas as pd

def process_etudiant_import(df: pd.DataFrame, filename: str, session: Session) -> ImportResult:
    # 1. Cleaning
    df = clean_etudiant_df(df)

    # 2. Validation
    validated_students, errors = validate_etudiant_df(df)

    # 3. Insert BDD
    nb_ok = 0
    for student_data in validated_students:
        try:
            db_student = Etudiant.model_validate(student_data)
            session.add(db_student)
            nb_ok += 1
        except Exception:
            errors.append(f"Erreur DB pour {student_data.email}")

    session.commit()

    # 4. Historique des imports - Section 2.1
    log = ImportLog(
        nom_fichier=filename,
        type_donnees="etudiants",
        nb_lignes_ok=nb_ok,
        nb_lignes_rejet=len(errors),
        statut="Terminé"
    )
    session.add(log)
    session.commit()

    return ImportResult(
        nb_lignes_ok=nb_ok,
        nb_lignes_rejet=len(errors),
        erreurs=errors[:10],
        message="Import terminé"
    )



def process_module_import(df: pd.DataFrame, filename: str, session: Session) -> ImportResult:
    # 1. Cleaning - Section 2.1
    df = clean_module_df(df)

    # 2. Validation - Même pattern que etudiants
    validated_modules, errors = validate_module_df(df)

    # 3. Insert BDD
    nb_ok = 0
    for module_data in validated_modules:
        try:
            db_module = Module.model_validate(module_data)
            session.add(db_module)
            nb_ok += 1
        except Exception:
            errors.append(f"Erreur DB pour {module_data.nom}")

    session.commit()

    # 4. Historique des imports - Section 2.1
    log = ImportLog(
        nom_fichier=filename,
        type_donnees="modules",
        nb_lignes_ok=nb_ok,
        nb_lignes_rejet=len(errors),
        statut="Terminé"
    )
    session.add(log)
    session.commit()

    return ImportResult(
        nb_lignes_ok=nb_ok,
        nb_lignes_rejet=len(errors),
        erreurs=errors[:10],
        message="Import terminé"
    )


def process_evaluation_import(df: pd.DataFrame, filename: str, session: Session) -> ImportResult:
    # DEBUG: Check DB modules
    db_modules = session.exec(select(Module)).all()
    print(f"DEBUG: Found {len(db_modules)} modules in database.")
    for m in db_modules[:5]:
        print(f"DEBUG: DB Module: ID={m.id}, Name='{m.nom}'")

    # 1. Cleaning - Section 2.1
    print(f"DEBUG: Input DF columns: {df.columns.tolist()}")
    df = clean_evaluation_df(df, session)
    print(f"DEBUG: After cleaning, 'id_module' in DF? {'id_module' in df.columns}")
    if 'id_module' in df.columns:
        print(f"DEBUG: id_module head: {df['id_module'].head().tolist()}")

    # 2. Validation - Fetch valid IDs for check
    valid_module_ids = {m.id for m in db_modules}
    validated_evals, errors = validate_evaluation_df(df, valid_module_ids)

    # 3. Insert BDD
    nb_ok = 0
    for eval_data in validated_evals:
        try:
            db_eval = Evaluation.model_validate(eval_data)
            session.add(db_eval)
            nb_ok += 1
        except Exception as e:
            errors.append(f"Erreur DB pour {eval_data.nom_eval}: {str(e)}")

    session.commit()

    # 4. Log
    log = ImportLog(
        nom_fichier=filename,
        type_donnees="evaluations",
        nb_lignes_ok=nb_ok,
        nb_lignes_rejet=len(errors),
        statut="Terminé"
    )
    session.add(log)
    session.commit()

    return ImportResult(
        nb_lignes_ok=nb_ok,
        nb_lignes_rejet=len(errors),
        erreurs=errors[:10],
        message="Import terminé"
    )

def process_note_import(df: pd.DataFrame, filename: str, session: Session) -> ImportResult:
    df = clean_note_df(df, session)

    # DEBUG
    print("=== NOTES APRES CLEANING ===")
    print(df[['id_etudiant', 'id_evaluation', 'valeur']].head())

    validated_notes, errors = validate_note_df(df, session)

    nb_ok = 0
    for note_data in validated_notes:
        try:
            db_note = Note.model_validate(note_data)
            session.add(db_note)
            nb_ok += 1
        except Exception as e:
            errors.append(f"Erreur DB: {str(e)}")

    session.commit()

    log = ImportLog(
        nom_fichier=filename,
        type_donnees="notes",
        nb_lignes_ok=nb_ok,
        nb_lignes_rejet=len(errors),
        statut="Terminé"
    )
    session.add(log)
    session.commit()

    return ImportResult(
        nb_lignes_ok=nb_ok,
        nb_lignes_rejet=len(errors),
        erreurs=errors[:10],
        message="Import terminé"
    )