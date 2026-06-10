/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Student, Grade, Absence, Tardy, AcademicAlert } from '../types';
import { StudentStats, computeAllStudentStats, computeDescriptiveStats } from '../utils/dataEngine';
import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface OverviewSectionProps {
  students: Student[];
  grades: Grade[];
  absences: Absence[];
  tardiness: Tardy[];
  alerts: AcademicAlert[];
  onViewStudent: (studentId: string) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  students,
  grades,
  absences,
  tardiness,
  alerts,
  onViewStudent
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; score: number; abs: number } | null>(null);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  // Compute stats
  const studentStats = useMemo(() => {
    return computeAllStudentStats(students, grades, absences, tardiness);
  }, [students, grades, absences, tardiness]);

  const KPIs = useMemo(() => {
    const statsArray = Object.values(studentStats) as StudentStats[];
    if (statsArray.length === 0) {
      return { avgGpa: 0, successRate: 0, avgAbs: 0, atRiskCount: 0 };
    }

    const gpaSum = statsArray.reduce((acc, curr) => acc + curr.gpa, 0);
    const avgGpa = gpaSum / statsArray.length;

    const successfulStudents = statsArray.filter((s) => s.gpa >= 10).length;
    const successRate = (successfulStudents / statsArray.length) * 100;

    const absSum = statsArray.reduce((acc, curr) => acc + curr.totalAbsences, 0);
    const avgAbs = absSum / statsArray.length;

    const atRiskCount = students.filter((s) => s.status === 'À risque').length;

    return {
      avgGpa: Math.round(avgGpa * 100) / 100,
      successRate: Math.round(successRate * 10) / 10,
      avgAbs: Math.round(avgAbs * 10) / 10,
      atRiskCount
    };
  }, [studentStats, students]);

  // Aggregate stats by Class Group
  const classStats = useMemo(() => {
    const classes: Record<string, { sum: number; count: number; absences: number }> = {};
    Object.keys(studentStats).forEach((studentId) => {
      const stat = studentStats[studentId];
      const student = students.find((s) => s.id === studentId);
      if (student) {
        const className = student.className;
        if (!classes[className]) {
          classes[className] = { sum: 0, count: 0, absences: 0 };
        }
        classes[className].sum += stat.gpa;
        classes[className].count += 1;
        classes[className].absences += stat.totalAbsences;
      }
    });

    return Object.entries(classes).map(([className, data]) => ({
      className,
      gpa: Math.round((data.sum / data.count) * 100) / 100,
      absences: Math.round((data.absences / data.count) * 100) / 100,
      count: data.count
    }));
  }, [studentStats, students]);

  // Distribution of grades [0-8, 8-10, 10-12, 12-14, 14-16, 16-20]
  const gpaDistribution = useMemo(() => {
    const buckets = [
      { label: '[0-8)', min: 0, max: 8, count: 0, color: '#F4DBE3' },
      { label: '[8-10)', min: 8, max: 10, count: 0, color: '#AFE3F4' },
      { label: '[10-12)', min: 10, max: 12, count: 0, color: '#B9DDF5' },
      { label: '[12-14)', min: 12, max: 14, count: 0, color: '#83C5F1' },
      { label: '[14-16)', min: 14, max: 16, count: 0, color: '#5EA8DA' },
      { label: '[16-20]', min: 16, max: 21, count: 0, color: '#AFE3F4' }
    ];

    (Object.values(studentStats) as StudentStats[]).forEach((s) => {
      const bucket = buckets.find((b) => s.gpa >= b.min && s.gpa < b.max);
      if (bucket) bucket.count++;
    });

    return buckets;
  }, [studentStats]);

  // Scatter plot points (normalized coordinates for 100x100 SVG space)
  const scatterPoints = useMemo(() => {
    const rawPoints = Object.keys(studentStats).map((studentId) => {
      const stat = studentStats[studentId];
      const student = students.find((s) => s.id === studentId);
      return {
        id: studentId,
        name: student ? `${student.firstName} ${student.lastName}` : 'Inconnu',
        gpa: stat.gpa,
        abs: stat.totalAbsences,
        status: student?.status || 'Moyen',
        // Scale to SVG coords (pad slightly away from boundary)
        // X coord = GPA (0 to 20) -> maps to (10 to 90)
        cx: 10 + (stat.gpa / 20) * 80,
        // Y coord = Absences (0 to 16) -> maps to (90 to 10) (flipped)
        cy: 90 - (Math.min(16, stat.totalAbsences) / 16) * 80
      };
    });
    return rawPoints;
  }, [studentStats, students]);

  return (
    <div id="overview-section" className="space-y-6 animate-fade-in">
      
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">
            Performances Académiques
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-sans">
            Vue générale consolidée des résultats du trimestre pour <strong>Maroc Ynov Campus</strong>.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 px-4 py-2 rounded-xl text-slate-700 text-xs font-medium font-sans shadow-2xs">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>Année Académique: 2025 - 2026</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* GPA KPI */}
        <div id="gpa-kpi-card" className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#83C5F1]" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-bold font-sans">Moyenne Générale</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">
                {KPIs.avgGpa}<span className="text-sm font-medium text-slate-400">/20</span>
              </h3>
            </div>
            <div className="p-3 bg-sky-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-sky-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="font-semibold text-emerald-600 font-mono">+0.4pt</span>
            <span className="text-slate-500 font-sans">vs le mois dernier</span>
          </div>
        </div>

        {/* Success Rate KPI */}
        <div id="success-kpi-card" className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#AFE3F4]" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-bold font-sans">Taux de Réussite</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">
                {KPIs.successRate}<span className="text-sm font-medium text-slate-400">%</span>
              </h3>
            </div>
            <div className="p-3 bg-teal-50 rounded-xl">
              <BookOpen className="w-6 h-6 text-teal-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="font-semibold text-emerald-600 font-mono">{(students.filter((s) => studentStats[s.id]?.gpa >= 10).length)}/{students.length}</span>
            <span className="text-slate-500 font-sans">élèves avec moyenne ≥ 10</span>
          </div>
        </div>

        {/* Absence Rate KPI */}
        <div id="absence-kpi-card" className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#B9DDF5]" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-bold font-sans">Absences Moyennes</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">
                {KPIs.avgAbs}<span className="text-sm font-medium text-slate-400">h</span>
              </h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl animate-fade-in">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="font-semibold text-amber-600 font-mono">
              {absences.filter(a => !a.justified).length} absences
            </span>
            <span className="text-slate-500 font-sans">non-justifiées cumulées</span>
          </div>
        </div>

        {/* At Risk KPI */}
        <div id="risk-kpi-card" className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#F4DBE3]" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-bold font-sans">Étudiants à Risque</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">
                {KPIs.atRiskCount}
              </h3>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-rose-500 animate-pulse" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="font-semibold text-rose-600 font-mono">
              {alerts.filter(a => a.severity === 'haute' && a.status === 'active').length} alertes critiques
            </span>
            <span className="text-slate-500 font-sans">identifiées</span>
          </div>
        </div>

      </div>

      {/* Main Graph Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1: Class Comparison Bar Chart */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 font-sans">
              Moyenne Générale par Classe
            </h3>
            <p className="text-slate-400 text-xs font-sans mt-0.5">
              Comparaison des performances moyennes par cohorte
            </p>
          </div>

          <div className="relative mt-6 h-56 flex items-end justify-around border-b border-l border-slate-100 pb-2 pl-4">
            {classStats.map((cStat, index) => {
              const heightPct = (cStat.gpa / 20) * 100;
              const isHovered = hoveredBar === cStat.className;
              // Alternate nice palette backgrounds
              const barColors = ['bg-[#5EA8DA]', 'bg-[#83C5F1]', 'bg-[#AFE3F4]'];
              const col = barColors[index % barColors.length];

              return (
                <div 
                  key={cStat.className} 
                  className="flex flex-col items-center w-20 group relative cursor-pointer"
                  onMouseEnter={() => setHoveredBar(cStat.className)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip on top of bar */}
                  <div className={`absolute -top-12 bg-slate-900 text-white text-[11px] p-2 rounded-lg font-mono flex flex-col items-center z-10 shadow-lg pointer-events-none transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <span>Classe: {cStat.className}</span>
                    <span className="font-bold">{cStat.gpa}/20 avg</span>
                    <span className="text-[10px] text-slate-300">{cStat.count} élèves</span>
                  </div>

                  {/* Visual Rounded Bar */}
                  <div 
                    className={`w-12 ${col} rounded-t-lg transition-all duration-300 transform origin-bottom hover:brightness-95 flex items-end justify-center`}
                    style={{ height: `${heightPct}%`, minHeight: '15px' }}
                  >
                    <span className="text-[11px] font-mono font-bold text-slate-900 mb-1">
                      {cStat.gpa}
                    </span>
                  </div>

                  <span className="text-xs text-slate-500 mt-2 font-mono font-bold pt-1">
                    {cStat.className}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Correlation Scatter Plot (Notes vs Absences) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs relative">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-bold text-slate-800 font-sans">
                Corrélation: Notes vs. Absences
              </h3>
              <p className="text-slate-400 text-xs font-sans mt-0.5">
                Chaque point représente un étudiant (analyse de dispersion)
              </p>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 text-[9px] font-mono">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Excellent</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500" />Régulier</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Irrégulier</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#5EA8DA]" />Progression</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />À risque</span>
            </div>
          </div>

          <div className="relative mt-6 h-56 border-b border-l border-slate-200 pl-4 pb-2">
            {/* Y axis labels */}
            <div className="absolute left-1 top-0 text-[9px] font-mono text-slate-400 h-full flex flex-col justify-between select-none p-1 pointer-events-none">
              <span>16h abs</span>
              <span>8h abs</span>
              <span>0h abs</span>
            </div>

            {/* X axis labels */}
            <div className="absolute bottom-0 right-2 text-[9px] font-mono text-slate-400 select-none pointer-events-none">
              Moyenne générale (20) →
            </div>

            {/* Scatter SVG Canvas */}
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              {/* Grid Lines */}
              <line x1="10" y1="50" x2="90" y2="50" stroke="#f1f5f9" strokeWidth="0.5" strokeDasharray="1" />
              <line x1="50" y1="10" x2="50" y2="90" stroke="#f1f5f9" strokeWidth="0.5" strokeDasharray="1" />

              {scatterPoints.map((pt) => {
                let col = '#10B981'; // Emerald
                if (pt.status === 'Régulier') col = '#0EA5E9'; // Sky
                if (pt.status === 'Irrégulier') col = '#F59E0B'; // Amber
                if (pt.status === 'En progression') col = '#5EA8DA'; // Medium Blue
                if (pt.status === 'À risque') col = '#F43F5E'; // Rose

                const isHovered = hoveredPoint?.label === pt.name;

                return (
                  <circle
                    key={pt.id}
                    cx={pt.cx}
                    cy={pt.cy}
                    r={isHovered ? 4.5 : 3}
                    fill={col}
                    stroke="#ffffff"
                    strokeWidth="0.5"
                    className="transition-all duration-200 cursor-pointer hover:r-5 focus:outline-none"
                    onClick={() => onViewStudent(pt.id)}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
                      setHoveredPoint({
                        x: pt.cx,
                        y: pt.cy,
                        label: pt.name,
                        score: pt.gpa,
                        abs: pt.abs
                      });
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                );
              })}
            </svg>

            {/* Scatter Interactive Tooltip */}
            {hoveredPoint && (
              <div 
                className="absolute bg-slate-900 border border-slate-700 text-white p-2.5 rounded-xl text-xs font-mono shadow-xl z-20 pointer-events-none flex flex-col"
                style={{
                  left: `${hoveredPoint.x}%`,
                  top: `${hoveredPoint.y - 12}%`,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <span className="font-bold text-slate-200">{hoveredPoint.label}</span>
                <span className="text-[10px] text-teal-400 mt-0.5">Moyenne: {hoveredPoint.score}/20</span>
                <span className="text-[10px] text-orange-400">Absences: {hoveredPoint.abs}h</span>
                <span className="text-[8px] text-slate-400 mt-1 italic">Click pour détails</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Row 3: Grade Distribution Map and Alert Highlight Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Grade Distribution Bucket graph */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800 font-sans">
              Distribution des Moyennes Générales
            </h3>
            <p className="text-slate-400 text-xs font-sans">
              Nombre d&apos;élèves par cohorte de notes
            </p>
          </div>

          <div className="space-y-3.5 mt-5">
            {gpaDistribution.map((bucket) => {
              const maxCount = Math.max(...gpaDistribution.map((b) => b.count), 1);
              const pct = (bucket.count / maxCount) * 100;

              return (
                <div key={bucket.label} className="flex items-center gap-4">
                  <span className="w-16 text-xs text-slate-600 font-mono font-bold">
                    {bucket.label}
                  </span>
                  
                  {/* Dynamic Progress Bar container */}
                  <div className="flex-1 bg-slate-50 h-6 rounded-lg overflow-hidden relative border border-slate-100/40">
                    <div 
                      className="h-full rounded-r-lg transition-all duration-700 ease-out"
                      style={{ 
                        width: `${pct}%`, 
                        backgroundColor: bucket.color 
                      }}
                    />
                    <span className="absolute right-3.5 top-0.5 text-xs font-mono font-extrabold text-slate-800">
                      {bucket.count} élève{bucket.count > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Alerts quick check */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-800 font-sans">
                Alertes Pédagogiques Actives
              </h3>
              <span className="bg-rose-50 text-rose-600 font-mono font-bold text-xs px-2.5 py-0.5 rounded-full">
                {alerts.filter((a) => a.status === 'active').length}
              </span>
            </div>
            
            <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
              {alerts.filter((a) => a.status === 'active').slice(0, 3).map((a) => {
                const s = students.find((st) => st.id === a.studentId);
                return (
                  <div 
                    key={a.id} 
                    className="p-3 bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl flex items-start gap-2.5 transition-colors cursor-pointer group"
                    onClick={() => onViewStudent(a.studentId)}
                  >
                    <span className="mt-0.5 p-1 bg-rose-50 text-rose-500 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {s ? `${s.firstName} ${s.lastName}` : 'Élève'}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 capitalize bg-slate-200/50 px-1 rounded">
                          {a.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {a.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="text-center text-xs text-slate-400 italic">
              Naviguez au Centre d&apos;Alertes pour ajuster les seuils critiques de performance.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
