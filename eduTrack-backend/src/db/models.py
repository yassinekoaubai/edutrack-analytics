from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import Enum as SAEnum, Column, UniqueConstraint
from sqlalchemy import Numeric, Text
from datetime import date, datetime
from typing import Optional, List
import enum

# ---------- ENUM ROLE ----------
class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    DIRECTION = "DIRECTION"
    PROF = "PROF"
    PEDAGOGIE = "PEDAGOGIE"
    ACCUEIL = "ACCUEIL"

# ---------- 1. FILIERE ----------
class Filiere(SQLModel, table=True):
    __tablename__ = "filieres"
    id: Optional[int] = Field(default=None, primary_key=True)
    nom_filiere: str = Field(max_length=100)
    departement: Optional[str] = Field(default=None, max_length=100)

    classes: List["Classe"] = Relationship(back_populates="filiere")
    programmes: List["Programme"] = Relationship(back_populates="filiere")

# ---------- 2. CLASSE ----------
class Classe(SQLModel, table=True):
    __tablename__ = "classes"
    id: Optional[int] = Field(default=None, primary_key=True)
    nom: str = Field(max_length=50)
    niveau: Optional[str] = Field(default=None, max_length=20)
    annee_scolaire: Optional[str] = Field(default=None, max_length=9)
    id_filiere: Optional[int] = Field(default=None, foreign_key="filieres.id")

    filiere: Optional[Filiere] = Relationship(back_populates="classes")
    inscriptions: List["Inscription"] = Relationship(back_populates="classe")

# ---------- 3. ETUDIANT ----------
class Etudiant(SQLModel, table=True):
    __tablename__ = "etudiants"
    id: Optional[int] = Field(default=None, primary_key=True)
    nom: str = Field(max_length=50)
    prenom: str = Field(max_length=50)
    date_naissance: Optional[date] = None
    email: Optional[str] = Field(default=None, max_length=120, unique=True)
    statut: str = Field(default="Actif", max_length=20)
    annee_entree: Optional[int] = None

    inscriptions: List["Inscription"] = Relationship(back_populates="etudiant")
    notes: List["Note"] = Relationship(back_populates="etudiant")
    absences: List["Absence"] = Relationship(back_populates="etudiant")
    retards: List["Retard"] = Relationship(back_populates="etudiant")
    alertes: List["Alerte"] = Relationship(back_populates="etudiant")

# ---------- 4. INSCRIPTION ----------
class Inscription(SQLModel, table=True):
    __tablename__ = "inscriptions"
    id: Optional[int] = Field(default=None, primary_key=True)
    id_etudiant: int = Field(foreign_key="etudiants.id")
    id_classe: int = Field(foreign_key="classes.id")
    annee_scolaire: str = Field(max_length=9)
    statut_inscription: str = Field(default="Inscrit", max_length=20)

    etudiant: Etudiant = Relationship(back_populates="inscriptions")
    classe: Classe = Relationship(back_populates="inscriptions")

# ---------- 5. MODULE ----------
class Module(SQLModel, table=True):
    __tablename__ = "modules"
    id: Optional[int] = Field(default=None, primary_key=True)
    nom: str = Field(max_length=100)
    nombre_horaire: Optional[int] = None
    seuil_validation: float = Field(default=10.0, sa_column=Column(Numeric(4,2)))

    programmes: List["Programme"] = Relationship(back_populates="module")
    evaluations: List["Evaluation"] = Relationship(back_populates="module")
    absences: List["Absence"] = Relationship(back_populates="module")
    retards: List["Retard"] = Relationship(back_populates="module")
    profs: List["UtilisateurModule"] = Relationship(back_populates="module")

# ---------- 6. PROGRAMME ----------
class Programme(SQLModel, table=True):
    __tablename__ = "programmes"
    id_filiere: int = Field(foreign_key="filieres.id", primary_key=True)
    id_module: int = Field(foreign_key="modules.id", primary_key=True)
    semestre: Optional[str] = Field(default=None, max_length=10)
    coefficient_filiere: float = Field(default=1.0, sa_column=Column(Numeric(3,1)))

    filiere: Filiere = Relationship(back_populates="programmes")
    module: Module = Relationship(back_populates="programmes")

# ---------- 7. EVALUATION ----------
class Evaluation(SQLModel, table=True):
    __tablename__ = "evaluations"
    id: Optional[int] = Field(default=None, primary_key=True)
    id_module: int = Field(foreign_key="modules.id")
    nom_eval: Optional[str] = Field(default=None, max_length=100)
    date_prevue: Optional[date] = None
    coefficient_eval: float = Field(default=1.0, sa_column=Column(Numeric(3,1)))
    semestre: Optional[str] = Field(default=None, max_length=10)

    module: Module = Relationship(back_populates="evaluations")
    notes: List["Note"] = Relationship(back_populates="evaluation")

