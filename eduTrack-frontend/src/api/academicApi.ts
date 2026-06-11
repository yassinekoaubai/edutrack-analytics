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
  LoginRequest,
  AuthToken,
} from '../types';
import {
  BackendAbsence,
  BackendAlert,
  BackendClassCompare,
  BackendEvaluation,
  BackendGradeBucket,
  BackendImportLog,
  BackendModule,
  BackendNote,
  BackendOverview,
  BackendRetard,
  BackendScatterPoint,
  BackendStudent,
  mapBackendAbsence,
  mapBackendAlert,
  mapBackendEvaluation,
  mapBackendImportLog,
  mapBackendModule,
  mapBackendNote,
  mapBackendRetard,
  mapBackendStudent,
} from '../utils/apiMappers';
import { apiClient, getBaseUrl } from './client';

export async function pingApi(url?: string): Promise<boolean> {
  try {
    const base = url ?? getBaseUrl();
    await apiClient.get('/dashboard/overview', { baseURL: base, timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

export async function getStudents(): Promise<Student[]> {
  const { data } = await apiClient.get<BackendStudent[]>('/students/');
  return data.map(mapBackendStudent);
}

export async function getModules(): Promise<Module[]> {
  const { data } = await apiClient.get<BackendModule[]>('/modules');
  return data.map(mapBackendModule);
}

export async function getEvaluations(): Promise<Evaluation[]> {
  const { data } = await apiClient.get<BackendEvaluation[]>('/evaluations');
  return data.map(mapBackendEvaluation);
}

export async function getGrades(): Promise<Grade[]> {
  const { data } = await apiClient.get<BackendNote[]>('/notes');
  return data.map(mapBackendNote);
}

export async function getAbsences(): Promise<Absence[]> {
  const { data } = await apiClient.get<BackendAbsence[]>('/absences');
  return data.map(mapBackendAbsence);
}

export async function getTardiness(): Promise<Tardy[]> {
  const { data } = await apiClient.get<BackendRetard[]>('/retards');
  return data.map(mapBackendRetard);
}

export async function getAlerts(): Promise<AcademicAlert[]> {
  const { data } = await apiClient.get<BackendAlert[]>('/alerts/');
  return data.map(mapBackendAlert);
}

export async function getImportLogs(): Promise<ImportLog[]> {
  const { data } = await apiClient.get<BackendImportLog[]>('/import-logs');
  return data.map(mapBackendImportLog);
}

export async function getOverview(): Promise<BackendOverview> {
  const { data } = await apiClient.get<BackendOverview>('/dashboard/overview');
  return data;
}

export async function getClassComparison(): Promise<BackendClassCompare[]> {
  const { data } = await apiClient.get<BackendClassCompare[]>('/dashboard/classes/compare');
  return data;
}

export async function getGradeDistribution(): Promise<BackendGradeBucket[]> {
  const { data } = await apiClient.get<BackendGradeBucket[]>('/dashboard/grades/distribution');
  return data;
}

export async function getScatterData(): Promise<BackendScatterPoint[]> {
  const { data } = await apiClient.get<BackendScatterPoint[]>('/dashboard/scatter');
  return data;
}

export async function getStudentById(id: string): Promise<BackendStudent> {
  const { data } = await apiClient.get<BackendStudent>(`/students/${id}`);
  return data;
}

export async function login(payload: LoginRequest): Promise<AuthToken> {
  const { data } = await apiClient.post<AuthToken>('/auth/login', payload);
  return data;
}

export async function uploadImportFile(
  type: 'etudiants' | 'modules' | 'retards' | 'absences' | 'evaluations' | 'notes',
  file: File
): Promise<{ success: boolean; message: string; rowCount: number }> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post(`/imports/${type}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return {
    success: true,
    message: data.message || 'Importation complétée',
    rowCount: data.nb_lignes_ok ?? data.rowCount ?? 0,
  };
}
