import pandas as pd
from typing import List, Tuple, Set
from pydantic import ValidationError
from sqlmodel import select, Session

from schemas.module import ModuleCreate
from schemas.evaluation import EvaluationCreate
from schemas.etudiant import EtudiantCreate
from schemas.note import NoteCreate
from schemas.imports import EtudiantImportRow, ModuleImportRow, EvaluationImportRow

def validate_etudiant_df(df: pd.DataFrame) -> Tuple[List[EtudiantCreate], List[str]]:
    records = df.where(pd.notnull(df), None).to_dict(orient="records")
    validated = []
    errors = []

    for idx, record in enumerate(records):
        try:
            dirty = EtudiantImportRow(**record)
            if not dirty.nom or not dirty.prenom or not dirty.email:
                errors.append(f"Ligne {idx + 2}: nom, prenom et email sont obligatoires")
                continue

            clean_data = {
                "nom": str(dirty.nom) if dirty.nom else None,
                "prenom": str(dirty.prenom) if dirty.prenom else None,
                "email": str(dirty.email) if dirty.email else None,
                "date_naissance": dirty.date_naissance,
                "statut": str(dirty.statut) if dirty.statut else "Actif",
                "annee_entree": int(dirty.annee_entree) if pd.notna(dirty.annee_entree) else None
            }
            clean = EtudiantCreate(**clean_data)
            validated.append(clean)

        except ValidationError as e:
            errors.append(f"Ligne {idx + 2}: {e.errors()[0]['msg']}")
        except Exception as e:
            errors.append(f"Ligne {idx + 2}: {str(e)}")

    return validated, errors

def validate_module_df(df: pd.DataFrame) -> tuple[List[ModuleCreate], List[str]]:
    validated = []
    errors = []
    records = df.where(pd.notnull(df), None).to_dict(orient="records")

    for idx, record in enumerate(records):
        try:
            dirty = ModuleImportRow(**record)
            if not dirty.nom or str(dirty.nom).strip() == '':
                errors.append(f"Ligne {idx + 2}: nom du module obligatoire")
                continue

            clean = ModuleCreate(
                nom=str(dirty.nom).strip(),
                nombre_horaire=int(dirty.nombre_horaire) if pd.notna(dirty.nombre_horaire) else None,
                seuil_validation=float(dirty.seuil_validation) if pd.notna(dirty.seuil_validation) else 10.0
            )
            validated.append(clean)
        except Exception as e:
            errors.append(f"Ligne {idx + 2}: {str(e)}")

    return validated, errors

def validate_evaluation_df(df: pd.DataFrame, valid_module_ids: Set[int]) -> tuple[List[EvaluationCreate], List[str]]:
    validated = []
    errors = []
    records = df.where(pd.notnull(df), None).to_dict(orient="records")

    for idx, record in enumerate(records):
        try:
            dirty = EvaluationImportRow(**record)
            if not dirty.id_module or pd.isna(dirty.id_module):
                errors.append(f"Ligne {idx + 2}: id_module manquant ou module non trouvé par son nom")
                continue
            
            mod_id = int(dirty.id_module)
            if mod_id not in valid_module_ids:
                errors.append(f"Ligne {idx + 2}: id_module {mod_id} n'existe pas")
                continue

            clean = EvaluationCreate(
                id_module=mod_id,
                nom_eval=str(dirty.nom_eval).strip() if pd.notna(dirty.nom_eval) else None,
                date_prevue=dirty.date_prevue,
                coefficient_eval=float(dirty.coefficient_eval) if pd.notna(dirty.coefficient_eval) else 1.0,
                semestre=str(dirty.semestre).strip() if pd.notna(dirty.semestre) else None
            )
            validated.append(clean)
        except Exception as e:
            errors.append(f"Ligne {idx + 2}: {str(e)}")

    return validated, errors

def validate_note_df(df: pd.DataFrame, session: Session) -> tuple[list[NoteCreate], list[str]]:
    from db.models import Etudiant, Evaluation

    validated = []
    errors = []
    records = df.where(pd.notnull(df), None).to_dict(orient="records")

    valid_etudiant_ids = set(session.exec(select(Etudiant.id)).all())
    valid_eval_ids = set(session.exec(select(Evaluation.id)).all())

    for idx, record in enumerate(records):
        try:
            id_etudiant = record.get('id_etudiant')
            id_eval = record.get('id_evaluation')
            valeur = record.get('valeur')

            if id_etudiant is None:
                errors.append(f"Ligne {idx + 2}: id_etudiant manquant")
                continue
            if id_eval is None:
                errors.append(f"Ligne {idx + 2}: id_evaluation manquant")
                continue

            id_etudiant = int(id_etudiant)
            id_eval = int(id_eval)

            if id_etudiant not in valid_etudiant_ids:
                errors.append(f"Ligne {idx + 2}: id_etudiant {id_etudiant} n'existe pas")
                continue
            if id_eval not in valid_eval_ids:
                errors.append(f"Ligne {idx + 2}: id_evaluation {id_eval} n'existe pas")
                continue

            # FIX: passe None si valeur est None/NaN
            valeur_clean = None
            if valeur is not None and not pd.isna(valeur):
                valeur_clean = float(valeur)

            clean = NoteCreate(
                id_etudiant=id_etudiant,
                id_evaluation=id_eval,
                valeur=valeur_clean,
                date_saisie=record.get('date_saisie')
            )
            validated.append(clean)
        except Exception as e:
            errors.append(f"Ligne {idx + 2}: {str(e)}")

    return validated, errors