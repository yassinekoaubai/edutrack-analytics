import pandas as pd
from io import BytesIO
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from sqlalchemy.orm import Session
from database import get_session
from models import ImportLog
from schemas import ImportResult, ImportLogListItem
from services.etl import (
    process_etudiant_import,
    process_module_import,
    process_evaluation_import,
    process_note_import,
    process_absence_import,
    process_retard_import,
    process_filiere_import,
    process_classe_import
)

router = APIRouter(tags=["Data Ingestion"])

async def _read_file_to_df(file: UploadFile) -> pd.DataFrame:
    """
    Utility to read uploaded CSV or Excel file into a pandas DataFrame.
    Returns: Pandas DataFrame.
    """
    try:
        content = await file.read()
        if file.filename.endswith('.csv'):
            sample = content[:4096].decode('utf-8', errors='ignore')
            sep = ';' if sample.count(';') > sample.count(',') else ','
            if '\t' in sample: sep = '\t'
            
            return pd.read_csv(BytesIO(content), sep=sep, dtype=str)
        elif file.filename.endswith(('.xls', '.xlsx')):
            return pd.read_excel(BytesIO(content))
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Format non supporté. Utilisez .csv ou .xlsx"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur de lecture du fichier: {str(e)}"
        )

@router.post("/imports/filieres", response_model=ImportResult, status_code=status.HTTP_201_CREATED)
async def upload_filieres(file: UploadFile = File(...), db: Session = Depends(get_session)):
    """
    Import academic branches (filieres) from a file.
    Returns: Statistics of the import operation.
    """
    df = await _read_file_to_df(file)
    result = process_filiere_import(df, file.filename, db)
    return result

@router.post("/imports/classes", response_model=ImportResult, status_code=status.HTTP_201_CREATED)
async def upload_classes(file: UploadFile = File(...), db: Session = Depends(get_session)):
    """
    Import classes/cohorts from a file.
    Returns: Statistics of the import operation.
    """
    df = await _read_file_to_df(file)
    result = process_classe_import(df, file.filename, db)
    return result

@router.post("/imports/etudiants", response_model=ImportResult, status_code=status.HTTP_201_CREATED)
async def upload_etudiants(file: UploadFile = File(...), db: Session = Depends(get_session)):
    """
    Import students and their profiles from a file.
    Returns: Statistics of the import operation.
    """
    df = await _read_file_to_df(file)
    result = process_etudiant_import(df, file.filename, db)
    return result

@router.post("/imports/modules", response_model=ImportResult, status_code=status.HTTP_201_CREATED)
async def upload_modules(file: UploadFile = File(...), db: Session = Depends(get_session)):
    """
    Import course modules from a file.
    Returns: Statistics of the import operation.
    """
    df = await _read_file_to_df(file)
    result = process_module_import(df, file.filename, db)
    return result

@router.post("/imports/evaluations", response_model=ImportResult, status_code=status.HTTP_201_CREATED)
async def upload_evaluations(file: UploadFile = File(...), db: Session = Depends(get_session)):
    """
    Import assessment definitions from a file.
    Returns: Statistics of the import operation.
    """
    df = await _read_file_to_df(file)
    result = process_evaluation_import(df, file.filename, db)
    return result

@router.post("/imports/notes", response_model=ImportResult, status_code=status.HTTP_201_CREATED)
async def upload_notes(file: UploadFile = File(...), db: Session = Depends(get_session)):
    """
    Import student grades/notes from a file.
    Returns: Statistics of the import operation.
    """
    df = await _read_file_to_df(file)
    result = process_note_import(df, file.filename, db)
    return result

@router.post("/imports/absences", response_model=ImportResult, status_code=status.HTTP_201_CREATED)
async def upload_absences(file: UploadFile = File(...), db: Session = Depends(get_session)):
    """
    Import student absences from a file.
    Returns: Statistics of the import operation.
    """
    df = await _read_file_to_df(file)
    result = process_absence_import(df, file.filename, db)
    return result

@router.post("/imports/retards", response_model=ImportResult, status_code=status.HTTP_201_CREATED)
async def upload_retards(file: UploadFile = File(...), db: Session = Depends(get_session)):
    """
    Import student tardiness records from a file.
    Returns: Statistics of the import operation.
    """
    df = await _read_file_to_df(file)
    result = process_retard_import(df, file.filename, db)
    return result

@router.get("/import-logs", response_model=List[ImportLogListItem], status_code=status.HTTP_200_OK)
def list_import_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_session)):
    """
    Retrieve historical logs of data import operations.
    Returns: List of import log entries.
    """
    try:
        logs = (
            db.query(ImportLog)
            .order_by(ImportLog.date_import.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return logs
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des logs: {str(e)}"
        )
