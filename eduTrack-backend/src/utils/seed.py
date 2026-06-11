# seed.py
from datetime import date, datetime, timedelta
from sqlmodel import Session
from sqlalchemy import select
from db.session import engine
from db.models import ( 
    Filiere, Classe, Etudiant, Inscription, Module, Programme,
    Evaluation, Note, Absence, Retard, Utilisateur, UtilisateurModule,
    ImportLog, ParametreRisque, Alerte, RoleEnum
)

def seed_database():
    with Session(engine) as session:
        # ---------------- CHECK IF ALREADY SEEDED ----------------
        existing = session.exec(select(Filiere)).first()
        if existing:
            print("Database already seeded, skipping.")
            return

        # ==================== 1. FILIERES ====================
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

        # ==================== 2. CLASSES ====================
        # Each filiere gets classes for different levels
        classes_data = [
            # Informatique
            {"nom": "A", "niveau": "L1", "annee_scolaire": "2025-2026", "id_filiere": filieres[0].id},
            {"nom": "B", "niveau": "L1", "annee_scolaire": "2025-2026", "id_filiere": filieres[0].id},
            {"nom": "A", "niveau": "L2", "annee_scolaire": "2025-2026", "id_filiere": filieres[0].id},
            {"nom": "B", "niveau": "L2", "annee_scolaire": "2025-2026", "id_filiere": filieres[0].id},
            {"nom": "A", "niveau": "L3", "annee_scolaire": "2025-2026", "id_filiere": filieres[0].id},
            # Génie Civil
            {"nom": "GC1", "niveau": "L1", "annee_scolaire": "2025-2026", "id_filiere": filieres[1].id},
            {"nom": "GC2", "niveau": "L2", "annee_scolaire": "2025-2026", "id_filiere": filieres[1].id},
            # Génie Électrique
            {"nom": "GE1", "niveau": "L1", "annee_scolaire": "2025-2026", "id_filiere": filieres[2].id},
            {"nom": "GE2", "niveau": "L2", "annee_scolaire": "2025-2026", "id_filiere": filieres[2].id},
            # Gestion
            {"nom": "G1", "niveau": "L1", "annee_scolaire": "2025-2026", "id_filiere": filieres[3].id},
            {"nom": "G2", "niveau": "L2", "annee_scolaire": "2025-2026", "id_filiere": filieres[3].id},
        ]
        classes = []
        for c_data in classes_data:
            c = Classe(**c_data)
            session.add(c)
            classes.append(c)
        session.commit()

        # ==================== 3. ETUDIANTS ====================
        students_data = [
            {"nom": "Martin", "prenom": "Sophie", "date_naissance": date(2003, 5, 12), "email": "sophie.martin@example.com", "statut": "Actif", "annee_entree": 2023},
            {"nom": "Bernard", "prenom": "Lucas", "date_naissance": date(2002, 11, 23), "email": "lucas.bernard@example.com", "statut": "Actif", "annee_entree": 2022},
            {"nom": "Dubois", "prenom": "Emma", "date_naissance": date(2004, 1, 30), "email": "emma.dubois@example.com", "statut": "Actif", "annee_entree": 2024},
            {"nom": "Thomas", "prenom": "Chloé", "date_naissance": date(2003, 7, 18), "email": "chloe.thomas@example.com", "statut": "Actif", "annee_entree": 2023},
            {"nom": "Robert", "prenom": "Hugo", "date_naissance": date(2002, 9, 5), "email": "hugo.robert@example.com", "statut": "Actif", "annee_entree": 2022},
            {"nom": "Petit", "prenom": "Léa", "date_naissance": date(2004, 3, 22), "email": "lea.petit@example.com", "statut": "Actif", "annee_entree": 2024},
        ]
        etudiants = []
        for s in students_data:
            e = Etudiant(**s)
            session.add(e)
            etudiants.append(e)
        session.commit()

        # ==================== 4. INSCRIPTIONS (link students to classes) ====================
        # Assign each student to a specific class based on level/filiere
        # We'll create realistic assignments:
        # - Students 1 & 2 -> Informatique L1 A
        # - Student 3 -> Informatique L1 B
        # - Student 4 -> Génie Civil L1
        # - Student 5 -> Génie Électrique L1
        # - Student 6 -> Gestion L1
        # Also later inscriptions for same students in higher years (optional)
        inscriptions_data = [
            {"id_etudiant": etudiants[0].id, "id_classe": classes[0].id, "annee_scolaire": "2025-2026", "statut_inscription": "Inscrit"},
            {"id_etudiant": etudiants[1].id, "id_classe": classes[0].id, "annee_scolaire": "2025-2026", "statut_inscription": "Inscrit"},
            {"id_etudiant": etudiants[2].id, "id_classe": classes[1].id, "annee_scolaire": "2025-2026", "statut_inscription": "Inscrit"},
            {"id_etudiant": etudiants[3].id, "id_classe": classes[5].id, "annee_scolaire": "2025-2026", "statut_inscription": "Inscrit"},  # GC1
            {"id_etudiant": etudiants[4].id, "id_classe": classes[7].id, "annee_scolaire": "2025-2026", "statut_inscription": "Inscrit"},  # GE1
            {"id_etudiant": etudiants[5].id, "id_classe": classes[9].id, "annee_scolaire": "2025-2026", "statut_inscription": "Inscrit"},  # G1
        ]
        for ins in inscriptions_data:
            session.add(Inscription(**ins))
        session.commit()

        # ==================== 5. MODULES ====================
        modules_data = [
            {"nom": "Algorithmique", "nombre_horaire": 60, "seuil_validation": 10.0},
            {"nom": "Base de données", "nombre_horaire": 45, "seuil_validation": 10.0},
            {"nom": "Génie logiciel", "nombre_horaire": 50, "seuil_validation": 10.0},
            {"nom": "Résistance des matériaux", "nombre_horaire": 40, "seuil_validation": 10.0},
            {"nom": "Circuits électriques", "nombre_horaire": 55, "seuil_validation": 10.0},
            {"nom": "Comptabilité", "nombre_horaire": 48, "seuil_validation": 10.0},
        ]
        modules = []
        for m in modules_data:
            mod = Module(**m)
            session.add(mod)
            modules.append(mod)
        session.commit()

        # ==================== 6. PROGRAMMES (Filiere <-> Module) ====================
        programmes_data = [
            # Informatique
            {"id_filiere": filieres[0].id, "id_module": modules[0].id, "semestre": "S1", "coefficient_filiere": 4},
            {"id_filiere": filieres[0].id, "id_module": modules[1].id, "semestre": "S2", "coefficient_filiere": 3},
            {"id_filiere": filieres[0].id, "id_module": modules[2].id, "semestre": "S3", "coefficient_filiere": 4},
            # Génie Civil
            {"id_filiere": filieres[1].id, "id_module": modules[3].id, "semestre": "S1", "coefficient_filiere": 5},
            # Génie Électrique
            {"id_filiere": filieres[2].id, "id_module": modules[4].id, "semestre": "S1", "coefficient_filiere": 4},
            # Gestion
            {"id_filiere": filieres[3].id, "id_module": modules[5].id, "semestre": "S1", "coefficient_filiere": 3},
        ]
        for prog in programmes_data:
            session.add(Programme(**prog))
        session.commit()

        # ==================== 7. EVALUATIONS ====================
        # For each module, create some evaluations
        evaluations_data = [
            {"id_module": modules[0].id, "nom_eval": "Contrôle continu 1", "date_prevue": date(2025, 10, 15), "coefficient_eval": 1.5, "semestre": "S1"},
            {"id_module": modules[0].id, "nom_eval": "Examen final", "date_prevue": date(2026, 1, 10), "coefficient_eval": 2.5, "semestre": "S1"},
            {"id_module": modules[1].id, "nom_eval": "Projet BD", "date_prevue": date(2025, 11, 5), "coefficient_eval": 2.0, "semestre": "S2"},
            {"id_module": modules[3].id, "nom_eval": "TP RDM", "date_prevue": date(2025, 9, 20), "coefficient_eval": 1.0, "semestre": "S1"},
        ]
        evaluations = []
        for eval_data in evaluations_data:
            e = Evaluation(**eval_data)
            session.add(e)
            evaluations.append(e)
        session.commit()

        # ==================== 8. NOTES ====================
        # For each student in a specific class and its modules, insert notes
        # Get students in a class: join via Inscription
        # For simplicity, we'll assign notes to first 3 students for algorithmique evaluation
        notes_data = [
            {"id_etudiant": etudiants[0].id, "id_evaluation": evaluations[0].id, "valeur": 14.5, "date_saisie": datetime.now()},
            {"id_etudiant": etudiants[1].id, "id_evaluation": evaluations[0].id, "valeur": 11.0, "date_saisie": datetime.now()},
            {"id_etudiant": etudiants[2].id, "id_evaluation": evaluations[0].id, "valeur": 9.5, "date_saisie": datetime.now()},
            {"id_etudiant": etudiants[0].id, "id_evaluation": evaluations[1].id, "valeur": 16.0, "date_saisie": datetime.now()},
        ]
        for note in notes_data:
            session.add(Note(**note))
        session.commit()

        # ==================== 9. ABSENCES ====================
        absences_data = [
            {"id_etudiant": etudiants[2].id, "id_module": modules[0].id, "date_absence": date(2025, 9, 12), "nb_heures": 2.0, "justifiee": False, "motif": "Maladie non justifiée"},
            {"id_etudiant": etudiants[4].id, "id_module": modules[4].id, "date_absence": date(2025, 9, 18), "nb_heures": 1.5, "justifiee": True, "motif": "Rendez-vous médical"},
        ]
        for a in absences_data:
            session.add(Absence(**a))
        session.commit()

        # ==================== 10. RETARDS ====================
        retards_data = [
            {"id_etudiant": etudiants[1].id, "id_module": modules[0].id, "date_retard": datetime(2025, 9, 5, 9, 15), "duree_minutes": 15, "justifie": False},
            {"id_etudiant": etudiants[3].id, "id_module": modules[3].id, "date_retard": datetime(2025, 9, 19, 8, 45), "duree_minutes": 10, "justifie": True},
        ]
        for r in retards_data:
            session.add(Retard(**r))
        session.commit()

        # ==================== 11. UTILISATEURS (staff) ====================
        # Use a dummy password hash (in real app use bcrypt). Here just for demo.
        utilisateurs_data = [
            {"nom": "Dupont", "prenom": "Jean", "email": "jean.dupont@univ.fr", "password_hash": "hashed_pwd_1", "role": RoleEnum.ADMIN, "actif": True},
            {"nom": "Durand", "prenom": "Marie", "email": "marie.durand@univ.fr", "password_hash": "hashed_pwd_2", "role": RoleEnum.PROF, "actif": True},
            {"nom": "Moreau", "prenom": "Pierre", "email": "pierre.moreau@univ.fr", "password_hash": "hashed_pwd_3", "role": RoleEnum.PEDAGOGIE, "actif": True},
        ]
        utilisateurs = []
        for u_data in utilisateurs_data:
            u = Utilisateur(**u_data)
            session.add(u)
            utilisateurs.append(u)
        session.commit()

        # ==================== 12. UTILISATEUR_MODULE ====================
        # Link profs to modules
        um_data = [
            {"id_utilisateur": utilisateurs[1].id, "id_module": modules[0].id, "est_responsable": True},
            {"id_utilisateur": utilisateurs[1].id, "id_module": modules[1].id, "est_responsable": False},
            {"id_utilisateur": utilisateurs[1].id, "id_module": modules[2].id, "est_responsable": False},
        ]
        for um in um_data:
            session.add(UtilisateurModule(**um))
        session.commit()

        # ==================== 13. IMPORT_LOG ====================
        import_logs_data = [
            {"nom_fichier": "etudiants_2025.csv", "date_import": datetime.now() - timedelta(days=5), "type_donnees": "etudiants", "nb_lignes_ok": 120, "nb_lignes_rejet": 2, "statut": "SUCCES", "id_auteur": utilisateurs[0].id},
        ]
        for imp in import_logs_data:
            session.add(ImportLog(**imp))
        session.commit()

        # ==================== 14. PARAMETRES_RISQUE ====================
        pr_data = [
            {"type_risque": "Absences", "seuil": 10.0, "operateur": ">=", "annee_scolaire": "2025-2026"},
            {"type_risque": "Notes moyennes", "seuil": 8.0, "operateur": "<", "annee_scolaire": "2025-2026"},
            {"type_risque": "Retards", "seuil": 5, "operateur": ">=", "annee_scolaire": "2025-2026"},
        ]
        parametres = []
        for p in pr_data:
            pr = ParametreRisque(**p)
            session.add(pr)
            parametres.append(pr)
        session.commit()

        # ==================== 15. ALERTES ====================
        # Exemple: alerte pour un étudiant avec trop d'absences
        alertes_data = [
            {"id_etudiant": etudiants[2].id, "id_parametre": parametres[0].id, "date_detection": datetime.now(), "valeur_mesuree": 2.0, "message": "Absences non justifiées répétées", "statut": "Nouvelle", "id_traite_par": None},
            {"id_etudiant": etudiants[4].id, "id_parametre": parametres[0].id, "date_detection": datetime.now(), "valeur_mesuree": 1.5, "message": "Absence non justifiée", "statut": "En cours", "id_traite_par": utilisateurs[2].id},
        ]
        for a in alertes_data:
            session.add(Alerte(**a))
        session.commit()

        print("Database seeded successfully!")