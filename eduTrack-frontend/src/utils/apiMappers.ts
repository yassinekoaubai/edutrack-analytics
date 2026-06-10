/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, AcademicAlert } from '../types';

export interface BackendStudent {
  id: number;
  nom: string;
  prenom: string;
  email?: string | null;
  statut: string;
  annee_entree?: number | null;
  classe?: string | null;
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
}

const STATUS_MAP: Record<string, Student['status']> = {
  Actif: 'Régulier',
  Excellent: 'Excellent',
  'En progression': 'En progression',
  Irrégulier: 'Irrégulier',
  'À risque': 'À risque',
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
