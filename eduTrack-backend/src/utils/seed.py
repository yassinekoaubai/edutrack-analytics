from datetime import date, datetime, timedelta
from sqlmodel import Session, select
from database import engine
from models import ( 
    Filiere, Classe, Etudiant, Inscription, Module, Programme,
    Evaluation, Note, Absence, Retard, Utilisateur, UtilisateurModule,
    ImportLog, ParametreRisque, Alerte, RoleEnum
)

def seed_database():
    """
    Seeds the database with initial pedagogical and user data for testing.
    """
    with Session(engine) as session:
        # Check if already seeded
        existing = session.exec(select(Filiere)).first()
        if existing:
            return

        # 1. FILIERES
        filieres_data = [
            {"nom_filiere": "Informatique", "departement": "STIC"},
            {"nom_filiere": "Génie Civil", "departement": "Génie Civil"},
            {"nom_filiere": "Génie Électrique", "departement": "STIC"},
            {"nom_filiere": "Gestion", "departement": "Sciences Économiques"},
        ]
        filieres = []
        for f_data in filieres_data:
            f = Filiere(**f_data)
            session.add(f)
            filieres.append(f)
        session.commit()

        # 2. CLASSES
        classes_data = [
            {"nom": "A", "niveau": "L1", "annee_scolaire": "2025-2026", "id_filiere": filieres[0].id},
            {"nom": "B", "niveau": "L1", "annee_scolaire": "2025-2026", "id_filiere": filieres[0].id},
            {"nom": "GC1", "niveau": "L1", "annee_scolaire": "2025-2026", "id_filiere": filieres[1].id},
        ]
        classes = []
        for c_data in classes_data:
            c = Classe(**c_data)
            session.add(c)
            classes.append(c)
        session.commit()

        # 3. ETUDIANTS
        students_data = [
            {"nom": "Martin", "prenom": "Sophie", "date_naissance": date(2003, 5, 12), "email": "sophie.martin@example.com", "statut": "Actif", "annee_entree": 2023},
            {"nom": "Bernard", "prenom": "Lucas", "date_naissance": date(2002, 11, 23), "email": "lucas.bernard@example.com", "statut": "Actif", "annee_entree": 2022},
        ]
        etudiants = []
        for s in students_data:
            e = Etudiant(**s)
            session.add(e)
            etudiants.append(e)
        session.commit()

        # 4. UTILISATEURS
        utilisateurs_data = [
            {"nom": "Admin", "prenom": "System", "email": "admin@edutrack.ma", "password_hash": "admin123", "role": RoleEnum.ADMIN},
        ]
        for u_data in utilisateurs_data:
            session.add(Utilisateur(**u_data))
        session.commit()
