from typing import Type, List, Optional, TypeVar
from sqlmodel import SQLModel, select
from sqlmodel import Session

from . import models

ModelType = TypeVar("ModelType", bound=SQLModel)


def create(session: Session, obj: ModelType) -> ModelType:
	session.add(obj)
	session.commit()
	session.refresh(obj)
	return obj


def get(session: Session, model: Type[ModelType], id: int) -> Optional[ModelType]:
	return session.get(model, id)


def get_all(session: Session, model: Type[ModelType], *, skip: int = 0, limit: int = 100) -> List[ModelType]:
	statement = select(model).offset(skip).limit(limit)
	return session.exec(statement).all()


def update(session: Session, obj: ModelType) -> ModelType:
	session.add(obj)
	session.commit()
	session.refresh(obj)
	return obj


def delete(session: Session, model: Type[ModelType], id: int) -> bool:
	obj = session.get(model, id)
	if not obj:
		return False
	session.delete(obj)
	session.commit()
	return True


# Domain-specific helpers
def get_etudiant_by_email(session: Session, email: str) -> Optional[models.Etudiant]:
	stmt = select(models.Etudiant).where(models.Etudiant.email == email)
	return session.exec(stmt).first()


def get_utilisateur_by_email(session: Session, email: str) -> Optional[models.Utilisateur]:
	stmt = select(models.Utilisateur).where(models.Utilisateur.email == email)
	return session.exec(stmt).first()


def create_import_log(session: Session, import_log: models.ImportLog) -> models.ImportLog:
	return create(session, import_log)