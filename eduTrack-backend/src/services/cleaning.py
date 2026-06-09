from db.session import Session
from db.models import Module, Etudiant, Evaluation
from sqlmodel import select
import pandas as pd
import numpy as np
import unicodedata
from datetime import datetime, timezone

def normalize_string(s: str) -> str:
    """Normalise une chaîne: minuscule, sans accents, sans espaces superflus."""
    if not isinstance(s, str):
        return ""
    # Enlever accents
    s = unicodedata.normalize('NFD', s)
    s = "".join([c for c in s if unicodedata.category(c) != 'Mn'])
    return s.strip().lower()

def clean_etudiant_df(df: pd.DataFrame) -> pd.DataFrame:
    # 1. Normalisation colonnes
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace('-', '_')
    df = df.rename(columns={
        'e_mail': 'email', 'e-mail': 'email', 'mail': 'email',
        'date_de_naissance': 'date_naissance',
        'annee_d_entree': 'annee_entree', 'année_entrée': 'annee_entree'
    })

    # 2. Suppression doublons sur email
    if 'email' in df.columns:
        df = df.drop_duplicates(subset=['email'], keep='first')

    # 3. Normalisation strings
    for col in ['nom', 'prenom', 'statut', 'email']:
        if col in df.columns:
            df[col] = df[col].replace({np.nan: None})
            df[col] = df[col].apply(lambda x: str(x).strip() if x is not None else None)
            if col == 'nom' and 'nom' in df.columns:
                df['nom'] = df['nom'].str.upper()
            elif col == 'prenom' and 'prenom' in df.columns:
                df['prenom'] = df['prenom'].str.title()
            elif col == 'email' and 'email' in df.columns:
                df['email'] = df['email'].str.lower()

    df['statut'] = df.get('statut', 'Actif')
    if isinstance(df['statut'], pd.Series):
        df['statut'] = df['statut'].fillna('Actif')

    # 4. DATES: Enlever dayfirst=True pour éviter les warnings si le format est ambigu
    if 'date_naissance' in df.columns:
        df['date_naissance'] = pd.to_datetime(df['date_naissance'], errors='coerce').dt.date

    # 5. ANNEE_ENTREE
    if 'annee_entree' in df.columns:
        df['annee_entree'] = pd.to_datetime(df['annee_entree'], errors='coerce').dt.year
        df['annee_entree'] = df['annee_entree'].astype('Int64')

    return df

