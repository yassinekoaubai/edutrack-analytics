import pandas as pd
from io import BytesIO
from sqlmodel import Session
from db.session import get_session
from schemas.imports import ImportResult
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from services.etl import (
    process_etudiant_import,
    process_module_import,
    process_evaluation_import,
    process_note_import,
    process_absence_import,
    process_retard_import   
)

router = APIRouter(prefix="/imports", tags=["import"])

@router.post("/etudiants", response_model=ImportResult)
async def upload_etudiants(
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(400, "Format accepté: .csv ou .xlsx uniquement")

    content = await file.read()
    try:
        if file.filename.endswith('.csv'):
            # Try to detect separator (comma, semicolon, tab)
            sample = content[:4096].decode('utf-8', errors='ignore')
            sep = ','
            if ';' in sample and sample.count(';') > sample.count(','):
                sep = ';'
            elif '\t' in sample:
                sep = '\t'
            # Read with dtype object to preserve strings for cleaning
            df = pd.read_csv(BytesIO(content), sep=sep, dtype=str)
            numeric_cols = ['id', 'id_etudiant', 'id_evaluation', 'id_module', 'nombre_horaire', 'annee_entree']
            for col in numeric_cols:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
        else:
            df = pd.read_excel(BytesIO(content))
    except Exception as e:
        raise HTTPException(400, f"Fichier illisible: {e}")

    result = process_etudiant_import(df, file.filename, session)
    return result

@router.post("/modules", response_model=ImportResult)
async def upload_modules(
    file: UploadFile = File(...), 
    session: Session = Depends(get_session)
):
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(400, "Format accepté: .csv ou .xlsx uniquement")

    content = await file.read()
    try:
        if file.filename.endswith('.csv'):
            # Try to detect separator (comma, semicolon, tab)
            sample = content[:4096].decode('utf-8', errors='ignore')
            sep = ','
            if ';' in sample and sample.count(';') > sample.count(','):
                sep = ';'
            elif '\t' in sample:
                sep = '\t'
            # Read with dtype object to preserve strings for cleaning
            df = pd.read_csv(BytesIO(content), sep=sep, dtype=str)
            numeric_cols = ['id', 'id_etudiant', 'id_evaluation', 'id_module', 'nombre_horaire', 'annee_entree']
            for col in numeric_cols:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='ignore')
        else:
            df = pd.read_excel(BytesIO(content))
    except Exception as e:
        raise HTTPException(400, f"Fichier illisible: {e}")

    result = process_module_import(df, file.filename, session)
    return result

@router.post("/evaluations", response_model=ImportResult)
async def upload_evaluations(
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(400, "Format accepté: .csv ou .xlsx uniquement")

    content = await file.read()
    try:
        if file.filename.endswith('.csv'):
            # Try to detect separator (comma, semicolon, tab)
            sample = content[:4096].decode('utf-8', errors='ignore')
            sep = ','
            if ';' in sample and sample.count(';') > sample.count(','):
                sep = ';'
            elif '\t' in sample:
                sep = '\t'
            # Read with dtype object to preserve strings for cleaning
            df = pd.read_csv(BytesIO(content), sep=sep, dtype=str)
            numeric_cols = ['id', 'id_etudiant', 'id_evaluation', 'id_module', 'nombre_horaire', 'annee_entree']
            for col in numeric_cols:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='ignore')
        else:
            df = pd.read_excel(BytesIO(content))
    except Exception as e:
        raise HTTPException(400, f"Fichier illisible: {e}")

    result = process_evaluation_import(df, file.filename, session)
    return result

@router.post("/notes", response_model=ImportResult)
async def upload_notes(
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(400, "Format accepté: .csv ou .xlsx uniquement")

    content = await file.read()
    try:
        if file.filename.endswith('.csv'):
            # Try to detect separator (comma, semicolon, tab)
            sample = content[:4096].decode('utf-8', errors='ignore')
            sep = ','
            if ';' in sample and sample.count(';') > sample.count(','):
                sep = ';'
            elif '\t' in sample:
                sep = '\t'
            # Read with dtype object to preserve strings for cleaning (especially for decimal commas)
            df = pd.read_csv(BytesIO(content), sep=sep, dtype=str)
            # Convert appropriate columns back to numeric after cleaning
            numeric_cols = ['id', 'id_etudiant', 'id_evaluation', 'id_module', 'nb_heures']
            for col in numeric_cols:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
        else:
            df = pd.read_excel(BytesIO(content))
    except Exception as e:
        raise HTTPException(400, f"Fichier illisible: {e}")

    result = process_note_import(df, file.filename, session)
    return result

@router.post("/absences", response_model=ImportResult)
async def upload_absences(
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(400, "Format accepté: .csv ou .xlsx uniquement")

    content = await file.read()
    try:
        if file.filename.endswith('.csv'):
            # Try to detect separator (comma, semicolon, tab)
            sample = content[:4096].decode('utf-8', errors='ignore')
            sep = ','
            if ';' in sample and sample.count(';') > sample.count(','):
                sep = ';'
            elif '\t' in sample:
                sep = '\t'
            # Read with dtype object to preserve strings for cleaning
            df = pd.read_csv(BytesIO(content), sep=sep, dtype=str)
            numeric_cols = ['id', 'id_etudiant', 'id_evaluation', 'id_module', 'nombre_horaire', 'annee_entree']
            for col in numeric_cols:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='ignore')
        else:
            df = pd.read_excel(BytesIO(content))
    except Exception as e:
        raise HTTPException(400, f"Fichier illisible: {e}")

    result = process_absence_import(df, file.filename, session)
    return result

@router.post("/retards", response_model=ImportResult)
async def upload_retards(
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(400, "Format accepté:.csv ou.xlsx uniquement")

    content = await file.read()
    try:
        if file.filename.endswith('.csv'):
            # Try to detect separator (comma, semicolon, tab)
            sample = content[:4096].decode('utf-8', errors='ignore')
            sep = ','
            if ';' in sample and sample.count(';') > sample.count(','):
                sep = ';'
            elif '\t' in sample:
                sep = '\t'
            # Read with dtype object to preserve strings for cleaning
            df = pd.read_csv(BytesIO(content), sep=sep, dtype=str)
            numeric_cols = ['id', 'id_etudiant', 'id_evaluation', 'id_module', 'nombre_horaire', 'annee_entree']
            for col in numeric_cols:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='ignore')
        else:
            df = pd.read_excel(BytesIO(content))
    except Exception as e:
        raise HTTPException(400, f"Fichier illisible: {e}")

    result = process_retard_import(df, file.filename, session)
    return result