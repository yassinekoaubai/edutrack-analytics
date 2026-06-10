/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, Module, Grade, Absence, Tardy, Evaluation, ImportLog, AcademicAlert } from '../types';

export const INITIAL_STUDENTS: Student[] = [
  { id: 'STD-101', firstName: 'Youssef', lastName: 'Amrani', className: 'M1-DATA', email: 'y.amrani@ynov.ma', createdAt: '2026-01-15', status: 'Excellent' },
  { id: 'STD-102', firstName: 'Sarah', lastName: 'Bennani', className: 'M1-DATA', email: 's.bennani@ynov.ma', createdAt: '2026-01-15', status: 'Excellent' },
  { id: 'STD-103', firstName: 'Amine', lastName: 'El Mansouri', className: 'M1-DATA', email: 'a.elmansouri@ynov.ma', createdAt: '2026-01-16', status: 'Régulier' },
  { id: 'STD-104', firstName: 'Khadija', lastName: 'Tazi', className: 'M1-DATA', email: 'k.tazi@ynov.ma', createdAt: '2026-01-16', status: 'Régulier' },
  { id: 'STD-105', firstName: 'Mehdi', lastName: 'Chraibi', className: 'M1-DATA', email: 'm.chraibi@ynov.ma', createdAt: '2026-01-17', status: 'Irrégulier' },
  { id: 'STD-106', firstName: 'Ghita', lastName: 'Alaoui', className: 'M1-DATA', email: 'g.alaoui@ynov.ma', createdAt: '2026-01-17', status: 'À risque' },
  { id: 'STD-107', firstName: 'Anass', lastName: 'Fadli', className: 'M1-DATA', email: 'a.fadli@ynov.ma', createdAt: '2026-01-18', status: 'En progression' },
  { id: 'STD-108', firstName: 'Zineb', lastName: 'Kabbaj', className: 'M1-DATA', email: 'z.kabbaj@ynov.ma', createdAt: '2026-01-18', status: 'Régulier' },
  { id: 'STD-109', firstName: 'Hamza', lastName: 'Moutawakil', className: 'M1-DATA', email: 'h.moutawakil@ynov.ma', createdAt: '2026-01-19', status: 'À risque' },
  { id: 'STD-110', firstName: 'Salma', lastName: 'Belkhayat', className: 'M1-DATA', email: 's.belkhayat@ynov.ma', createdAt: '2026-01-20', status: 'Excellent' },
  
  { id: 'STD-201', firstName: 'Othmane', lastName: 'Seddiki', className: 'M2-BI', email: 'o.seddiki@ynov.ma', createdAt: '2026-01-15', status: 'Régulier' },
  { id: 'STD-202', firstName: 'Ines', lastName: 'Jouahri', className: 'M2-BI', email: 'i.jouahri@ynov.ma', createdAt: '2026-01-15', status: 'Excellent' },
  { id: 'STD-203', firstName: 'Tariq', lastName: 'Naji', className: 'M2-BI', email: 't.naji@ynov.ma', createdAt: '2026-01-16', status: 'Régulier' },
  { id: 'STD-204', firstName: 'Layla', lastName: 'Zouhair', className: 'M2-BI', email: 'l.zouhair@ynov.ma', createdAt: '2026-01-16', status: 'En progression' },
  { id: 'STD-205', firstName: 'Walid', lastName: 'Sajid', className: 'M2-BI', email: 'w.sajid@ynov.ma', createdAt: '2026-01-17', status: 'À risque' },
  { id: 'STD-206', firstName: 'Nisrine', lastName: 'Idrissi', className: 'M2-BI', email: 'n.idrissi@ynov.ma', createdAt: '2026-01-17', status: 'Régulier' },
  { id: 'STD-207', firstName: 'Saad', lastName: 'Tahiri', className: 'M2-BI', email: 's.tahiri@ynov.ma', createdAt: '2026-01-18', status: 'Irrégulier' },
  { id: 'STD-208', firstName: 'Meriem', lastName: 'Berrada', className: 'M2-BI', email: 'm.berrada@ynov.ma', createdAt: '2026-01-18', status: 'Excellent' },
  { id: 'STD-209', firstName: 'Yassir', lastName: 'Filali', className: 'M2-BI', email: 'y.filali@ynov.ma', createdAt: '2026-01-19', status: 'En progression' },
  { id: 'STD-210', firstName: 'Lina', lastName: 'Guessous', className: 'M2-BI', email: 'l.guessous@ynov.ma', createdAt: '2026-01-20', status: 'Régulier' }
];

export const INITIAL_MODULES: Module[] = [
  { id: 'MOD-DS', name: 'Data Science & Pandas', professor: 'Dr. Rachid Alami', coefficients: 4 },
  { id: 'MOD-PY', name: 'Python Programming', professor: 'Prof. Fatima Zahra', coefficients: 3 },
  { id: 'MOD-BI', name: 'Business Intelligence & ETL', professor: 'Dr. Karim Bensalah', coefficients: 4 },
  { id: 'MOD-ML', name: 'Machine Learning & Scikit-learn', professor: 'Dr. Adil El Hankari', coefficients: 5 },
  { id: 'MOD-SQL', name: 'Relational Databases & SQL', professor: 'Prof. Leila Meriem', coefficients: 3 }
];

