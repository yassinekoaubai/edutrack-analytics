/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, AcademicAlert } from '../types';
import {
  BackendAlert,
  BackendOverview,
  BackendStudent,
  mapBackendAlert,
  mapBackendStudent,
} from './apiMappers';

export interface ApiSyncResult {
  students: Student[];
  alerts: AcademicAlert[];
  overview: BackendOverview | null;
}

export class ApiService {
  private static baseUrlKey = 'edutrack_base_url_v1';
  private static modeKey = 'edutrack_api_mode_v1';

  static getBaseUrl(): string {
    return (
      localStorage.getItem(this.baseUrlKey) ||
      import.meta.env.VITE_API_URL ||
      'http://localhost:8002'
    );
  }

  static setBaseUrl(url: string) {
    localStorage.setItem(this.baseUrlKey, url);
  }

  static getMode(): 'offline' | 'online' {
    return (localStorage.getItem(this.modeKey) as 'offline' | 'online') || 'offline';
  }

  static setMode(mode: 'offline' | 'online') {
    localStorage.setItem(this.modeKey, mode);
  }

  private static async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.getBaseUrl()}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Erreur API (${response.status}): ${detail || response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  static async pingApi(url?: string): Promise<boolean> {
    const baseUrl = url ?? this.getBaseUrl();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${baseUrl}/dashboard/overview`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  static async uploadImportFile(
    type: 'etudiants' | 'modules' | 'retards' | 'absences' | 'evaluations' | 'notes',
    file: File
  ): Promise<{ success: boolean; message: string; rowCount: number }> {
    const url = `${this.getBaseUrl()}/imports/${type}`;
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Erreur d'importation (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Importation complétée',
      rowCount: data.nb_lignes_ok ?? data.rowCount ?? 0,
    };
  }

  static async getOverview(): Promise<BackendOverview | null> {
    if (this.getMode() === 'offline') return null;
    return this.request<BackendOverview>('/dashboard/overview');
  }

  static async getModuleStats(): Promise<any> {
    if (this.getMode() === 'offline') return null;
    return this.request('/dashboard/modules/stats');
  }

  static async getClassComparison(): Promise<any> {
    if (this.getMode() === 'offline') return null;
    return this.request('/dashboard/classes/compare');
  }

  static async getAlerts(): Promise<AcademicAlert[]> {
    if (this.getMode() === 'offline') return [];
    const data = await this.request<BackendAlert[]>('/alerts/');
    return data.map(mapBackendAlert);
  }

  static async getStudents(): Promise<Student[]> {
    if (this.getMode() === 'offline') return [];
    const data = await this.request<BackendStudent[]>('/students/');
    return data.map(mapBackendStudent);
  }

  static async getStudentById(id: string): Promise<any> {
    if (this.getMode() === 'offline') return null;
    return this.request(`/students/${id}`);
  }

  static async syncFromBackend(): Promise<ApiSyncResult> {
    const [students, alerts, overview] = await Promise.all([
      this.getStudents(),
      this.getAlerts(),
      this.getOverview(),
    ]);

    return { students, alerts, overview };
  }
}
