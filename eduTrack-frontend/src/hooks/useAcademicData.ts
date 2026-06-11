/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
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
import * as academicApi from '../services/academicApi';
import { BackendOverview } from '../utils/apiMappers';

interface FetchState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useFetch<T>(
  fetcher: () => Promise<T>,
  initial: T,
  refreshKey = 0
): FetchState<T> {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur de chargement');
          setData(initial);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey, tick]);

  return { data, loading, error, refetch };
}

export function useStudents(refreshKey = 0) {
  return useFetch(academicApi.getStudents, [] as Student[], refreshKey);
}

export function useModules(refreshKey = 0) {
  return useFetch(academicApi.getModules, [] as Module[], refreshKey);
}

export function useEvaluations(refreshKey = 0) {
  return useFetch(academicApi.getEvaluations, [] as Evaluation[], refreshKey);
}

export function useGrades(refreshKey = 0) {
  return useFetch(academicApi.getGrades, [] as Grade[], refreshKey);
}

export function useAbsences(refreshKey = 0) {
  return useFetch(academicApi.getAbsences, [] as Absence[], refreshKey);
}

export function useTardiness(refreshKey = 0) {
  return useFetch(academicApi.getTardiness, [] as Tardy[], refreshKey);
}

export function useAlerts(refreshKey = 0) {
  return useFetch(academicApi.getAlerts, [] as AcademicAlert[], refreshKey);
}

export function useImportLogs(refreshKey = 0) {
  return useFetch(academicApi.getImportLogs, [] as ImportLog[], refreshKey);
}

export function useStudentProfile(studentId: string | null, refreshKey = 0) {
  const fetcher = useCallback(() => {
    if (!studentId) return Promise.resolve(null);
    return academicApi.getStudentById(studentId);
  }, [studentId]);

  return useFetch(fetcher, null, refreshKey + (studentId ? 1 : 0));
}

export function useOverview(refreshKey = 0) {
  const empty: BackendOverview = {
    moyenne_generale: 0,
    taux_reussite: 0,
    taux_absence: 0,
    nombre_etudiants_a_risque: 0,
    progression_globale: 'Stable',
    total_students: 0,
    students_passing: 0,
    unjustified_absences: 0,
    critical_alerts: 0,
  };
  return useFetch(academicApi.getOverview, empty, refreshKey);
}

export function useClassComparison(refreshKey = 0) {
  return useFetch(academicApi.getClassComparison, [], refreshKey);
}

export function useGradeDistribution(refreshKey = 0) {
  return useFetch(academicApi.getGradeDistribution, [], refreshKey);
}

export function useModuleStats(refreshKey = 0) {
  return useFetch(academicApi.getModuleStats, [], refreshKey);
}

export function useScatterData(refreshKey = 0) {
  return useFetch(academicApi.getScatterData, [], refreshKey);
}

export function useDashboardOverview(refreshKey = 0) {
  const overview = useOverview(refreshKey);
  const classComparison = useClassComparison(refreshKey);
  const gradeDistribution = useGradeDistribution(refreshKey);
  const moduleStats = useModuleStats(refreshKey);
  const scatter = useScatterData(refreshKey);
  const alerts = useAlerts(refreshKey);

  const loading =
    overview.loading ||
    classComparison.loading ||
    gradeDistribution.loading ||
    moduleStats.loading ||
    scatter.loading ||
    alerts.loading;
  const error =
    overview.error ||
    classComparison.error ||
    gradeDistribution.error ||
    moduleStats.error ||
    scatter.error ||
    alerts.error;

  return {
    overview: overview.data,
    classComparison: classComparison.data,
    gradeDistribution: gradeDistribution.data,
    moduleStats: moduleStats.data,
    scatter: scatter.data,
    alerts: alerts.data,
    loading,
    error,
  };
}

export function useAnalyticsData(refreshKey = 0) {
  const students = useStudents(refreshKey);
  const modules = useModules(refreshKey);
  const grades = useGrades(refreshKey);
  const absences = useAbsences(refreshKey);
  const tardiness = useTardiness(refreshKey);

  const loading =
    students.loading || modules.loading || grades.loading || absences.loading || tardiness.loading;
  const error =
    students.error || modules.error || grades.error || absences.error || tardiness.error;

  return {
    students: students.data,
    modules: modules.data,
    grades: grades.data,
    absences: absences.data,
    tardiness: tardiness.data,
    loading,
    error,
  };
}

export function useStudentsData(refreshKey = 0) {
  const students = useStudents(refreshKey);
  const modules = useModules(refreshKey);
  const grades = useGrades(refreshKey);
  const absences = useAbsences(refreshKey);
  const tardiness = useTardiness(refreshKey);
  const evaluations = useEvaluations(refreshKey);

  const loading =
    students.loading ||
    modules.loading ||
    grades.loading ||
    absences.loading ||
    tardiness.loading ||
    evaluations.loading;
  const error =
    students.error ||
    modules.error ||
    grades.error ||
    absences.error ||
    tardiness.error ||
    evaluations.error;

  return {
    students: students.data,
    modules: modules.data,
    grades: grades.data,
    absences: absences.data,
    tardiness: tardiness.data,
    evaluations: evaluations.data,
    loading,
    error,
  };
}

export function useReportsData(refreshKey = 0) {
  const students = useStudents(refreshKey);
  const modules = useModules(refreshKey);
  const grades = useGrades(refreshKey);
  const absences = useAbsences(refreshKey);
  const tardiness = useTardiness(refreshKey);
  const alerts = useAlerts(refreshKey);

  const loading =
    students.loading ||
    modules.loading ||
    grades.loading ||
    absences.loading ||
    tardiness.loading ||
    alerts.loading;
  const error =
    students.error ||
    modules.error ||
    grades.error ||
    absences.error ||
    tardiness.error ||
    alerts.error;

  return {
    students: students.data,
    modules: modules.data,
    grades: grades.data,
    absences: absences.data,
    tardiness: tardiness.data,
    alerts: alerts.data,
    loading,
    error,
  };
}

export function useAlertsData(refreshKey = 0) {
  const students = useStudents(refreshKey);
  const grades = useGrades(refreshKey);
  const absences = useAbsences(refreshKey);
  const tardiness = useTardiness(refreshKey);
  const alerts = useAlerts(refreshKey);

  const loading =
    students.loading || grades.loading || absences.loading || tardiness.loading || alerts.loading;
  const error =
    students.error || grades.error || absences.error || tardiness.error || alerts.error;

  return {
    students: students.data,
    grades: grades.data,
    absences: absences.data,
    tardiness: tardiness.data,
    alerts: alerts.data,
    loading,
    error,
  };
}
