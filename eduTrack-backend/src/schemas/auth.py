from pydantic import BaseModel

class LoginRequest(BaseModel):
    """
    Schema for user login request.
    """
    email: str
    password: str

class Token(BaseModel):
    """
    Schema for authentication token response.
    """
    access_token: str
    token_type: str
    user_id: int
    role: str
    nom: str
    prenom: str
