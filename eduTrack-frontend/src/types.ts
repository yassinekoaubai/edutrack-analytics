/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  id: string; // e.g., "STD-001"
  firstName: string;
  lastName: string;
  className: string; // e.g., "M1-DATA", "M2-BI"
  email: string;
  createdAt: string;
  status: 'Excellent' | 'Régulier' | 'Irrégulier' | 'En progression' | 'À risque';
}

export interface Module {
  id: string; // e.g., "MOD-DATA"
  name: string;
  professor: string;
  coefficients: number;
}

export interface Grade {
  id: string;
  studentId: string;
  moduleId: string;
  evaluationId: string;
  score: number; // 0 to 20
  coefficient: number;
  date: string;
}

export interface Absence {
  id: string;
  studentId: string;
  moduleId: string;
  date: string;
  hours: number;
  justified: boolean;
  notes?: string;
}

export interface Tardy {
  id: string;
  studentId: string;
  moduleId: string;
  date: string;
  minutes: number;
  notes?: string;
}

export interface Evaluation {
  id: string;
  moduleId: string;
  name: string; // e.g., "CC1", "Examen Final"
  maxScore: number;
  date: string;
}

export interface ImportLog {
  id: string;
  timestamp: string;
  fileName: string;
  type: 'students' | 'modules' | 'tardy' | 'absences' | 'evaluations' | 'grades';
  rowCount: number;
  status: 'Succès' | 'Erreur' | 'Avertissement';
  details: string;
  errors?: string[];
}

export interface AcademicAlert {
  id: string;
  studentId: string;
  type: 'GPA' | 'ABSENCE' | 'TARDY' | 'PERFORMANCE_DROP';
  severity: 'haute' | 'moyenne' | 'faible';
  title: string;
  message: string;
  date: string;
  status: 'active' | 'resolue' | 'ignoree';
}

export interface MLMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusionMatrix: {
    tp: number; // True Positive
    fn: number; // False Negative
    fp: number; // False Positive
    tn: number; // True Negative
  };
}

export interface APIConfig {
  baseUrl: string;
  mode: 'offline' | 'online';
}
