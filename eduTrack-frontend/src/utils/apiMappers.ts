/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Student,
  Module,
  Grade,
  Absence,
  Tardy,
  Evaluation,
  ImportLog,
  AcademicAlert,
} from '../types';

export interface BackendStudent {
  id: number;
  nom: string;
  prenom: string;
  email?: string | null;
  statut: string;
  annee_entree?: number | null;
  classe?: string | null;
  // Detailed fields
  notes?: Array<{ module: string; valeur: number | null }> | null;
  absences_count?: number | null;
  retards_count?: number | null;
  classement?: number | null;
}

export interface BackendModule {
  id: number;
  nom: string;
  professor?: string | null;
  coefficient: number;
}

export interface BackendEvaluation {
  id: number;
  id_module: number;
  nom_eval?: string | null;
  date_prevue?: string | null;
  coefficient_eval: number;
}

export interface BackendNote {
  id: number;
  id_etudiant: number;
  id_evaluation: number;
  id_module: number;
  valeur?: number | null;
  coefficient_eval: number;
  date_saisie: string;
}

export interface BackendAbsence {
  id: number;
  id_etudiant: number;
  id_module: number;
  date_absence: string;
  nb_heures?: number | null;
  justifiee: boolean;
  motif?: string | null;
}

export interface BackendRetard {
  id: number;
  id_etudiant: number;
  id_module: number;
  date_retard: string;
  duree_minutes?: number | null;
  justifie: boolean;
}

export interface BackendImportLog {
  id: number;
  nom_fichier?: string | null;
  date_import: string;
  type_donnees?: string | null;
  nb_lignes_ok: number;
  nb_lignes_rejet: number;
  statut?: string | null;
}

export interface BackendAlert {
  id: number;
  student_id: number;
  student_name: string;
  type_alerte: string;
  description: string;
  date_generation: string;
}

export interface BackendOverview {
  moyenne_generale: number;
  taux_reussite: number;
  taux_absence: number;
  nombre_etudiants_a_risque: number;
  progression_globale: string;
  total_students: number;
  students_passing: number;
  unjustified_absences: number;
  critical_alerts: number;
}

export interface BackendClassCompare {
  class_name: string;
  moyenne_generale: number;
  taux_absence: number;
  total_students: number;
}

export interface BackendGradeBucket {
  label: string;
  min_score: number;
  max_score: number;
  count: number;
}

export interface BackendScatterPoint {
  student_id: number;
  student_name: string;
  gpa: number;
  total_absences: number;
  statut: string;
}

const STATUS_MAP: Record<string, Student['status']> = {
  Actif: 'Régulier',
  Excellent: 'Excellent',
  'En progression': 'En progression',
  Irrégulier: 'Irrégulier',
  'À risque': 'À risque',
};

const IMPORT_TYPE_MAP: Record<string, ImportLog['type']> = {
  etudiants: 'students',
  modules: 'modules',
  retards: 'tardy',
  absences: 'absences',
  evaluations: 'evaluations',
  notes: 'grades',
};

function mapStudentStatus(statut: string): Student['status'] {
  return STATUS_MAP[statut] ?? 'Régulier';
}

function mapAlertType(typeAlerte: string): AcademicAlert['type'] {
  const normalized = typeAlerte.toLowerCase();
  if (normalized.includes('absence')) return 'ABSENCE';
  if (normalized.includes('retard')) return 'TARDY';
  if (normalized.includes('moyenne') || normalized.includes('note')) return 'GPA';
  return 'PERFORMANCE_DROP';
}

export function mapBackendStudent(raw: BackendStudent): Student {
  return {
    id: String(raw.id),
    firstName: raw.prenom,
    lastName: raw.nom,
    className: raw.classe ?? 'Non assigné',
    email: raw.email ?? '',
    createdAt: raw.annee_entree ? `${raw.annee_entree}-09-01` : new Date().toISOString().split('T')[0],
    status: mapStudentStatus(raw.statut),
  };
}

export function mapBackendModule(raw: BackendModule): Module {
  return {
    id: String(raw.id),
    name: raw.nom,
    professor: raw.professor ?? 'Non assigné',
    coefficients: raw.coefficient,
  };
}

export function mapBackendEvaluation(raw: BackendEvaluation): Evaluation {
  return {
    id: String(raw.id),
    moduleId: String(raw.id_module),
    name: raw.nom_eval ?? 'Évaluation',
    maxScore: 20,
    date: raw.date_prevue ?? new Date().toISOString().split('T')[0],
  };
}

export function mapBackendNote(raw: BackendNote): Grade {
  return {
    id: String(raw.id),
    studentId: String(raw.id_etudiant),
    moduleId: String(raw.id_module),
    evaluationId: String(raw.id_evaluation),
    score: raw.valeur ?? 0,
    coefficient: raw.coefficient_eval,
    date: raw.date_saisie?.split('T')[0] ?? new Date().toISOString().split('T')[0],
  };
}

export function mapBackendAbsence(raw: BackendAbsence): Absence {
  return {
    id: String(raw.id),
    studentId: String(raw.id_etudiant),
    moduleId: String(raw.id_module),
    date: raw.date_absence,
    hours: raw.nb_heures ?? 0,
    justified: raw.justifiee,
    notes: raw.motif ?? undefined,
  };
}

export function mapBackendRetard(raw: BackendRetard): Tardy {
  return {
    id: String(raw.id),
    studentId: String(raw.id_etudiant),
    moduleId: String(raw.id_module),
    date: raw.date_retard?.split('T')[0] ?? new Date().toISOString().split('T')[0],
    minutes: raw.duree_minutes ?? 0,
  };
}

export function mapBackendImportLog(raw: BackendImportLog): ImportLog {
  const typeKey = raw.type_donnees?.toLowerCase() ?? 'students';
  return {
    id: `IMP-${raw.id}`,
    timestamp: new Date(raw.date_import).toLocaleString('fr-FR'),
    fileName: raw.nom_fichier ?? 'import.csv',
    type: IMPORT_TYPE_MAP[typeKey] ?? 'students',
    rowCount: raw.nb_lignes_ok,
    status: raw.statut === 'Erreur' ? 'Erreur' : raw.nb_lignes_rejet > 0 ? 'Avertissement' : 'Succès',
    details: `${raw.nb_lignes_ok} ligne(s) importée(s), ${raw.nb_lignes_rejet} rejetée(s).`,
  };
}

export function mapBackendAlert(raw: BackendAlert): AcademicAlert {
  return {
    id: String(raw.id),
    studentId: String(raw.student_id),
    type: mapAlertType(raw.type_alerte),
    severity: 'moyenne',
    title: raw.type_alerte,
    message: raw.description || `Alerte pour ${raw.student_name}`,
    date: raw.date_generation?.split('T')[0] ?? new Date().toISOString().split('T')[0],
    status: 'active',
  };
}
