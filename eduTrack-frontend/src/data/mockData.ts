/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, Module, Grade, Absence, Tardy, Evaluation, ImportLog, AcademicAlert } from '../types';

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

export const EMPTY_STATE: AppState = {
  students: [],
  modules: [],
  grades: [],
  absences: [],
  tardiness: [],
  evaluations: [],
  importLogs: [],
  alerts: [],
};