export const INITIAL_EVALUATIONS: Evaluation[] = [
  { id: 'EVAL-DS-CC1', moduleId: 'MOD-DS', name: 'Contrôle Continu 1', maxScore: 20, date: '2026-02-15' },
  { id: 'EVAL-DS-EX', moduleId: 'MOD-DS', name: 'Examen Final', maxScore: 20, date: '2026-04-10' },
  
  { id: 'EVAL-PY-CC1', moduleId: 'MOD-PY', name: 'Contrôle Continu 1', maxScore: 20, date: '2026-02-20' },
  { id: 'EVAL-PY-EX', moduleId: 'MOD-PY', name: 'Examen Final', maxScore: 20, date: '2026-04-15' },

  { id: 'EVAL-BI-CC1', moduleId: 'MOD-BI', name: 'Contrôle Continu 1', maxScore: 20, date: '2026-02-28' },
  { id: 'EVAL-BI-EX', moduleId: 'MOD-BI', name: 'Examen Final', maxScore: 20, date: '2026-04-20' },

  { id: 'EVAL-ML-CC1', moduleId: 'MOD-ML', name: 'Contrôle Continu 1', maxScore: 20, date: '2026-03-05' },
  { id: 'EVAL-ML-EX', moduleId: 'MOD-ML', name: 'Examen Final', maxScore: 20, date: '2026-04-25' },

  { id: 'EVAL-SQL-CC1', moduleId: 'MOD-SQL', name: 'Contrôle Continu 1', maxScore: 20, date: '2026-02-10' },
  { id: 'EVAL-SQL-EX', moduleId: 'MOD-SQL', name: 'Examen Final', maxScore: 20, date: '2026-04-05' }
];

// Helper to generate custom baseline grade matching student profile
const getBaseScore = (status: string, minSeed: number): number => {
  if (status === 'Excellent') return Math.min(20, 16 + minSeed * 4);
  if (status === 'Régulier') return Math.min(20, 12 + minSeed * 4);
  if (status === 'En progression') return Math.min(20, 10 + minSeed * 5);
  if (status === 'Irrégulier') return Math.min(20, 9 + minSeed * 6);
  return Math.min(20, 5 + minSeed * 6); // À risque
};

export const generateInitialGrades = (): Grade[] => {
  const grades: Grade[] = [];
  let gId = 1;

  INITIAL_STUDENTS.forEach((student, sIndex) => {
    INITIAL_EVALUATIONS.forEach((evalItem) => {
      // Deterministic pseudo-randomness based on student index and eval index
      const seed = ((sIndex * 7 + evalItem.id.charCodeAt(8) * 3) % 100) / 100;
      let score = getBaseScore(student.status, seed);
      
      // Let's model "Progression" students having better grades on Examen Final (EX) than CC1
      if (student.status === 'En progression' && evalItem.name.includes('Examen Final')) {
        score = Math.min(20, score + 2.5);
      }

      // Rounded to two decimals or nearest half point
      score = Math.round(score * 2) / 2;

      grades.push({
        id: `GRD-${gId++}`,
        studentId: student.id,
        moduleId: evalItem.moduleId,
        evaluationId: evalItem.id,
        score,
        coefficient: evalItem.name.includes('Examen Final') ? 0.6 : 0.4,
        date: evalItem.date
      });
    });
  });

  return grades;
};

export const generateInitialAbsences = (): Absence[] => {
  const absences: Absence[] = [];
  let aId = 1;

  INITIAL_STUDENTS.forEach((student, sIndex) => {
    // Highly absent student profiles
    if (student.status === 'À risque' || student.status === 'Irrégulier') {
      // 4 to 6 absences
      const count = student.status === 'À risque' ? 5 : 3;
      for (let i = 0; i < count; i++) {
        const modIndex = (sIndex + i) % INITIAL_MODULES.length;
        const moduleId = INITIAL_MODULES[modIndex].id;
        const justified = i === 1 && sIndex % 2 === 0; // Occasionally justified
        absences.push({
          id: `ABS-${aId++}`,
          studentId: student.id,
          moduleId,
          date: `2026-03-${10 + i * 4}`,
          hours: 2,
          justified,
          notes: justified ? 'Certificat médical reçu' : 'Absence non documentée'
        });
      }
    } else if (student.status === 'Régulier' || student.status === 'En progression') {
      // 1 or 2 absences
      if (sIndex % 2 === 0) {
        absences.push({
          id: `ABS-${aId++}`,
          studentId: student.id,
          moduleId: INITIAL_MODULES[sIndex % INITIAL_MODULES.length].id,
          date: '2026-03-05',
          hours: 2,
          justified: false,
          notes: 'Panne de transport'
        });
      }
    }
  });

  return absences;
};

