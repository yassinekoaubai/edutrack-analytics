import pandas as pd
from typing import List, Tuple, Set
from pydantic import ValidationError
from sqlmodel import Session
from schemas.note import NoteCreate
from schemas.module import ModuleCreate
from schemas.retard import RetardCreate
from schemas.absence import AbsenceCreate
from schemas.etudiant import EtudiantCreate
from schemas.evaluation import EvaluationCreate
from schemas.imports import (
    EtudiantImportRow,
    ModuleImportRow,
    EvaluationImportRow,
    NoteImportRow,
    AbsenceImportRow,
    RetardImportRow
)

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

def validate_module_df(df: pd.DataFrame) -> Tuple[List[ModuleCreate], List[str]]:
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

def validate_evaluation_df(df: pd.DataFrame, valid_module_ids: Set[int]) -> Tuple[List[EvaluationCreate], List[str]]:
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

def validate_note_df(df: pd.DataFrame, session: Session) -> Tuple[List[NoteCreate], List[str]]:
    validated = []
    errors = []
    # Convert to list of dicts, ensuring nulls are represented as None
    records = df.where(pd.notnull(df), None).to_dict(orient="records")

    for idx, record in enumerate(records):
        line_num = idx + 2 # Assuming header is line 1
        try:
            dirty = NoteImportRow(**record)

            # 1. Check Mandatory IDs
            if dirty.id_etudiant is None or pd.isna(dirty.id_etudiant):
                errors.append(f"Ligne {line_num}: Étudiant non trouvé ou ID manquant")
                continue
            if dirty.id_evaluation is None or pd.isna(dirty.id_evaluation):
                errors.append(f"Ligne {line_num}: Évaluation non trouvée ou ID manquant")
                continue

            # 2. Check Valeur (Float + Range) - Handle French decimal separator
            valeur_clean = None
            if record.get('valeur') is not None and record.get('valeur') != '':
                val = record['valeur']
                
                # Skip if explicitly null/empty
                if pd.isna(val) or val is None or str(val).strip() == '':
                    errors.append(f"Ligne {line_num}: Valeur de note invalide (non numérique)")
                    continue
                
                # Convert to string and handle French decimal separator (comma)
                val_str = str(val).strip()
                if not val_str or val_str.lower() in ['nan', 'none', 'n/a', 'na']:
                    errors.append(f"Ligne {line_num}: Valeur de note invalide (non numérique)")
                    continue
                
                try:
                    # Replace comma with dot for French decimal format
                    val_str = val_str.replace(',', '.')
                    valeur_float = float(val_str)
                    
                    if valeur_float < 0 or valeur_float > 20:
                        errors.append(f"Ligne {line_num}: Note hors range (doit être entre 0 et 20, reçu: {valeur_float})")
                        continue
                    valeur_clean = valeur_float
                except (ValueError, TypeError):
                    errors.append(f"Ligne {line_num}: Valeur de note invalide (non numérique)")
                    continue
            else:
                # If valeur is missing but other fields are valid, skip this row (no note value)
                errors.append(f"Ligne {line_num}: Valeur de note invalide (non numérique)")
                continue

            # 3. Create NoteCreate (triggers pydantic validation as safety)
            clean = NoteCreate(
                id_etudiant=int(dirty.id_etudiant),
                id_evaluation=int(dirty.id_evaluation),
                valeur=valeur_clean,
                date_saisie=dirty.date_saisie
            )
            validated.append(clean)

        except ValidationError as e:
            errors.append(f"Ligne {line_num}: {e.errors()[0]['msg']}")
        except (ValueError, TypeError) as e:
            errors.append(f"Ligne {line_num}: Donnée invalide - {str(e)}")
        except Exception as e:
            errors.append(f"Ligne {line_num}: Erreur inattendue - {str(e)}")

    return validated, errors

def validate_absence_df(df: pd.DataFrame, session: Session) -> Tuple[List[AbsenceCreate], List[str]]:
    validated = []
    errors = []
    records = df.where(pd.notnull(df), None).to_dict(orient="records")

    for idx, record in enumerate(records):
        try:
            dirty = AbsenceImportRow(**record)

            if dirty.id_etudiant is None or pd.isna(dirty.id_etudiant):
                errors.append(f"Ligne {idx + 2}: id_etudiant manquant")
                continue
            if dirty.id_module is None or pd.isna(dirty.id_module):
                errors.append(f"Ligne {idx + 2}: id_module manquant")
                continue
            if dirty.date_absence is None or pd.isna(dirty.date_absence):
                errors.append(f"Ligne {idx + 2}: date_absence manquante")
                continue

            clean = AbsenceCreate(
                id_etudiant=int(dirty.id_etudiant),
                id_module=int(dirty.id_module),
                date_absence=dirty.date_absence,
                nb_heures=float(dirty.nb_heures) if dirty.nb_heures is not None and pd.notna(dirty.nb_heures) else None,
                justifiee=bool(dirty.justifiee) if dirty.justifiee is not None else False,
                motif=str(dirty.motif).strip() if dirty.motif and pd.notna(dirty.motif) else None
            )
            validated.append(clean)
        except (KeyError, ValueError, TypeError, ValidationError) as e:
            errors.append(f"Ligne {idx + 2}: {str(e)}")

    return validated, errors

