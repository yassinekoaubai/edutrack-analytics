/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, Grade, Absence, Tardy, MLMetrics } from '../types';

// Calculates student GPA, absence hours, tardy details, and performance trends
export interface StudentStats {
  studentId: string;
  gpa: number;
  totalAbsences: number;
  unjustifiedAbsences: number;
  totalTardyMinutes: number;
  tardyCount: number;
  gpaTrend: number; // Slope or difference between final exams vs continuous assessments
  rank: number;
}

export function computeAllStudentStats(
  students: Student[],
  grades: Grade[],
  absences: Absence[],
  tardiness: Tardy[]
): Record<string, StudentStats> {
  const statsMap: Record<string, StudentStats> = {};

  students.forEach((student) => {
    // 1. Calculate GPA (weighted by evaluation coefficient)
    const studentGrades = grades.filter((g) => g.studentId === student.id);
    let totalGradePoints = 0;
    let totalGradeCoef = 0;
    let ccSum = 0;
    let ccCount = 0;
    let examSum = 0;
    let examCount = 0;

    studentGrades.forEach((g) => {
      totalGradePoints += g.score * g.coefficient;
      totalGradeCoef += g.coefficient;

      // Classifying for trend analysis
      if (g.coefficient < 0.5) {
        ccSum += g.score;
        ccCount++;
      } else {
        examSum += g.score;
        examCount++;
      }
    });

    const gpa = totalGradeCoef > 0 ? totalGradePoints / totalGradeCoef : 10; // Default to passing if empty

    // Trend = Exam Avg - CC Avg (gives rate of improvement)
    const ccAvg = ccCount > 0 ? ccSum / ccCount : gpa;
    const examAvg = examCount > 0 ? examSum / examCount : gpa;
    const gpaTrend = examAvg - ccAvg;

    // 2. Attendance Stats
    const studentAbsences = absences.filter((a) => a.studentId === student.id);
    const totalAbsences = studentAbsences.reduce((acc, curr) => acc + curr.hours, 0);
    const unjustifiedAbsences = studentAbsences
      .filter((a) => !a.justified)
      .reduce((acc, curr) => acc + curr.hours, 0);

    const studentTardies = tardiness.filter((t) => t.studentId === student.id);
    const totalTardyMinutes = studentTardies.reduce((acc, curr) => acc + curr.minutes, 0);
    const tardyCount = studentTardies.length;

    statsMap[student.id] = {
      studentId: student.id,
      gpa: Math.round(gpa * 100) / 100,
      totalAbsences,
      unjustifiedAbsences,
      totalTardyMinutes,
      tardyCount,
      gpaTrend: Math.round(gpaTrend * 100) / 100,
      rank: 0, // Assigned below
    };
  });

  // Calculate Ranks per Class Group
  const classGroups: Record<string, string[]> = {};
  students.forEach((s) => {
    if (!classGroups[s.className]) {
      classGroups[s.className] = [];
    }
    classGroups[s.className].push(s.id);
  });

  Object.values(classGroups).forEach((studentIds) => {
    const list = studentIds.map((id) => statsMap[id]);
    list.sort((a, b) => b.gpa - a.gpa);
    list.forEach((statItem, index) => {
      statsMap[statItem.studentId].rank = index + 1;
    });
  });

  return statsMap;
}

