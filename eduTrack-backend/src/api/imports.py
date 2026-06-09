import pandas as pd
from io import BytesIO
from sqlmodel import Session
from db.session import get_session
from schemas.imports import ImportResult
from services.etl import process_etudiant_import, process_module_import, process_evaluation_import, process_note_import
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends

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
            df = pd.read_csv(BytesIO(content))
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
            df = pd.read_csv(BytesIO(content))
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
            df = pd.read_csv(BytesIO(content))
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
            df = pd.read_csv(BytesIO(content))
        else:
            df = pd.read_excel(BytesIO(content))
    except Exception as e:
        raise HTTPException(400, f"Fichier illisible: {e}")

    result = process_note_import(df, file.filename, session)
    return result