def validate_retard_df(df: pd.DataFrame, session: Session) -> Tuple[List[RetardCreate], List[str]]:
    validated = []
    errors = []
    records = df.where(pd.notnull(df), None).to_dict(orient="records")

    for idx, record in enumerate(records):
        try:
            # Make a mutable copy and try to infer/flexibly parse missing fields
            rec = dict(record)

            # 1) Try to infer date_retard from any parsable field if missing
            if rec.get('date_retard') is None:
                # common candidate keys
                for k in ['date', 'timestamp', 'datetime', 'date_retard', 'date_absence']:
                    if k in rec and rec.get(k) is not None:
                        parsed = pd.to_datetime(rec.get(k), errors='coerce', dayfirst=False)
                        if not pd.isna(parsed):
                            rec['date_retard'] = parsed
                            break
                # fallback: scan all values for a parsable datetime
                if rec.get('date_retard') is None:
                    for v in rec.values():
                        if isinstance(v, str) and any(ch.isdigit() for ch in v):
                            parsed = pd.to_datetime(v, errors='coerce', dayfirst=False)
                            if not pd.isna(parsed):
                                rec['date_retard'] = parsed
                                break

            # 2) Try to resolve id_etudiant from email_etudiant or numero_etudiant
            if rec.get('id_etudiant') is None and rec.get('email_etudiant'):
                try:
                    from db.models import Etudiant
                    em = str(rec.get('email_etudiant')).strip().lower()
                    row = session.exec(select(Etudiant.id).where(Etudiant.email == em)).first()
                    if row:
                        rec['id_etudiant'] = row
                except Exception:
                    pass

            # 3) Try to resolve id_module from code_module or nom_module
            if rec.get('id_module') is None and (rec.get('code_module') or rec.get('nom_module')):
                try:
                    from db.models import Module
                    if rec.get('code_module'):
                        code = str(rec.get('code_module')).strip().lower()
                        row = session.exec(select(Module.id).where(Module.code_module == code)).first()
                        if row:
                            rec['id_module'] = row
                    if rec.get('id_module') is None and rec.get('nom_module'):
                        # normalize simple comparison
                        nom = str(rec.get('nom_module')).strip().lower()
                        row = session.exec(select(Module.id).where(Module.nom_module == nom)).first()
                        if row:
                            rec['id_module'] = row
                except Exception:
                    pass

            # 4) Normalize duree_minutes (extract digits)
            if rec.get('duree_minutes') is not None and not pd.isna(rec.get('duree_minutes')):
                try:
                    rec['duree_minutes'] = int(str(rec.get('duree_minutes')).strip())
                except Exception:
                    # try to extract digits
                    import re
                    m = re.search(r"(\d+)", str(rec.get('duree_minutes')))
                    rec['duree_minutes'] = int(m.group(1)) if m else None

            # 5) Normalize justifie truthy values
            if rec.get('justifie') is not None and not pd.isna(rec.get('justifie')):
                j = str(rec.get('justifie')).strip().lower()
                if j in ['true', '1', 'oui', 'yes', 'vrai', 't']:
                    rec['justifie'] = True
                elif j in ['false', '0', 'non', 'no', 'f']:
                    rec['justifie'] = False

            dirty = RetardImportRow(**rec)

            # Now validate presence of mandatory foreign keys and date
            if dirty.id_etudiant is None or pd.isna(dirty.id_etudiant):
                errors.append(f"Ligne {idx + 2}: id_etudiant manquant")
                continue
            if dirty.id_module is None or pd.isna(dirty.id_module):
                errors.append(f"Ligne {idx + 2}: id_module manquant")
                continue
            if dirty.date_retard is None or pd.isna(dirty.date_retard):
                errors.append(f"Ligne {idx + 2}: date_retard manquante")
                continue

            clean = RetardCreate(
                id_etudiant=int(dirty.id_etudiant),
                id_module=int(dirty.id_module),
                date_retard=dirty.date_retard,
                duree_minutes=int(dirty.duree_minutes) if dirty.duree_minutes is not None and pd.notna(dirty.duree_minutes) else None,
                justifie=bool(dirty.justifie) if dirty.justifie is not None else False
            )
            validated.append(clean)
        except (KeyError, ValueError, TypeError, ValidationError) as e:
            errors.append(f"Ligne {idx + 2}: {str(e)}")

    return validated, errors