/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Student, Grade, Absence, Tardy, Module } from '../types';
import { 
  computeAllStudentStats, 
  computeDescriptiveStats, 
  runKMeansClustering,
  ClusterPoint,
  ClusterCentroid
} from '../utils/dataEngine';
import { 
  BarChart2, 
  Sigma, 
  HelpCircle, 
  Sparkles, 
  Play, 
  TrendingUp, 
  ArrowRight,
  Info
} from 'lucide-react';

interface AnalyticsSectionProps {
  students: Student[];
  modules: Module[];
  grades: Grade[];
  absences: Absence[];
  tardiness: Tardy[];
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  students,
  modules,
  grades,
  absences,
  tardiness
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'clustering'>('stats');
  const [kmeansIterations, setKmeansIterations] = useState<number>(6);
  const [selectedClusterIdx, setSelectedClusterIdx] = useState<number | null>(null);

  // Compute stats
  const studentStats = useMemo(() => {
    return computeAllStudentStats(students, grades, absences, tardiness);
  }, [students, grades, absences, tardiness]);

  // Descriptive stats per module
  const moduleStats = useMemo(() => {
    return modules.map((mod) => {
      const modGrades = grades.filter((g) => g.moduleId === mod.id).map((g) => g.score);
      const stats = computeDescriptiveStats(modGrades);
      
      // Calculate failure rate (grades < 10)
      const failures = modGrades.filter((score) => score < 10).length;
      const failureRate = modGrades.length > 0 ? (failures / modGrades.length) * 100 : 0;

      return {
        ...mod,
        stats,
        totalGradesCount: modGrades.length,
        failureRate: Math.round(failureRate * 10) / 10
      };
    });
  }, [modules, grades]);

  // Execute clustering
  const clusteringResult = useMemo(() => {
    return runKMeansClustering(students, studentStats, kmeansIterations);
  }, [students, studentStats, kmeansIterations]);

