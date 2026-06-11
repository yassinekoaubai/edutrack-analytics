from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.session import get_session
from db import models
from schemas.auth import LoginRequest, Token
from utils.security import verify_password, get_password_hash, create_access_token

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_session)):
    user = db.query(models.Utilisateur).filter(models.Utilisateur.email == login_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        role=user.role,
        nom=user.nom,
        prenom=user.prenom
    )

@router.post("/register-initial", status_code=status.HTTP_201_CREATED)
def register_initial(login_data: LoginRequest, db: Session = Depends(get_session)):
    """Initial user creation for testing only."""
    existing = db.query(models.Utilisateur).filter(models.Utilisateur.email == login_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    new_user = models.Utilisateur(
        email=login_data.email,
        password_hash=get_password_hash(login_data.password),
        nom="Admin",
        prenom="System",
        role=models.RoleEnum.ADMIN
    )
    db.add(new_user)
    db.commit()
    return {"message": "Initial admin user created"}
