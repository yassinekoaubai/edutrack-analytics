import pandas as pd
from typing import List, Tuple, Set
from pydantic import ValidationError
from sqlmodel import Session
from schemas import (
    EtudiantBase, ImportResult
)

def validate_etudiant_df(df: pd.DataFrame) -> Tuple[List[EtudiantBase], List[str]]:
    """
    Validates student data from a DataFrame.
    Returns: Tuple of validated student objects and list of error messages.
    """
    records = df.where(pd.notnull(df), None).to_dict(orient="records")
    validated = []
    errors = []

    for idx, record in enumerate(records):
        try:
            if not record.get('nom') or not record.get('prenom') or not record.get('email'):
                errors.append(f"Ligne {idx + 2}: nom, prenom et email sont obligatoires")
                continue

            clean = EtudiantBase.model_validate(record)
            validated.append(clean)
        except ValidationError as e:
            errors.append(f"Ligne {idx + 2}: {e.errors()[0]['msg']}")
        except Exception as e:
            errors.append(f"Ligne {idx + 2}: {str(e)}")

    return validated, errors

def validate_module_df(df: pd.DataFrame) -> Tuple[List[dict], List[str]]:
    """
    Validates module data from a DataFrame.
    Returns: Tuple of validated module dicts and list of error messages.
    """
    validated = []
    errors = []
    records = df.where(pd.notnull(df), None).to_dict(orient="records")

    for idx, record in enumerate(records):
        try:
            if not record.get('nom') or str(record.get('nom')).strip() == '':
                errors.append(f"Ligne {idx + 2}: nom du module obligatoire")
                continue

            validated.append({
                "nom": str(record.get('nom')).strip(),
                "nombre_horaire": record.get('nombre_horaire'),
                "seuil_validation": record.get('seuil_validation', 10.0)
            })
        except Exception as e:
            errors.append(f"Ligne {idx + 2}: {str(e)}")

    return validated, errors

def validate_evaluation_df(df: pd.DataFrame, valid_module_ids: Set[int]) -> Tuple[List[dict], List[str]]:
    """
    Validates evaluation data from a DataFrame.
    Returns: Tuple of validated evaluation dicts and list of error messages.
    """
    validated = []
    errors = []
    records = df.where(pd.notnull(df), None).to_dict(orient="records")

    for idx, record in enumerate(records):
        try:
            mod_id = record.get('id_module')
            if not mod_id or pd.isna(mod_id):
                errors.append(f"Ligne {idx + 2}: id_module manquant")
                continue

            if int(mod_id) not in valid_module_ids:
                errors.append(f"Ligne {idx + 2}: id_module {mod_id} n'existe pas")
                continue

            validated.append({
                "id_module": int(mod_id),
                "nom_eval": record.get('nom_eval'),
                "date_prevue": record.get('date_prevue'),
                "coefficient_eval": record.get('coefficient_eval', 1.0),
                "semestre": record.get('semestre')
            })
        except Exception as e:
            errors.append(f"Ligne {idx + 2}: {str(e)}")

    return validated, errors

def validate_note_df(df: pd.DataFrame, session: Session) -> Tuple[List[dict], List[str]]:
    """
    Validates student grade data from a DataFrame.
    Returns: Tuple of validated note dicts and list of error messages.
    """
    validated = []
    errors = []
    records = df.where(pd.notnull(df), None).to_dict(orient="records")

    for idx, record in enumerate(records):
        line_num = idx + 2
        try:
            if record.get('id_etudiant') is None:
                errors.append(f"Ligne {line_num}: Étudiant non trouvé")
                continue
            if record.get('id_evaluation') is None:
                errors.append(f"Ligne {line_num}: Évaluation non trouvée")
                continue

            val = record.get('valeur')
            if val is None or str(val).strip() == '':
                errors.append(f"Ligne {line_num}: Valeur de note manquante")
                continue

            try:
                valeur_float = float(str(val).replace(',', '.'))
                if valeur_float < 0 or valeur_float > 20:
                    errors.append(f"Ligne {line_num}: Note hors limites (0-20)")
                    continue
                
                validated.append({
                    "id_etudiant": int(record['id_etudiant']),
                    "id_evaluation": int(record['id_evaluation']),
                    "valeur": valeur_float,
                    "date_saisie": record.get('date_saisie')
                })
            except (ValueError, TypeError):
                errors.append(f"Ligne {line_num}: Valeur de note invalide")
        except Exception as e:
            errors.append(f"Ligne {line_num}: {str(e)}")

    return validated, errors

