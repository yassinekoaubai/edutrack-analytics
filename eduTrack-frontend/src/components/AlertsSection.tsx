/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Student, AcademicAlert } from '../types';
import { computeAllStudentStats, evaluateMLModel } from '../utils/dataEngine';
import { 
  BellRing, 
  Settings2, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  HelpCircle,
  Activity,
  UserCheck2,
  BookmarkCheck
} from 'lucide-react';

interface AlertsSectionProps {
  students: Student[];
  grades: any[];
  absences: any[];
  tardiness: any[];
  activeAlerts: AcademicAlert[];
  onSetAlerts: (alerts: AcademicAlert[]) => void;
  onViewStudent: (studentId: string) => void;
}

export const AlertsSection: React.FC<AlertsSectionProps> = ({
  students,
  grades,
  absences,
  tardiness,
  activeAlerts,
  onSetAlerts,
  onViewStudent
}) => {
  // Configurable alert parameters
  const [gpaThreshold, setGpaThreshold] = useState<number>(10.0);
  const [absenceThreshold, setAbsenceThreshold] = useState<number>(8);
  const [predictorSensitivity, setPredictorSensitivity] = useState<number>(45); // Risk probability trigger cutoff (0-100)

  // Compute stats
  const studentStats = useMemo(() => {
    return computeAllStudentStats(students, grades, absences, tardiness);
  }, [students, grades, absences, tardiness]);

  // Execute ML prediction evaluation dashboard calculations
  const mlMetrics = useMemo(() => {
    return evaluateMLModel(students, studentStats, predictorSensitivity, gpaThreshold, absenceThreshold);
  }, [students, studentStats, predictorSensitivity, gpaThreshold, absenceThreshold]);

  // Filter alerts based on threshold changes on the fly
  const customAlerts = useMemo(() => {
    const alertsList: AcademicAlert[] = [];
    let idCounter = 1;

    Object.keys(studentStats).forEach((id) => {
      const stat = studentStats[id];
      const student = students.find((s) => s.id === id);
      if (!student) return;

      if (stat.gpa < gpaThreshold) {
        alertsList.push({
          id: `ALT-DYN-${idCounter++}`,
          studentId: id,
          type: 'GPA',
          severity: stat.gpa < 8 ? 'haute' : 'moyenne',
          title: 'Alerte: Moyenne Critique',
          message: `${student.firstName} ${student.lastName} a une moyenne de ${stat.gpa}/20, inférieure au seuil de ${gpaThreshold}.`,
          date: new Date().toISOString().split('T')[0],
          status: 'active'
        });
      }

      if (stat.totalAbsences >= absenceThreshold) {
        alertsList.push({
          id: `ALT-DYN-${idCounter++}`,
          studentId: id,
          type: 'ABSENCE',
          severity: stat.totalAbsences >= 12 ? 'haute' : 'moyenne',
          title: 'Alerte: Assiduité Défaillante',
          message: `${student.firstName} ${student.lastName} cumule ${stat.totalAbsences} heures de cours manqués (Max autorisé: ${absenceThreshold}h).`,
          date: new Date().toISOString().split('T')[0],
          status: 'active'
        });
      }
    });

    return alertsList;
  }, [studentStats, students, gpaThreshold, absenceThreshold]);

  return (
    <div id="alerts-section" className="space-y-6 animate-fade-in">
      
      {/* Visual threshold tuning drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tuning controls */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-50 pb-3">
            <Settings2 className="w-5 h-5 text-[#5EA8DA]" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight font-sans">
              Seuils Alarmes Personnalisables
            </h3>
          </div>

          {/* GPA Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold font-sans">
              <span className="text-slate-600">Note minimale attendue :</span>
              <span className="font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                ≤ {gpaThreshold.toFixed(1)}/20
              </span>
            </div>
            <input
              type="range"
              min="8.0"
              max="14.0"
              step="0.5"
              value={gpaThreshold}
              onChange={(e) => setGpaThreshold(parseFloat(e.target.value))}
              className="w-full accent-[#5EA8DA] h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Absences Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold font-sans">
              <span className="text-slate-600">Absences max autorisées :</span>
              <span className="font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                ≥ {absenceThreshold} h
              </span>
            </div>
            <input
              type="range"
              min="4"
              max="16"
              step="1"
              value={absenceThreshold}
              onChange={(e) => setAbsenceThreshold(parseInt(e.target.value))}
              className="w-full accent-[#83C5F1] h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Model sensitivity Slider */}
          <div className="space-y-2 pt-2 border-t border-slate-50">
            <div className="flex justify-between items-center text-xs font-bold font-sans">
              <span className="text-slate-600">Sensibilité de prédiction :</span>
              <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {predictorSensitivity}% risk
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              step="5"
              value={predictorSensitivity}
              onChange={(e) => setPredictorSensitivity(parseInt(e.target.value))}
              className="w-full accent-[#83C5F1] h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="text-[10px] text-slate-400 font-sans leading-relaxed italic">
            Modifier ces curseurs entraîne un recalcul immédiat de l&apos;exactitude F1 de notre classificateur prédictif, ainsi que de notre matrice de confusion.
          </div>
        </div>

        {/* ML Performance Metrics: BONUS A */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#5EA8DA]" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                  Précision Prédictive Risk Model
                </h3>
              </div>
              <span className="text-[9.5px] font-mono bg-emerald-50 text-emerald-700 px-1.5 rounded font-extrabold uppercase">
                Evaluated Metrics
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-1.5">
              <div className="p-3 bg-[#AFE3F4]/10 rounded-xl border border-[#AFE3F4]/20 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-tight block font-semibold font-sans">Accuracy</span>
                <span className="text-2xl font-black text-slate-800 font-mono">{(mlMetrics.accuracy * 100).toFixed(0)}%</span>
              </div>

              <div className="p-3 bg-[#B9DDF5]/15 rounded-xl border border-[#B9DDF5]/20 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-tight block font-semibold font-sans">F1-Score</span>
                <span className="text-2xl font-black text-slate-800 font-mono">{(mlMetrics.f1 * 100).toFixed(0)}%</span>
              </div>

              <div className="p-3 bg-[#83C5F1]/10 rounded-xl border border-[#83C5F1]/20 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-tight block font-semibold font-sans">Precision</span>
                <span className="text-2xl font-black text-slate-800 font-mono">{(mlMetrics.precision * 100).toFixed(0)}%</span>
              </div>

              <div className="p-3 bg-[#F4DBE3]/15 rounded-xl border border-[#F4DBE3]/20 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-tight block font-semibold font-sans">Recall</span>
                <span className="text-2xl font-black text-slate-800 font-mono">{(mlMetrics.recall * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center pt-3 border-t border-slate-50 italic">
            Métriques standards de validation statistique de la Data Science.
          </div>
        </div>

        {/* Confusion Matrix Display: BONUS A */}
        <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-3.5">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#AFE3F4] font-mono">
              Matrice de Confusion Générée
            </h3>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">
              Analyse de corrélation Prédictions vs. Réalité
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
            {/* True Positive (TP) */}
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-400 flex flex-col justify-center">
              <span className="text-[8px] uppercase font-bold text-slate-400">Vrais Positifs (TP)</span>
              <span className="text-2xl font-black text-white mt-1">{mlMetrics.confusionMatrix.tp}</span>
              <span className="text-[8px] text-emerald-500/80 mt-0.5">Signalé & Réel En Danger</span>
            </div>

            {/* False Negative (FN) */}
            <div className="p-3 bg-rose-950/40 border border-rose-900/40 rounded-xl text-rose-400 flex flex-col justify-center">
              <span className="text-[8px] uppercase font-bold text-slate-400">Faux Négatifs (FN)</span>
              <span className="text-2xl font-black text-white mt-1">{mlMetrics.confusionMatrix.fn}</span>
              <span className="text-[8px] text-rose-500/80 mt-0.5">Sains mais Réel En Danger</span>
            </div>

            {/* False Positive (FP) */}
            <div className="p-3 bg-amber-950/40 border border-amber-900/40 rounded-xl text-amber-400 flex flex-col justify-center">
              <span className="text-[8px] uppercase font-bold text-slate-400">Faux Positifs (FP)</span>
              <span className="text-2xl font-black text-white mt-1">{mlMetrics.confusionMatrix.fp}</span>
              <span className="text-[8px] text-amber-500/80 mt-0.5">Signalé mais En Sécurité</span>
            </div>

            {/* True Negative (TN) */}
            <div className="p-3 bg-slate-800/30 border border-slate-700/60 rounded-xl text-slate-400 flex flex-col justify-center">
              <span className="text-[8px] uppercase font-bold text-slate-400">Vrais Négatifs (TN)</span>
              <span className="text-2xl font-black text-white mt-1">{mlMetrics.confusionMatrix.tn}</span>
              <span className="text-[8px] text-slate-500 mt-0.5">Sain & Réel En Sécurité</span>
            </div>
          </div>
        </div>

      </div>

      {/* Segment tracking warning active list */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-50 pb-3">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-bold text-slate-800 font-sans">
              Signaux de Défaillance Académiques ({customAlerts.length})
            </h3>
          </div>
          <span className="text-slate-400 text-xs font-sans">
            Mise à jour dynamique selon les filtres configurés
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[440px] overflow-y-auto pr-1">
          {customAlerts.map((alt) => {
            const student = students.find((s) => s.id === alt.studentId);
            const isCritical = alt.severity === 'haute';

            return (
              <div 
                key={alt.id}
                onClick={() => onViewStudent(alt.studentId)}
                className={`p-4 border rounded-2xl flex items-start gap-4 hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer group ${
                  isCritical 
                    ? 'border-rose-100 bg-rose-50/20' 
                    : 'border-amber-100 bg-amber-50/20'
                }`}
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  isCritical ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  <ShieldAlert className={`w-5 h-5 ${isCritical ? 'animate-bounce' : ''}`} />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-slate-800 font-sans text-xs truncate">
                      {student ? `${student.firstName} ${student.lastName}` : 'Élève'}
                    </span>
                    <span className={`text-[9px] uppercase font-bold font-mono px-2 py-0.5 rounded ${
                      alt.type === 'GPA' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {alt.type}
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                    {alt.message}
                  </p>

                  <div className="pt-2 flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-mono">ID: {alt.studentId}</span>
                    <span className="group-hover:text-[#5EA8DA] font-semibold transition-colors flex items-center gap-1">
                      Consulter le dossier →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {customAlerts.length === 0 && (
            <div className="md:col-span-2 text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 italic font-sans">
              🙌 Exceptionnel ! Aucun élève ne dépasse les seuils limites configurés. Tout est au vert.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