// Simple descriptive stats calculator for arrays
export function computeDescriptiveStats(values: number[]) {
  if (values.length === 0) {
    return { mean: 0, median: 0, min: 0, max: 0, variance: 0, stdDev: 0, q1: 0, q3: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / sorted.length;

  // Median
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  // Min & Max
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  // Q1 & Q3
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];

  // Variance & SD
  const squaredDiffsSum = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
  const variance = squaredDiffsSum / sorted.length;
  const stdDev = Math.sqrt(variance);

  return {
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    variance: Math.round(variance * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    q1: Math.round(q1 * 100) / 100,
    q3: Math.round(q3 * 100) / 100,
  };
}

// ------------------------------------------------------------
// BONUS A: Academic Risk Predictor Model (Mathematical logic)
// ------------------------------------------------------------
export function predictFailureRiskScore(
  stats: StudentStats,
  gpaThreshold: number,
  absThreshold: number
): number {
  // Let's create a weighted mathematical risk equation normalized from 0 to 100
  // Higher GPA reduces risk. Higher Absences / Tardiness expands risk. Performance drop adds risk.
  const gpaImpact = Math.max(0, 20 - stats.gpa) / 20; // 0 (best gpa) to 1 (failed gpa)
  const absImpact = Math.min(10, stats.totalAbsences) / 10; // 0 to 1
  const tardyImpact = Math.min(5, stats.tardyCount) / 5; // 0 to 1
  const trendImpact = stats.gpaTrend < 0 ? Math.min(3, Math.abs(stats.gpaTrend)) / 3 : 0; // Negative trend adds risk

  // Weighted score calculation
  const rawScore = gpaImpact * 55 + absImpact * 25 + tardyImpact * 10 + trendImpact * 10;
  return Math.min(100, Math.max(0, Math.round(rawScore)));
}

// Computes standard confusion metrics for academic evaluation
export function evaluateMLModel(
  students: Student[],
  statsMap: Record<string, StudentStats>,
  riskProbabilityThreshold: number, // e.g., 40% represents critical risk alert
  gpaThreshold: number = 10,
  absenceThreshold: number = 8
): MLMetrics {
  let tp = 0; // True Positive (Predicts risk, and student actually has GPA < 10 or excessive absences)
  let fn = 0; // False Negative (Predicts stable, but student actually failing/absent)
  let fp = 0; // False Positive (Predicts risk, but student actually fine)
  let tn = 0; // True Negative (Predicts stable, and student actually fine)

  students.forEach((student) => {
    const s = statsMap[student.id];
    if (!s) return;

    // Actual "ground truth" labels set by education experts (GPA < 10 or unjust abs >= absenceThreshold)
    const isActuallyFailing = s.gpa < gpaThreshold || s.totalAbsences >= absenceThreshold;

    // Predicted label from our mathematical formula
    const predictedRiskScore = predictFailureRiskScore(s, gpaThreshold, absenceThreshold);
    const predictsFailing = predictedRiskScore >= riskProbabilityThreshold;

    if (predictsFailing && isActuallyFailing) tp++;
    else if (!predictsFailing && isActuallyFailing) fn++;
    else if (predictsFailing && !isActuallyFailing) fp++;
    else tn++;
  });

  const accuracy = (tp + tn) / (tp + tn + fp + fn || 1);
  const precision = tp / (tp + fp || 1);
  const recall = tp / (tp + fn || 1);
  const f1 = (2 * precision * recall) / (precision + recall || 1);

  return {
    accuracy: Math.round(accuracy * 100) / 100,
    precision: Math.round(precision * 100) / 100,
    recall: Math.round(recall * 100) / 100,
    f1: Math.round(f1 * 100) / 100,
    confusionMatrix: { tp, fn, fp, tn },
  };
}

// ------------------------------------------------------------
// BONUS B: K-Means Clustering implementation in JS/TS
// ------------------------------------------------------------
export interface ClusterPoint {
  id: string; // Student ID
  name: string;
  x: number; // Normalized GPA
  y: number; // Normalized Absences
  gpa: number; // Actual value
  absences: number; // Actual value
  clusterIndex: number;
}

export interface ClusterCentroid {
  x: number;
  y: number;
  gpa: number; // Converted back
  absences: number; // Converted back
  label: string;
  count: number;
}

export function runKMeansClustering(
  students: Student[],
  statsMap: Record<string, StudentStats>,
  iterations: number = 6
): { points: ClusterPoint[]; centroids: ClusterCentroid[] } {
  // 1. Prepare points with 2D coordinates: X = GPA (0-20), Y = Absences (0-15)
  // To avoid scale mismatch, we normalize X and Y to [0, 1] internally for the distance function
  const points: ClusterPoint[] = students.map((s) => {
    const stat = statsMap[s.id] || { gpa: 12, totalAbsences: 2 };
    const normX = stat.gpa / 20; // 0 to 1
    const normY = Math.min(20, stat.totalAbsences) / 20; // 0 to 1 (capped at 20 absences for styling)
    return {
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      x: normX,
      y: normY,
      gpa: stat.gpa,
      absences: stat.totalAbsences,
      clusterIndex: -1,
    };
  });

  if (points.length === 0) {
    return { points: [], centroids: [] };
  }

  // 2. Initialize 5 Centroids corresponding to academic profiles (K = 5)
  // We place initial centroids at strategic academic archetype coordinates
  const centroids: ClusterCentroid[] = [
    { x: 0.95, y: 0.05, gpa: 19.0, absences: 1.0, label: 'Excellent', count: 0 },         // Cluster 0
    { x: 0.70, y: 0.10, gpa: 14.0, absences: 2.0, label: 'Régulier', count: 0 },          // Cluster 1
    { x: 0.55, y: 0.35, gpa: 11.0, absences: 7.0, label: 'Irrégulier', count: 0 },        // Cluster 2
    { x: 0.55, y: 0.15, gpa: 11.0, absences: 3.0, label: 'En progression', count: 0 },    // Cluster 3
    { x: 0.35, y: 0.65, gpa: 7.0, absences: 13.0, label: 'À risque', count: 0 },          // Cluster 4
  ];

  // 3. Mathematical Iteration Loop
  for (let iter = 0; iter < iterations; iter++) {
    // A. Assign each point to nearest centroid
    points.forEach((point) => {
      let minDist = Infinity;
      let clusterIndex = 0;

      centroids.forEach((centroid, cIdx) => {
        // Euclidean distance over normalized coordinates
        const dist = Math.sqrt(Math.pow(point.x - centroid.x, 2) + Math.pow(point.y - centroid.y, 2));
        if (dist < minDist) {
          minDist = dist;
          clusterIndex = cIdx;
        }
      });

      point.clusterIndex = clusterIndex;
    });

    // B. Recompute centroids positions
    const clusterTotals = centroids.map(() => ({ sumX: 0, sumY: 0, count: 0 }));
    points.forEach((point) => {
      clusterTotals[point.clusterIndex].sumX += point.x;
      clusterTotals[point.clusterIndex].sumY += point.y;
      clusterTotals[point.clusterIndex].count++;
    });

    centroids.forEach((centroid, cIdx) => {
      const totals = clusterTotals[cIdx];
      centroid.count = totals.count;
      if (totals.count > 0) {
        centroid.x = totals.sumX / totals.count;
        centroid.y = totals.sumY / totals.count;
        // Project back to original units for dashboard rendering
        centroid.gpa = Math.round(centroid.x * 20 * 10) / 10;
        centroid.absences = Math.round(centroid.y * 20 * 10) / 10;
      }
    });
  }

  return { points, centroids };
}
