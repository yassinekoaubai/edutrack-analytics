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
    # Strip strings but keep NaN as-is, then normalise case for specific fields
    for col in ['nom', 'prenom', 'statut', 'email']:
        if col in df.columns:
            df[col] = df[col].where(pd.isna(df[col]), df[col].astype(str).str.strip())
            if col == 'nom':
                df['nom'] = df['nom'].where(df['nom'].isna(), df['nom'].str.upper())
            elif col == 'prenom':
                df['prenom'] = df['prenom'].where(df['prenom'].isna(), df['prenom'].str.title())
            elif col == 'email':
                df['email'] = df['email'].where(df['email'].isna(), df['email'].str.lower())

    # Reject any row missing required fields: nom, prenom, statut, email
    required_cols = [c for c in ['nom', 'prenom', 'statut', 'email'] if c in df.columns]
    if required_cols:
        df = df.dropna(subset=required_cols)

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

    # Accept positional/no-header files
    def _header_looks_like_data(cols):
        import re
        data_like = 0
        total = len(cols)
        for c in cols:
            s = str(c).strip()
            # Inclusion de la virgule pour les nombres décimaux (ex: 11,1)
            if s.isdigit() or re.fullmatch(r"[0-9\-/: \.,]+", s):
                data_like += 1
        return data_like >= max(2, total // 2)

    if _header_looks_like_data(df.columns):
        cols = df.shape[1]
        if cols >= 5:
            df.columns = ['id', 'id_etudiant', 'id_evaluation', 'valeur', 'date_saisie'] + [f'col{i}' for i in range(5, cols)]
        elif cols == 4:
            df.columns = ['id_etudiant', 'id_evaluation', 'valeur', 'date_saisie']
        elif cols == 3:
            df.columns = ['id_etudiant', 'id_evaluation', 'valeur']

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

    # Convertir en types appropriés mais NE PAS dropna ici
    if 'id_etudiant' in df.columns:
        df['id_etudiant'] = pd.to_numeric(df['id_etudiant'], errors='coerce')
    if 'id_evaluation' in df.columns:
        df['id_evaluation'] = pd.to_numeric(df['id_evaluation'], errors='coerce')

    # 3. Valeur note
    if 'valeur' in df.columns:
        # Remplacement robuste des virgules
        df['valeur'] = df['valeur'].astype(str).str.replace(',', '.', regex=False)
        # Nettoyage des chaînes 'None' ou 'nan'
        df['valeur'] = df['valeur'].replace(['None', 'nan', 'None', 'nan', '', 'N/A'], np.nan)
        # Conversion numeric: on garde les NaN pour les erreurs de parsing
        df['valeur'] = pd.to_numeric(df['valeur'], errors='coerce')
        # On ne filtre PAS le range 0-20 ici, on laisse le validator le faire

    # 4. Date saisie
    if 'date_saisie' in df.columns:
        df['date_saisie'] = pd.to_datetime(df['date_saisie'], errors='coerce')
    else:
        df['date_saisie'] = datetime.now(timezone.utc)

    return df

def clean_absence_df(df: pd.DataFrame, session: Session) -> pd.DataFrame:
    # 1. Normalisation colonnes
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace('-', '_')

    # Mapping flexible pour absences
    df = df.rename(columns={
        'étudiant': 'email_etudiant', 'email': 'email_etudiant', 'id_etudiant': 'id_etudiant',
        'module': 'code_module', 'code_mod': 'code_module', 'nom_module': 'nom_module', 'id_module': 'id_module',
        'date': 'date_absence', 'date_abs': 'date_absence', 'date_retard': 'date_absence',
        'heures': 'nb_heures', 'nb_h': 'nb_heures', 'duree': 'nb_heures', 'duree_minutes': 'nb_heures',
        'justifie': 'justifiee', 'justification': 'justifiee', 'justifié': 'justifiee'
    })

    # Accept positional/no-header files: detect if column names look like data (numbers/dates)
    def _header_looks_like_data(cols):
        import re
        data_like = 0
        total = len(cols)
        for c in cols:
            s = str(c).strip()
            # purely numeric
            if s.isdigit():
                data_like += 1
                continue
            # date/time-like (digits, -/: and spaces)
            if re.fullmatch(r"[0-9\-/: ]+", s):
                data_like += 1
                continue
        return data_like >= max(2, total // 2)

    if _header_looks_like_data(df.columns):
        cols = df.shape[1]
        if cols >= 6:
            df.columns = ['id', 'id_etudiant', 'id_module', 'date_absence', 'nb_heures', 'justifiee'] + [f'col{i}' for i in range(6, cols)]
        elif cols == 5:
            df.columns = ['id_etudiant', 'id_module', 'date_absence', 'nb_heures', 'justifiee']
        elif cols == 4:
            df.columns = ['id_etudiant', 'date_absence', 'nb_heures', 'justifiee']

    # Nettoyage global
    df = df.replace({np.nan: None, 'nan': None, 'N/A': None, 'None': None, 'error:.*': None}, regex=True)

    # Resolution id_etudiant via email
    if 'email_etudiant' in df.columns:
        etudiants_db = session.exec(select(Etudiant.email, Etudiant.id)).all()
        etudiant_map = {str(e.email).strip().lower(): e.id for e in etudiants_db if e.email}
        df_emails = df['email_etudiant'].astype(str).str.strip().str.lower()
        if 'id_etudiant' not in df.columns:
            df['id_etudiant'] = df_emails.map(etudiant_map)
        else:
            df['id_etudiant'] = df['id_etudiant'].fillna(df_emails.map(etudiant_map))

    # Resolution id_module via code_module ou nom_module
    if 'code_module' in df.columns or 'nom_module' in df.columns:
        modules_db = session.exec(select(Module.code_module, Module.nom_module, Module.id)).all()
        code_map = {normalize_string(m.code_module): m.id for m in modules_db if m.code_module}
        nom_map = {normalize_string(m.nom_module): m.id for m in modules_db if m.nom_module}

        if 'id_module' not in df.columns:
            df['id_module'] = None

        if 'code_module' in df.columns:
            df_code = df['code_module'].apply(normalize_string)
            df['id_module'] = df['id_module'].fillna(df_code.map(code_map))

        if 'nom_module' in df.columns:
            df_nom = df['nom_module'].apply(normalize_string)
            df['id_module'] = df['id_module'].fillna(df_nom.map(nom_map))

    # Supprimer lignes sans IDs obligatoires
    df = df.dropna(subset=['id_etudiant', 'id_module', 'date_absence'])
    df['id_etudiant'] = df['id_etudiant'].astype(int)
    df['id_module'] = df['id_module'].astype(int)

    # 3. nb_heures - handle commas
    if 'nb_heures' in df.columns:
        if df['nb_heures'].dtype == object:
            df['nb_heures'] = df['nb_heures'].str.replace(',', '.')
        df['nb_heures'] = pd.to_numeric(df['nb_heures'], errors='coerce')
        df.loc[(df['nb_heures'] < 0) | (df['nb_heures'] > 24), 'nb_heures'] = None
        df['nb_heures'] = df['nb_heures'].round(1)

    # 4. justifiee -> bool
    if 'justifiee' in df.columns:
        # map common truthy values
        true_vals = {'oui', 'yes', '1', 'true', 'vrai', 'justifié', 'justifiee', 't'}
        df['justifiee'] = df['justifiee'].astype(str).str.strip().str.lower().isin(true_vals)
    else:
        df['justifiee'] = False

    # 5. date_absence
    df['date_absence'] = pd.to_datetime(df['date_absence'], errors='coerce')
    # accept datetime with time for absences, keep date portion
    df['date_absence'] = df['date_absence'].dt.date
    df = df.dropna(subset=['date_absence']) # drop if date invalid

    # 6. motif clean
    if 'motif' in df.columns:
        df['motif'] = df['motif'].astype(str).str.strip()
        df.loc[df['motif'].isin(['None', 'nan']), 'motif'] = None

    return df

def clean_retard_df(df: pd.DataFrame, session: Session) -> pd.DataFrame:
    from db.models import Etudiant, Module
    import numpy as np

    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace('-', '_')

    df = df.rename(columns={
        'étudiant': 'email_etudiant', 'email': 'email_etudiant',
        'module': 'code_module', 'nom_module': 'code_module',
        'date': 'date_retard', 'date_absence': 'date_retard', 'duree': 'duree_minutes', 'nb_heures': 'duree_minutes',
        'justifie': 'est_justifie', 'justification': 'est_justifie', 'justifié': 'est_justifie', 'justifiee': 'est_justifie'
    })

    # Accept positional/no-header files: detect if column names look like data (numbers/dates)
    def _header_looks_like_data(cols):
        import re
        data_like = 0
        total = len(cols)
        for c in cols:
            s = str(c).strip()
            if s.isdigit():
                data_like += 1
                continue
            if re.fullmatch(r"[0-9\-/: ]+", s):
                data_like += 1
                continue
        return data_like >= max(2, total // 2)

    if _header_looks_like_data(df.columns):
        cols = df.shape[1]
        if cols >= 6:
            df.columns = ['id', 'id_etudiant', 'id_module', 'date_retard', 'duree_minutes', 'est_justifie'] + [f'col{i}' for i in range(6, cols)]
        elif cols == 5:
            df.columns = ['id_etudiant', 'id_module', 'date_retard', 'duree_minutes', 'est_justifie']
        elif cols == 4:
            df.columns = ['id_etudiant', 'date_retard', 'duree_minutes', 'est_justifie']

    # IMPORTANT: convertit tout ce qui est vide en NaN AVANT tout
    df = df.replace(r'^\s*$', np.nan, regex=True)
    df = df.replace(['nan', 'N/A', 'None', 'none', ''], np.nan)
    df = df.replace({r'error:.*': np.nan}, regex=True)

    # Resolution id_etudiant
    if 'email_etudiant' in df.columns:
        etudiants_db = session.exec(select(Etudiant.email, Etudiant.id)).all()
        etudiant_map = {str(e.email).strip().lower(): e.id for e in etudiants_db if e.email}
        df_emails = df['email_etudiant'].astype(str).str.strip().str.lower()
        df['id_etudiant'] = df_emails.map(etudiant_map)

    # Resolution id_module
    if 'code_module' in df.columns:
        modules_db = session.exec(select(Module.code_module, Module.id)).all()
        module_map = {str(m.code_module).strip().lower(): m.id for m in modules_db if m.code_module}
        df_codes = df['code_module'].astype(str).str.strip().str.lower()
        df['id_module'] = df_codes.map(module_map)

    # Cast FK - FORCE float puis int, drop les NaN entre les deux
    for col in ['id_etudiant', 'id_module']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            df = df.dropna(subset=[col])
            df[col] = df[col].astype(int)

    # Date
    if 'date_retard' in df.columns:
        # accept both date and datetime strings
        df['date_retard'] = pd.to_datetime(df['date_retard'], errors='coerce', dayfirst=True)
        df = df.dropna(subset=['date_retard'])

    # Duree - FIX: extract numeric d'abord
    if 'duree_minutes' in df.columns:
        # Handle decimal with comma if it's hours instead of minutes
        if df['duree_minutes'].dtype == object:
            df['duree_minutes'] = df['duree_minutes'].str.replace(',', '.')
        
        # Extrait juste les chiffres: "15 min" -> "15", "N/A" -> NaN
        df['duree_minutes'] = df['duree_minutes'].astype(str).str.extract(r'(\d+)', expand=False)
        df['duree_minutes'] = pd.to_numeric(df['duree_minutes'], errors='coerce')
        df.loc[df['duree_minutes'] < 0, 'duree_minutes'] = np.nan
        df['duree_minutes'] = df['duree_minutes'].astype('Int64')
    else:
        df['duree_minutes'] = pd.Series([pd.NA] * len(df), dtype='Int64')

    # Boolean justifie - FIX: nom correct est_justifie
    if 'est_justifie' in df.columns:
        df['est_justifie'] = df['est_justifie'].astype(str).str.strip().str.lower().isin(
            ['true', '1', 'oui', 'yes', 'justifié', 'justifie', 'vrai', 'v', 't', 'vrai']
        )
    else:
        df['est_justifie'] = False

    return df