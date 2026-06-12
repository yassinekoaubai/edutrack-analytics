# EduTrack Analytics

EduTrack Analytics is a comprehensive student performance monitoring and predictive analytics platform. It enables academic institutions to transform raw data into actionable insights, helping educators identify at-risk students early and optimize pedagogical strategies through interactive visualizations and automated reporting.

## 🚀 Features

- **Advanced Data Ingestion**: CSV/Excel import with a robust cleaning and normalization pipeline powered by Pandas.
- **Interactive Dashboard**: High-level KPIs and 5 specialized visualizations using Recharts (GPA distribution, success rates, etc.).
- **Academic Risk Detection**: Automated alert system that flags students based on low grades or excessive absences.
- **Student Profiles**: Detailed individual pages featuring historical grades, attendance records, and calculated risk scores.
- **Comparative Analytics**: Multi-level comparison tools for classes, academic branches (filières), and course modules.
- **Secure Access**: Protected environment featuring JWT-based authentication and role-based access control.

## 📂 Project Structure

```text
edutrack-analytics/
├── eduTrack-backend/          # FastAPI Backend
│   ├── src/
│   │   ├── models/            # SQLAlchemy/SQLModel database entities
│   │   ├── schemas/           # Pydantic data validation models
│   │   ├── routers/           # API route handlers
│   │   ├── services/          # Business logic & data processing
│   │   ├── database.py        # Database configuration
│   │   └── main.py            # Application entry point
│   └── requirements.txt
├── eduTrack-frontend/         # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components & charts
│   │   ├── pages/             # Page-level components
│   │   ├── hooks/             # Custom React hooks
│   │   └── services/          # API client and service layers
│   └── package.json
└── data/                      # Data storage for staging and raw files
```

## 🛠️ Installation & Setup

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd eduTrack-backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   uvicorn src.main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd eduTrack-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## ⚙️ Environment Variables

### Backend (`.env`)
- `DATABASE_URL`: SQLite connection string (e.g., `sqlite:///./edutrack.db`)
- `SECRET_KEY`: Long random string for JWT signing
- `ALGORITHM`: Encryption algorithm (default: `HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token validity duration

### Frontend (`.env`)
- `VITE_API_BASE_URL`: URL of the FastAPI backend (e.g., `http://localhost:8000`)

## 🛣️ API Endpoints

| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/login` | Authenticate user and receive JWT token |
| `GET` | `/dashboard/overview` | Retrieve global KPIs and metrics |
| `GET` | `/students/` | List all students with class assignments |
| `GET` | `/students/{id}` | Get detailed student profile and risk score |
| `GET` | `/alerts/` | List identified at-risk students |
| `POST` | `/imports/{type}` | Upload CSV/Excel for automated ingestion |
| `GET` | `/classes/compare` | Cross-class performance comparison |
| `GET` | `/modules/stats` | Performance statistics per course module |

## 📊 Database Schema

| Table | Main Columns |
| :--- | :--- |
| `utilisateurs` | `id`, `email`, `password_hash`, `role` (ADMIN, PROF, etc.) |
| `etudiants` | `id`, `nom`, `prenom`, `email`, `statut` |
| `classes` | `id`, `nom`, `niveau`, `annee_scolaire`, `id_filiere` |
| `modules` | `id`, `nom`, `nombre_horaire`, `seuil_validation` |
| `notes` | `id`, `id_etudiant`, `id_evaluation`, `valeur` |
| `absences` | `id`, `id_etudiant`, `id_module`, `nb_heures`, `justifiee` |
| `alertes` | `id`, `id_etudiant`, `message`, `statut`, `valeur_mesuree` |

## 📸 Screenshots

*(Placeholder: Add screenshots of the Dashboard, Student Profile, and Import Interface here to demonstrate the UI/UX)*

---
Developed as part of the EduTrack Analytics performance monitoring suite.