export const generateInitialTardiness = (): Tardy[] => {
  const tardies: Tardy[] = [];
  let tId = 1;

  INITIAL_STUDENTS.forEach((student, sIndex) => {
    if (student.status === 'À risque' || student.status === 'Irrégulier') {
      const count = student.status === 'À risque' ? 4 : 2;
      for (let i = 0; i < count; i++) {
        const modIndex = (sIndex + i + 1) % INITIAL_MODULES.length;
        tardies.push({
          id: `TDY-${tId++}`,
          studentId: student.id,
          moduleId: INITIAL_MODULES[modIndex].id,
          date: `2026-03-${12 + i * 5}`,
          minutes: 10 + i * 5,
          notes: 'Retard de bus'
        });
      }
    } else if (sIndex % 3 === 0) {
      tardies.push({
        id: `TDY-${tId++}`,
        studentId: student.id,
        moduleId: INITIAL_MODULES[0].id,
        date: '2026-02-18',
        minutes: 5,
        notes: 'Retard de 5 minutes'
      });
    }
  });

  return tardies;
};

export const INITIAL_IMPORT_LOGS: ImportLog[] = [
  { id: 'IMP-001', timestamp: '2026-05-10 09:30', fileName: 'etudiants_ynov_2026.xlsx', type: 'students', rowCount: 20, status: 'Succès', details: 'Tous les étudiants ont été importés et validés par rapport aux classes valides (M1-DATA, M2-BI).' },
  { id: 'IMP-002', timestamp: '2026-05-10 09:45', fileName: 'modules_data_bi.xlsx', type: 'modules', rowCount: 5, status: 'Succès', details: 'Nouveaux modules configurés avec coefficients académiques.' },
  { id: 'IMP-003', timestamp: '2026-05-11 10:15', fileName: 'evaluations_trimestre1.xlsx', type: 'evaluations', rowCount: 10, status: 'Succès', details: 'Évaluations associées aux modules correspondants.' },
  { id: 'IMP-004', timestamp: '2026-05-11 11:00', fileName: 'notes_brutes_evals.xlsx', type: 'grades', rowCount: 100, status: 'Avertissement', details: 'Données nettoyées automatiquement : 3 doublons supprimés, 2 valeurs manquantes complétées par les moyennes.' }
];

export const generateInitialAlerts = (): AcademicAlert[] => {
  return [
    {
      id: 'ALT-001',
      studentId: 'STD-106',
      type: 'GPA',
      severity: 'haute',
      title: 'Moyenne Insuffisante',
      message: 'Ghita Alaoui présente une moyenne générale de 7.8/20, bien inférieure au seuil de validation.',
      date: '2026-05-12',
      status: 'active'
    },
    {
      id: 'ALT-002',
      studentId: 'STD-109',
      type: 'ABSENCE',
      severity: 'haute',
      title: 'Absences Excessives',
      message: 'Hamza Moutawakil a cumulé 10 heures d\'absences non justifiées dans les modules clés.',
      date: '2026-05-13',
      status: 'active'
    },
    {
      id: 'ALT-003',
      studentId: 'STD-205',
      type: 'GPA',
      severity: 'haute',
      title: 'Moyenne Critique',
      message: 'Walid Sajid présente une moyenne de 8.2/20 avec un cumul de 8 heures d\'absences.',
      date: '2026-05-14',
      status: 'active'
    },
    {
      id: 'ALT-004',
      studentId: 'STD-105',
      type: 'TARDY',
      severity: 'moyenne',
      title: 'Retards Récurrents',
      message: 'Mehdi Chraibi cumule 4 retards distincts totalisant 50 minutes de cours manqués.',
      date: '2026-05-14',
      status: 'active'
    },
    {
      id: 'ALT-005',
      studentId: 'STD-207',
      type: 'PERFORMANCE_DROP',
      severity: 'moyenne',
      title: 'Chute de Performance',
      message: 'Saad Tahiri a accusé une baisse de -3.5 points sur son examen final de Machine Learning comparé aux contrôles continus.',
      date: '2026-05-15',
      status: 'active'
    }
  ];
};

// Clean and local-storage states management
export interface AppState {
  students: Student[];
  modules: Module[];
  grades: Grade[];
  absences: Absence[];
  tardiness: Tardy[];
  evaluations: Evaluation[];
  importLogs: ImportLog[];
  alerts: AcademicAlert[];
}

export function loadStateFromStorage(): AppState {
  try {
    const cached = localStorage.getItem('edutrack_analytics_state_v1');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.error('Error loading state from LocalStorage', err);
  }

  // Pre-seed everything
  const defaultState: AppState = {
    students: INITIAL_STUDENTS,
    modules: INITIAL_MODULES,
    grades: generateInitialGrades(),
    absences: generateInitialAbsences(),
    tardiness: generateInitialTardiness(),
    evaluations: INITIAL_EVALUATIONS,
    importLogs: INITIAL_IMPORT_LOGS,
    alerts: generateInitialAlerts()
  };

  saveStateToStorage(defaultState);
  return defaultState;
}

export function saveStateToStorage(state: AppState) {
  try {
    localStorage.setItem('edutrack_analytics_state_v1', JSON.stringify(state));
  } catch (err) {
    console.error('Error saving state to LocalStorage', err);
  }
}