# ---------- 8. NOTE ----------
class Note(SQLModel, table=True):
    __tablename__ = "notes"

    id: Optional[int] = Field(default=None, primary_key=True)
    id_etudiant: int = Field(foreign_key="etudiants.id", nullable=False)
    id_evaluation: int = Field(foreign_key="evaluations.id", nullable=False)
    valeur: Optional[float] = Field(default=None, nullable=True)
    date_saisie: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    etudiant: "Etudiant" = Relationship(back_populates="notes")
    evaluation: "Evaluation" = Relationship(back_populates="notes")

    __table_args__ = (
        UniqueConstraint('id_etudiant', 'id_evaluation', name='uq_etudiant_evaluation'),
    )

# ---------- 9. ABSENCE ----------
class Absence(SQLModel, table=True):
    __tablename__ = "absences"
    id: Optional[int] = Field(default=None, primary_key=True)
    id_etudiant: int = Field(foreign_key="etudiants.id")
    id_module: int = Field(foreign_key="modules.id")
    date_absence: date
    nb_heures: Optional[float] = Field(default=None, sa_column=Column(Numeric(3,1)))
    justifiee: bool = False
    motif: Optional[str] = Field(default=None, sa_column=Column(Text))

    etudiant: Etudiant = Relationship(back_populates="absences")
    module: Module = Relationship(back_populates="absences")

# ---------- 10. RETARD ----------
class Retard(SQLModel, table=True):
    __tablename__ = "retards"
    id: Optional[int] = Field(default=None, primary_key=True)
    id_etudiant: int = Field(foreign_key="etudiants.id")
    id_module: int = Field(foreign_key="modules.id")
    date_retard: datetime
    duree_minutes: Optional[int] = None
    justifie: bool = False

    etudiant: Etudiant = Relationship(back_populates="retards")
    module: Module = Relationship(back_populates="retards")

# ---------- 11. UTILISATEUR (staff uniquement) ----------
class Utilisateur(SQLModel, table=True):
    __tablename__ = "utilisateurs"
    id: Optional[int] = Field(default=None, primary_key=True)
    nom: str = Field(max_length=50)
    prenom: str = Field(max_length=50)
    email: str = Field(max_length=120, unique=True, index=True)
    password_hash: str
    role: RoleEnum = Field(default=RoleEnum.PROF)
    actif: bool = True
    date_creation: datetime = Field(default_factory=datetime.utcnow)
    derniere_connexion: Optional[datetime] = None

    modules_enseignes: List["UtilisateurModule"] = Relationship(back_populates="utilisateur")
    imports: List["ImportLog"] = Relationship(back_populates="auteur")
    alertes_traitees: List["Alerte"] = Relationship(back_populates="traite_par")

# ---------- 12. UTILISATEUR_MODULE ----------
class UtilisateurModule(SQLModel, table=True):
    __tablename__ = "utilisateurs_modules"
    id_utilisateur: int = Field(foreign_key="utilisateurs.id", primary_key=True)
    id_module: int = Field(foreign_key="modules.id", primary_key=True)
    est_responsable: bool = False

    utilisateur: Utilisateur = Relationship(back_populates="modules_enseignes")
    module: Module = Relationship(back_populates="profs")

# ---------- 13. IMPORT_LOG ----------
class ImportLog(SQLModel, table=True):
    __tablename__ = "import_logs"
    id: Optional[int] = Field(default=None, primary_key=True)
    nom_fichier: Optional[str] = Field(default=None, max_length=255)
    date_import: datetime = Field(default_factory=datetime.utcnow)
    type_donnees: Optional[str] = Field(default=None, max_length=50)
    nb_lignes_ok: int = 0
    nb_lignes_rejet: int = 0
    statut: Optional[str] = Field(default=None, max_length=20)
    id_auteur: Optional[int] = Field(default=None, foreign_key="utilisateurs.id")

    auteur: Optional[Utilisateur] = Relationship(back_populates="imports")

# ---------- 14. PARAMETRE_RISQUE ----------
class ParametreRisque(SQLModel, table=True):
    __tablename__ = "parametres_risque"
    id: Optional[int] = Field(default=None, primary_key=True)
    type_risque: Optional[str] = Field(default=None, max_length=50)
    seuil: Optional[float] = Field(default=None, sa_column=Column(Numeric(5,2)))
    operateur: Optional[str] = Field(default=None, max_length=3)
    annee_scolaire: Optional[str] = Field(default=None, max_length=9)

    alertes: List["Alerte"] = Relationship(back_populates="parametre")

# ---------- 15. ALERTE ----------
class Alerte(SQLModel, table=True):
    __tablename__ = "alertes"
    id: Optional[int] = Field(default=None, primary_key=True)
    id_etudiant: int = Field(foreign_key="etudiants.id")
    id_parametre: int = Field(foreign_key="parametres_risque.id")
    date_detection: datetime = Field(default_factory=datetime.utcnow)
    valeur_mesuree: Optional[float] = Field(default=None, sa_column=Column(Numeric(5,2)))
    message: Optional[str] = Field(default=None, sa_column=Column(Text))
    statut: str = Field(default="Nouvelle", max_length=20)
    id_traite_par: Optional[int] = Field(default=None, foreign_key="utilisateurs.id")

    etudiant: Etudiant = Relationship(back_populates="alertes")
    parametre: ParametreRisque = Relationship(back_populates="alertes")
    traite_par: Optional[Utilisateur] = Relationship(back_populates="alertes_traitees")