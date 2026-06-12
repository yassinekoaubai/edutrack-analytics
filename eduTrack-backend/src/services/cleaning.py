import pandas as pd
import numpy as np
import unicodedata
from datetime import datetime, timezone
from sqlmodel import Session, select
from models import Module, Etudiant, Filiere, Evaluation

def normalize_string(s: str) -> str:
    """
    Normalizes a string by converting to lowercase, removing accents, and stripping whitespace.
    Returns: Normalized string.
    """
    if not isinstance(s, str):
        return ""
    s = unicodedata.normalize('NFD', s)
    s = "".join([c for c in s if unicodedata.category(c) != 'Mn'])
    return s.strip().lower()

def clean_etudiant_df(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans student DataFrame: normalizes columns, removes duplicates, and formats data types.
    Returns: Cleaned DataFrame.
    """
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace('-', '_')
    df = df.rename(columns={
        'e_mail': 'email', 'e-mail': 'email', 'mail': 'email',
        'date_de_naissance': 'date_naissance',
        'annee_d_entree': 'annee_entree', 'année_entrée': 'annee_entree'
    })

    if 'email' in df.columns:
        df = df.drop_duplicates(subset=['email'], keep='first')

    for col in ['nom', 'prenom', 'statut', 'email']:
        if col in df.columns:
            df[col] = df[col].where(pd.isna(df[col]), df[col].astype(str).str.strip())
            if col == 'nom':
                df['nom'] = df['nom'].where(df['nom'].isna(), df['nom'].str.upper())
            elif col == 'prenom':
                df['prenom'] = df['prenom'].where(df['prenom'].isna(), df['prenom'].str.title())
            elif col == 'email':
                df['email'] = df['email'].where(df['email'].isna(), df['email'].str.lower())

    required_cols = [c for c in ['nom', 'prenom', 'statut', 'email'] if c in df.columns]
    if required_cols:
        df = df.dropna(subset=required_cols)

    df['statut'] = df.get('statut', 'Actif')
    if isinstance(df['statut'], pd.Series):
        df['statut'] = df['statut'].fillna('Actif')

    if 'date_naissance' in df.columns:
        df['date_naissance'] = pd.to_datetime(df['date_naissance'], errors='coerce').dt.date

    if 'annee_entree' in df.columns:
        df['annee_entree'] = pd.to_datetime(df['annee_entree'], errors='coerce').dt.year
        df['annee_entree'] = df['annee_entree'].astype('Int64')

    return df

def clean_module_df(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans module DataFrame.
    Returns: Cleaned DataFrame.
    """
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
    """
    Cleans evaluation DataFrame and maps module names to IDs.
    Returns: Cleaned DataFrame.
    """
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace('-', '_')
    
    df = df.rename(columns={
        'idmodule': 'id_module', 'module_id': 'id_module', 'id_du_module': 'id_module',
        'nom_module': 'module', 'nom_du_module': 'module',
        'date_prévue': 'date_prevue', 'date': 'date_prevue',
        'coeff': 'coefficient_eval', 'coefficient': 'coefficient_eval',
        'nom_evaluation': 'nom_eval', 'nom_eval': 'nom_eval', 'nom_de_l_evaluation': 'nom_eval'
    })

    if 'module' in df.columns:
        modules_db = session.exec(select(Module)).all()
        module_name_map = {normalize_string(m.nom): m.id for m in modules_db}
        df_module_names = df['module'].apply(normalize_string)
        
        if 'id_module' not in df.columns:
            df['id_module'] = df_module_names.map(module_name_map)
        else:
            df['id_module'] = df['id_module'].fillna(df_module_names.map(module_name_map))

    if 'id_module' in df.columns:
        df['id_module'] = pd.to_numeric(df['id_module'], errors='coerce')

    if 'date_prevue' in df.columns:
        df['date_prevue'] = pd.to_datetime(df['date_prevue'], errors='coerce').dt.date

    if 'coefficient_eval' in df.columns:
        df['coefficient_eval'] = pd.to_numeric(df['coefficient_eval'], errors='coerce').fillna(1.0)
    else:
        df['coefficient_eval'] = 1.0

    for col in ['nom_eval', 'semestre']:
        if col in df.columns:
            df[col] = df[col].replace({np.nan: None, 'nan': None, 'N/A': None, '': None, 'None': None})
            df[col] = df[col].apply(lambda x: str(x).strip() if x is not None else None)

    if 'semestre' in df.columns:
        df.loc[df['semestre'].str.len() > 10, 'semestre'] = df['semestre'].str.slice(0, 10)
    if 'nom_eval' in df.columns:
        df.loc[df['nom_eval'].str.len() > 100, 'nom_eval'] = df['nom_eval'].str.slice(0, 100)

    return df

def clean_note_df(df: pd.DataFrame, session: Session) -> pd.DataFrame:
    """
    Cleans grade/note DataFrame and maps students and evaluations to IDs.
    Returns: Cleaned DataFrame.
    """
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace('-', '_')
    
    df = df.rename(columns={
        'étudiant': 'email_etudiant', 'email': 'email_etudiant', 'id_etudiant': 'id_etudiant',
        'evaluation': 'nom_evaluation', 'nom_eval': 'nom_evaluation', 'id_evaluation': 'id_evaluation',
        'note': 'valeur', 'valeur': 'valeur'
    })

    df = df.replace({np.nan: None, 'nan': None, 'N/A': None, '': None, 'None': None, 'error:.*': None}, regex=True)

    if 'email_etudiant' in df.columns:
        etudiants_db = session.exec(select(Etudiant.email, Etudiant.id)).all()
        etudiant_map = {str(e.email).strip().lower(): e.id for e in etudiants_db if e.email}
        df_emails = df['email_etudiant'].astype(str).str.strip().str.lower()
        if 'id_etudiant' not in df.columns:
            df['id_etudiant'] = df_emails.map(etudiant_map)
        else:
            df['id_etudiant'] = df['id_etudiant'].fillna(df_emails.map(etudiant_map))

    if 'nom_evaluation' in df.columns:
        evals_db = session.exec(select(Evaluation.nom_eval, Evaluation.id)).all()
        eval_map = {normalize_string(ev.nom_eval): ev.id for ev in evals_db if ev.nom_eval}
        df_eval_names = df['nom_evaluation'].apply(normalize_string)
        if 'id_evaluation' not in df.columns:
            df['id_evaluation'] = df_eval_names.map(eval_map)
        else:
            df['id_evaluation'] = df['id_evaluation'].fillna(df_eval_names.map(eval_map))

    if 'id_etudiant' in df.columns:
        df['id_etudiant'] = pd.to_numeric(df['id_etudiant'], errors='coerce')
    if 'id_evaluation' in df.columns:
        df['id_evaluation'] = pd.to_numeric(df['id_evaluation'], errors='coerce')

    if 'valeur' in df.columns:
        df['valeur'] = df['valeur'].astype(str).str.replace(',', '.', regex=False)
        df['valeur'] = df['valeur'].replace(['None', 'nan', 'None', 'nan', '', 'N/A'], np.nan)
        df['valeur'] = pd.to_numeric(df['valeur'], errors='coerce')

    if 'date_saisie' in df.columns:
        df['date_saisie'] = pd.to_datetime(df['date_saisie'], errors='coerce')
    else:
        df['date_saisie'] = datetime.now(timezone.utc)

    return df

def clean_absence_df(df: pd.DataFrame, session: Session) -> pd.DataFrame:
    """
    Cleans absence DataFrame.
    Returns: Cleaned DataFrame.
    """
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace('-', '_')

    df = df.rename(columns={
        'étudiant': 'email_etudiant', 'email': 'email_etudiant', 'id_etudiant': 'id_etudiant',
        'module': 'nom_module', 'nom_module': 'nom_module', 'id_module': 'id_module',
        'date': 'date_absence', 'date_abs': 'date_absence',
        'heures': 'nb_heures', 'nb_h': 'nb_heures', 'duree': 'nb_heures',
        'justifie': 'justifiee', 'justification': 'justifiee', 'justifié': 'justifiee'
    })

    df = df.replace({np.nan: None, 'nan': None, 'N/A': None, 'None': None, 'error:.*': None}, regex=True)

    if 'email_etudiant' in df.columns:
        etudiants_db = session.exec(select(Etudiant.email, Etudiant.id)).all()
        etudiant_map = {str(e.email).strip().lower(): e.id for e in etudiants_db if e.email}
        df_emails = df['email_etudiant'].astype(str).str.strip().str.lower()
        if 'id_etudiant' not in df.columns:
            df['id_etudiant'] = df_emails.map(etudiant_map)
        else:
            df['id_etudiant'] = df['id_etudiant'].fillna(df_emails.map(etudiant_map))

    if 'nom_module' in df.columns:
        modules_db = session.exec(select(Module.nom, Module.id)).all()
        nom_map = {normalize_string(m.nom): m.id for m in modules_db}

        if 'id_module' not in df.columns:
            df['id_module'] = None
        df_nom = df['nom_module'].apply(normalize_string)
        df['id_module'] = df['id_module'].fillna(df_nom.map(nom_map))

    if 'nb_heures' in df.columns:
        if df['nb_heures'].dtype == object:
            df['nb_heures'] = df['nb_heures'].str.replace(',', '.')
        df['nb_heures'] = pd.to_numeric(df['nb_heures'], errors='coerce')
        df.loc[(df['nb_heures'] < 0) | (df['nb_heures'] > 24), 'nb_heures'] = None
        df['nb_heures'] = df['nb_heures'].round(1)

    if 'justifiee' in df.columns:
        true_vals = {'oui', 'yes', '1', 'true', 'vrai', 'justifié', 'justifiee', 't'}
        df['justifiee'] = df['justifiee'].astype(str).str.strip().str.lower().isin(true_vals)
    else:
        df['justifiee'] = False

    if 'date_absence' in df.columns:
        df['date_absence'] = pd.to_datetime(df['date_absence'], errors='coerce').dt.date

    if 'motif' in df.columns:
        df['motif'] = df['motif'].astype(str).str.strip()
        df.loc[df['motif'].isin(['None', 'nan']), 'motif'] = None

    return df

def clean_retard_df(df: pd.DataFrame, session: Session) -> pd.DataFrame:
    """
    Cleans tardiness DataFrame.
    Returns: Cleaned DataFrame.
    """
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace('-', '_')
    df = df.rename(columns={
        'étudiant': 'email_etudiant', 'email': 'email_etudiant',
        'module': 'nom_module', 'nom_module': 'nom_module',
        'date': 'date_retard', 'date_absence': 'date_retard', 'duree': 'duree_minutes', 'nb_heures': 'duree_minutes',
        'justifie': 'est_justifie', 'justification': 'est_justifie', 'justifié': 'est_justifie', 'justifiee': 'est_justifie'
    })

    df = df.replace(['nan', 'N/A', 'None', 'none', ''], np.nan)
    df = df.replace({r'error:.*': np.nan}, regex=True)

    if 'email_etudiant' in df.columns:
        etudiants_db = session.exec(select(Etudiant.email, Etudiant.id)).all()
        etudiant_map = {str(e.email).strip().lower(): e.id for e in etudiants_db if e.email}
        df_emails = df['email_etudiant'].astype(str).str.strip().str.lower()
        df['id_etudiant'] = df_emails.map(etudiant_map)

    if 'nom_module' in df.columns:
        modules_db = session.exec(select(Module.nom, Module.id)).all()
        module_map = {normalize_string(m.nom): m.id for m in modules_db}
        df_nom = df['nom_module'].apply(normalize_string)
        df['id_module'] = df_nom.map(module_map)

    for col in ['id_etudiant', 'id_module']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

    if 'date_retard' in df.columns:
        df['date_retard'] = pd.to_datetime(df['date_retard'], errors='coerce')

    if 'duree_minutes' in df.columns:
        if df['duree_minutes'].dtype == object:
            df['duree_minutes'] = df['duree_minutes'].str.replace(',', '.')
        df['duree_minutes'] = df['duree_minutes'].astype(str).str.extract(r'(\d+)', expand=False)
        df['duree_minutes'] = pd.to_numeric(df['duree_minutes'], errors='coerce')
        df.loc[df['duree_minutes'] < 0, 'duree_minutes'] = np.nan
        df['duree_minutes'] = df['duree_minutes'].astype('Int64')

    if 'est_justifie' in df.columns:
        df['est_justifie'] = df['est_justifie'].astype(str).str.strip().str.lower().isin(
            ['true', '1', 'oui', 'yes', 'justifié', 'justifie', 'vrai', 'v', 't']
        )
    else:
        df['est_justifie'] = False

    return df

def clean_filiere_df(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans filiere DataFrame.
    Returns: Cleaned DataFrame.
    """
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
    df = df.rename(columns={'nom': 'nom_filiere'})
    df = df.dropna(subset=['nom_filiere'])
    df['nom_filiere'] = df['nom_filiere'].astype(str).str.strip().str.title()
    if 'departement' in df.columns:
        df['departement'] = df['departement'].astype(str).str.strip().str.upper()
    return df

def clean_classe_df(df: pd.DataFrame, session: Session) -> pd.DataFrame:
    """
    Cleans class DataFrame and maps filieres to IDs.
    Returns: Cleaned DataFrame.
    """
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
    df = df.rename(columns={'filiere': 'nom_filiere'})
    df = df.dropna(subset=['nom'])

    if 'nom_filiere' in df.columns:
        filieres_db = session.exec(select(Filiere)).all()
        filiere_map = {normalize_string(f.nom_filiere): f.id for f in filieres_db}
        df_filiere_names = df['nom_filiere'].apply(normalize_string)
        if 'id_filiere' not in df.columns:
            df['id_filiere'] = df_filiere_names.map(filiere_map)
        else:
            df['id_filiere'] = df['id_filiere'].fillna(df_filiere_names.map(filiere_map))

    return df
