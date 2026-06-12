from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_session
from models import Utilisateur, RoleEnum
from schemas import LoginRequest, Token
from utils.security import verify_password, get_password_hash, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token, status_code=status.HTTP_200_OK)
def login(login_data: LoginRequest, db: Session = Depends(get_session)):
    """
    Authenticate a user and return an access token.
    Returns: Access token with user details and role.
    """
    try:
        user = db.query(Utilisateur).filter(Utilisateur.email == login_data.email).first()
        if not user or not verify_password(login_data.password, user.password_hash):
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/register-initial", status_code=status.HTTP_201_CREATED)
def register_initial(login_data: LoginRequest, db: Session = Depends(get_session)):
    """
    Create an initial admin user for system setup.
    Returns: Confirmation message.
    """
    try:
        existing = db.query(Utilisateur).filter(Utilisateur.email == login_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already exists"
            )
        
        new_user = Utilisateur(
            email=login_data.email,
            password_hash=get_password_hash(login_data.password),
            nom="Admin",
            prenom="System",
            role=RoleEnum.ADMIN
        )
        db.add(new_user)
        db.commit()
        return {"message": "Initial admin user created"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