def validate_absence_df(df: pd.DataFrame, session: Session) -> Tuple[List[dict], List[str]]:
    """
    Validates student absence data from a DataFrame.
    Returns: Tuple of validated absence dicts and list of error messages.
    """
    validated = []
    errors = []
    records = df.where(pd.notnull(df), None).to_dict(orient="records")

    for idx, record in enumerate(records):
        try:
            if record.get('id_etudiant') is None or record.get('id_module') is None or record.get('date_absence') is None:
                errors.append(f"Ligne {idx + 2}: Données obligatoires manquantes (étudiant, module ou date)")
                continue

            validated.append({
                "id_etudiant": int(record['id_etudiant']),
                "id_module": int(record['id_module']),
                "date_absence": record['date_absence'],
                "nb_heures": record.get('nb_heures'),
                "justifiee": bool(record.get('justifiee', False)),
                "motif": record.get('motif')
            })
        except Exception as e:
            errors.append(f"Ligne {idx + 2}: {str(e)}")

    return validated, errors

def validate_retard_df(df: pd.DataFrame, session: Session) -> Tuple[List[dict], List[str]]:
    """
    Validates student tardiness data from a DataFrame.
    Returns: Tuple of validated tardiness dicts and list of error messages.
    """
    validated = []
    errors = []
    records = df.where(pd.notnull(df), None).to_dict(orient="records")

    for idx, record in enumerate(records):
        try:
            if record.get('id_etudiant') is None or record.get('id_module') is None or record.get('date_retard') is None:
                errors.append(f"Ligne {idx + 2}: Données obligatoires manquantes (étudiant, module ou date)")
                continue

            validated.append({
                "id_etudiant": int(record['id_etudiant']),
                "id_module": int(record['id_module']),
                "date_retard": record['date_retard'],
                "duree_minutes": record.get('duree_minutes'),
                "justifie": bool(record.get('justifie', False))
            })
        except Exception as e:
            errors.append(f"Ligne {idx + 2}: {str(e)}")

    return validated, errors

def validate_filiere_df(df: pd.DataFrame) -> Tuple[List[dict], List[str]]:
    """
    Validates academic branch (filiere) data.
    Returns: Tuple of validated filiere dicts and list of error messages.
    """
    validated = []
    errors = []
    for idx, row in df.iterrows():
        try:
            data = row.to_dict()
            if not data.get('nom_filiere'):
                errors.append(f"Ligne {idx + 2}: Nom de filière manquant")
                continue
            validated.append(data)
        except Exception as e:
            errors.append(f"Ligne {idx + 2}: {str(e)}")
    return validated, errors

def validate_classe_df(df: pd.DataFrame, valid_filiere_ids: Set[int]) -> Tuple[List[dict], List[str]]:
    """
    Validates class data.
    Returns: Tuple of validated class dicts and list of error messages.
    """
    validated = []
    errors = []
    for idx, row in df.iterrows():
        try:
            data = row.to_dict()
            if not data.get('nom'):
                errors.append(f"Ligne {idx + 2}: Nom de classe manquant")
                continue
            if data.get('id_filiere') is not None and int(data['id_filiere']) not in valid_filiere_ids:
                errors.append(f"Ligne {idx + 2}: Filière inconnue")
                continue
            validated.append(data)
        except Exception as e:
            errors.append(f"Ligne {idx + 2}: {str(e)}")
    return validated, errors