  return (
    <div id="analytics-section" className="space-y-6 animate-fade-in">
      
      {/* Tab bar header */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('stats')}
            className={`px-4 py-2 rounded-lg font-sans text-xs font-bold leading-none cursor-pointer border ${
              activeSubTab === 'stats'
                ? 'bg-[#B9DDF5] border-[#83C5F1] text-slate-900'
                : 'bg-white border-transparent hover:bg-slate-50 text-slate-500'
            }`}
          >
            Statistiques Descriptives & Modules
          </button>
          <button
            onClick={() => setActiveSubTab('clustering')}
            className={`px-4 py-2 rounded-lg font-sans text-xs font-bold leading-none cursor-pointer border flex items-center gap-1.5 ${
              activeSubTab === 'clustering'
                ? 'bg-[#F4DBE3] border-[#F4DBE3] text-slate-900'
                : 'bg-white border-transparent hover:bg-slate-50 text-slate-500'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-600" />
            <span>Segmentation K-Means (BETA)</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-sans italic">
          Calculs mathématiques réels effectués côté client
        </div>
      </div>

      {activeSubTab === 'stats' ? (
        <div className="space-y-6 animate-fade-in">
          
          {/* Module statistical table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-sans">
                  Statistiques Éducatives Exploratoires (EDA)
                </h3>
                <p className="text-slate-400 text-xs font-sans mt-0.5">
                  Indicateurs détaillés par matière (moyenne, médiane, écart-type, quartiles) 
                </p>
              </div>
              <Sigma className="w-6 h-6 text-[#5EA8DA]" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-100">
                    <th className="p-4">Module / Professeur</th>
                    <th className="p-4 text-center">Moyenne</th>
                    <th className="p-4 text-center">Médian</th>
                    <th className="p-4 text-center">Écart-Type</th>
                    <th className="p-4 text-center">Q1 (25%)</th>
                    <th className="p-4 text-center">Q3 (75%)</th>
                    <th className="p-4 text-center">Min / Max</th>
                    <th className="p-4 text-right">Taux d&apos;Échec</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {moduleStats.map((m) => {
                    const failCol = m.failureRate > 25 ? 'text-rose-600 font-bold' : 'text-emerald-600';
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50 transition-colors font-sans">
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{m.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{m.professor} (coeff. {m.coefficients})</div>
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-slate-700 bg-sky-50/20">{m.stats.mean}/20</td>
                        <td className="p-4 text-center font-mono text-slate-600">{m.stats.median}</td>
                        <td className="p-4 text-center font-mono text-slate-500">± {m.stats.stdDev}</td>
                        <td className="p-4 text-center font-mono text-slate-400">{m.stats.q1}</td>
                        <td className="p-4 text-center font-mono text-slate-400">{m.stats.q3}</td>
                        <td className="p-4 text-center font-mono text-slate-500">
                          <span className="text-rose-500">{m.stats.min}</span>
                          <span className="mx-1">/</span>
                          <span className="text-emerald-500">{m.stats.max}</span>
                        </td>
                        <td className="p-4 text-right font-mono">
                          <span className={`${failCol} bg-slate-100 px-2 py-0.5 rounded-full`}>
                            {m.failureRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Descriptive callouts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl h-fit">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 font-sans">Analyse des Écarts-types (Dispersion)</h4>
                <p className="text-slate-500 text-xs leading-relaxed font-sans">
                  Une matière avec un faible écart-type (std dev &lt; 1.5) indique que les étudiants obtiennent des notes similaires, traduisant une homogénéité des acquis. À l&apos;inverse, un écart-type supérieur à 3 révèle de forts écarts et la nécessité de diviser les classes par groupes de niveau académique.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex gap-4">
              <div className="p-3 bg-sky-50 text-sky-500 rounded-xl h-fit">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 font-sans">Identification des Obsculités</h4>
                <p className="text-slate-500 text-xs leading-relaxed font-sans">
                  Notre outil de validation repère automatiquement les modules à taux d&apos;échecs critiques (&gt; 20%). Ces éléments nécessitent un suivi, une réévaluation des coefficients ou un renforcement pédagogique planifié.
                </p>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in pb-12">
          
          {/* Controls Column */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight font-sans">
                  Modèle de Clustering K-Means
                </h3>
                <p className="text-slate-400 text-xs mt-0.5 leading-relaxed font-sans">
                  Algorithme mathématique d&apos;apprentissage non-supervisé partitionnant les étudiants en profiles homogènes.
                </p>
              </div>

              {/* Dynamic iterative slides */}
              <div className="space-y-2">
                <label className="text-xs text-slate-600 font-bold block font-sans">
                  Itérations de convergence: {kmeansIterations}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={kmeansIterations}
                    onChange={(e) => {
                      setKmeansIterations(parseInt(e.target.value));
                      setSelectedClusterIdx(null);
                    }}
                    className="flex-1 accent-[#5EA8DA] cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">
                    {kmeansIterations}
                  </span>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/50 flex gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-normal font-sans">
                  Le clustering s&apos;effectue sur un repère 2D normé reliant la <strong>Moyenne générale (Axe X)</strong> et les <strong>Heures d&apos;Absence cumulées (Axe Y)</strong>.
                </p>
              </div>

              <div className="pt-2">
                <p className="text-xs font-bold text-slate-600 mb-2 font-sans">Archetypes de segmentation :</p>
                <div className="space-y-1.5 font-sans">
                  {clusteringResult.centroids.map((centroid, idx) => {
                    const bgStyles = [
                      'bg-[#AFE3F4] text-slate-900 border-[#AFE3F4]',
                      'bg-[#83C5F1] text-slate-900 border-[#83C5F1]',
                      'bg-[#B9DDF5] text-slate-900 border-[#B9DDF5]',
                      'bg-[#5EA8DA] text-slate-900 border-[#5EA8DA]',
                      'bg-[#F4DBE3] text-slate-900 border-[#F4DBE3]'
                    ];

                    const isSelected = selectedClusterIdx === idx;

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedClusterIdx(isSelected ? null : idx)}
                        className={`w-full text-[11px] font-semibold flex items-center justify-between p-2 rounded-lg border text-left cursor-pointer transition-all ${
                          isSelected 
                            ? 'ring-2 ring-slate-900 font-extrabold scale-[1.01]' 
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${bgStyles[idx].split(' ')[0]}`} />
                          <span>{centroid.label}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 bg-white/75 px-1.5 py-0.5 rounded border border-slate-150-50">
                          {centroid.count} élève{centroid.count > 1 ? 's' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Chart & Mathematical details columns */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Clustering SVG Plane */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs relative">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 font-sans">
                    Plan Cartésien des Clusters (K-Means)
                  </h3>
                  <p className="text-slate-400 text-xs font-sans">
                    Visualisez les points d&apos;étudiants regroupés autour de leurs barycentres
                  </p>
                </div>
                <div className="text-[10px] font-mono bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 py-0.5 rounded uppercase">
                  Apprentissage en direct
                </div>
              </div>

              {/* SVG 2D Canvas */}
              <div className="relative h-72 border-b border-l border-slate-200 pl-4 pb-2 bg-slate-50/20 rounded-lg">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                  {/* Grid spacing */}
                  <line x1="20" y1="5" x2="20" y2="95" stroke="#f1f5f9" strokeWidth="0.5" />
                  <line x1="40" y1="5" x2="40" y2="95" stroke="#f1f5f9" strokeWidth="0.5" />
                  <line x1="60" y1="5" x2="60" y2="95" stroke="#f1f5f9" strokeWidth="0.5" />
                  <line x1="80" y1="5" x2="80" y2="95" stroke="#f1f5f9" strokeWidth="0.5" />
                  <line x1="5" y1="20" x2="95" y2="20" stroke="#f1f5f9" strokeWidth="0.5" />
                  <line x1="5" y1="40" x2="95" y2="40" stroke="#f1f5f9" strokeWidth="0.5" />
                  <line x1="5" y1="60" x2="95" y2="60" stroke="#f1f5f9" strokeWidth="0.5" />
                  <line x1="5" y1="80" x2="95" y2="80" stroke="#f1f5f9" strokeWidth="0.5" />

                  {/* Draw points */}
                  {clusteringResult.points.map((pt) => {
                    const isFading = selectedClusterIdx !== null && pt.clusterIndex !== selectedClusterIdx;
                    
                    const pColors = ['#22D3EE', '#38BDF8', '#93C5FD', '#1E40AF', '#FDA4AF'];
                    const color = pColors[pt.clusterIndex % pColors.length];

                    return (
                      <circle
                        key={pt.id}
                        cx={pt.x * 80 + 10}
                        cy={90 - pt.y * 80}
                        r="3"
                        fill={color}
                        stroke="#ffffff"
                        strokeWidth="0.5"
                        opacity={isFading ? 0.25 : 1}
                        className="transition-all duration-300 transform"
                      />
                    );
                  })}

                  {/* Draw Centroids as giant crosses */}
                  {clusteringResult.centroids.map((centroid, idx) => {
                    const isFading = selectedClusterIdx !== null && idx !== selectedClusterIdx;
                    const cColors = ['#0891B2', '#0284C7', '#2563EB', '#1e293b', '#E11D48'];
                    const color = cColors[idx % cColors.length];

                    const cx = centroid.x * 80 + 10;
                    const cy = 90 - centroid.y * 80;

                    return (
                      <g key={idx} opacity={isFading ? 0.2 : 1} className="transition-all duration-300">
                        {/* Centroid icon marker */}
                        <circle cx={cx} cy={cy} r="5" fill={color} stroke="#ffffff" strokeWidth="1" />
                        <line x1={cx - 5} y1={cy} x2={cx + 5} y2={cy} stroke="#ffffff" strokeWidth="1" />
                        <line x1={cx} y1={cy - 5} x2={cx} y2={cy + 5} stroke="#ffffff" strokeWidth="1" />
                        <text 
                          x={cx + 7} 
                          y={cy + 3} 
                          className="font-mono font-bold text-[5px] fill-slate-800"
                        >
                          {centroid.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Legend axes labels */}
                <div className="absolute left-1 bottom-1 text-[8px] font-mono text-slate-400 select-none">
                  Absences cumulées (0-20h)
                </div>
                <div className="absolute right-1 bottom-1 text-[8px] font-mono text-slate-400 select-none">
                  Moyenne Générale (0-20/20) →
                </div>
              </div>
            </div>

            {/* Display names belonging to the selected cluster list */}
            {selectedClusterIdx !== null && (
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-md animate-slide-up">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
                  <h4 className="text-xs font-bold uppercase text-slate-700 font-sans flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-900" />
                    <span>Membres retenus pour: {clusteringResult.centroids[selectedClusterIdx].label}</span>
                  </h4>
                  <span className="text-[10px] font-mono bg-sky-50 text-sky-700 px-2 rounded-full font-bold">
                    Segment partitionné
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-40 overflow-y-auto">
                  {clusteringResult.points
                    .filter((pt) => pt.clusterIndex === selectedClusterIdx)
                    .map((pt) => (
                      <div key={pt.id} className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs flex justify-between items-center">
                        <span className="font-sans font-semibold text-slate-800">{pt.name}</span>
                        <div className="flex gap-2 text-[10px] font-mono text-slate-500">
                          <span>{pt.gpa} moy</span>
                          <span>|</span>
                          <span>{pt.absences}h abs</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