def clean_module_df(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
    df = df.rename(columns={
        'seuil': 'seuil_validation',
        'nb_heures': 'nombre_horaire',
        'nom_module': 'nom'
    })

    df = df.dropna(subset=['nom'])
    df = df[df['nom'].astype(str).str.strip()!= '']
    df = df.drop_duplicates(subset=['nom'], keep='first')
    df['nom'] = df['nom'].astype(str).str.strip().str.title()

    if 'nombre_horaire' in df.columns:
        df['nombre_horaire'] = pd.to_numeric(df['nombre_horaire'], errors='coerce').astype('Int64')
    else:
        df['nombre_horaire'] = None

    if 'seuil_validation' in df.columns:
        df['seuil_validation'] = pd.to_numeric(df['seuil_validation'], errors='coerce')

    return df

def clean_evaluation_df(df: pd.DataFrame, session: Session) -> pd.DataFrame:
    # 1. Normalisation colonnes
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace('-', '_')
    
    # Mapping flexible
    df = df.rename(columns={
        'idmodule': 'id_module', 'module_id': 'id_module', 'id_du_module': 'id_module',
        'nom_module': 'module', 'nom_du_module': 'module',
        'date_prévue': 'date_prevue', 'date': 'date_prevue',
        'coeff': 'coefficient_eval', 'coefficient': 'coefficient_eval',
        'nom_evaluation': 'nom_eval', 'nom_eval': 'nom_eval', 'nom_de_l_evaluation': 'nom_eval'
    })

    # 2. Resolution logic
    if 'module' in df.columns:
        modules_db = session.exec(select(Module)).all()
        module_name_map = {normalize_string(m.nom): m.id for m in modules_db}
        df_module_names = df['module'].apply(normalize_string)
        
        if 'id_module' not in df.columns:
            df['id_module'] = df_module_names.map(module_name_map)
        else:
            df['id_module'] = df['id_module'].fillna(df_module_names.map(module_name_map))

    # Convert to numeric
    if 'id_module' in df.columns:
        df['id_module'] = pd.to_numeric(df['id_module'], errors='coerce')

    # 3. Dates
    if 'date_prevue' in df.columns:
        df['date_prevue'] = pd.to_datetime(df['date_prevue'], errors='coerce').dt.date

    # 4. Coefficient
    if 'coefficient_eval' in df.columns:
        df['coefficient_eval'] = pd.to_numeric(df['coefficient_eval'], errors='coerce').fillna(1.0)
    else:
        df['coefficient_eval'] = 1.0

    # 5. Normalisation strings
    for col in ['nom_eval', 'semestre']:
        if col in df.columns:
            df[col] = df[col].replace({np.nan: None, 'nan': None, 'N/A': None, '': None, 'None': None})
            df[col] = df[col].apply(lambda x: str(x).strip() if x is not None else None)

    # 6. Truncate
    if 'semestre' in df.columns:
        df.loc[df['semestre'].str.len() > 10, 'semestre'] = df['semestre'].str.slice(0, 10)
    if 'nom_eval' in df.columns:
        df.loc[df['nom_eval'].str.len() > 100, 'nom_eval'] = df['nom_eval'].str.slice(0, 100)

    return df

def clean_note_df(df: pd.DataFrame, session: Session) -> pd.DataFrame:
    # 1. Normalisation colonnes
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace('-', '_')
    
    # Mapping flexible
    df = df.rename(columns={
        'étudiant': 'email_etudiant', 'email': 'email_etudiant', 'id_etudiant': 'id_etudiant',
        'evaluation': 'nom_evaluation', 'nom_eval': 'nom_evaluation', 'id_evaluation': 'id_evaluation',
        'note': 'valeur', 'valeur': 'valeur'
    })

    # Nettoyage global
    df = df.replace({np.nan: None, 'nan': None, 'N/A': None, '': None, 'None': None, 'error:.*': None}, regex=True)

    # Resolution id_etudiant via email
    if 'email_etudiant' in df.columns:
        etudiants_db = session.exec(select(Etudiant.email, Etudiant.id)).all()
        etudiant_map = {str(e.email).strip().lower(): e.id for e in etudiants_db if e.email}
        df_emails = df['email_etudiant'].astype(str).str.strip().str.lower()
        if 'id_etudiant' not in df.columns:
            df['id_etudiant'] = df_emails.map(etudiant_map)
        else:
            df['id_etudiant'] = df['id_etudiant'].fillna(df_emails.map(etudiant_map))

    # Resolution id_evaluation via nom
    if 'nom_evaluation' in df.columns:
        evals_db = session.exec(select(Evaluation.nom_eval, Evaluation.id)).all()
        eval_map = {normalize_string(ev.nom_eval): ev.id for ev in evals_db if ev.nom_eval}
        df_eval_names = df['nom_evaluation'].apply(normalize_string)
        if 'id_evaluation' not in df.columns:
            df['id_evaluation'] = df_eval_names.map(eval_map)
        else:
            df['id_evaluation'] = df['id_evaluation'].fillna(df_eval_names.map(eval_map))

    # Supprimer lignes sans IDs
    df = df.dropna(subset=['id_etudiant', 'id_evaluation'])
    df['id_etudiant'] = df['id_etudiant'].astype(int)
    df['id_evaluation'] = df['id_evaluation'].astype(int)

    # 3. Valeur note
    if 'valeur' in df.columns:
        df['valeur'] = pd.to_numeric(df['valeur'], errors='coerce')
        df.loc[(df['valeur'] < 0) | (df['valeur'] > 20), 'valeur'] = None
        df['valeur'] = df['valeur'].round(2)

    # 4. Date saisie
    if 'date_saisie' in df.columns:
        df['date_saisie'] = pd.to_datetime(df['date_saisie'], errors='coerce')
    else:
        df['date_saisie'] = datetime.now(timezone.utc)

    return df
