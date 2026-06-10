/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Student, Module, Grade, Absence, Tardy, AcademicAlert } from '../types';
import { StudentStats, computeAllStudentStats, computeDescriptiveStats } from '../utils/dataEngine';
import { 
  FileText, 
  Printer, 
  Copy, 
  Check, 
  Sparkles, 
  Calendar,
  Layers,
  FileCheck,
  TrendingUp,
  Award
} from 'lucide-react';

interface ReportsSectionProps {
  students: Student[];
  modules: Module[];
  grades: Grade[];
  absences: Absence[];
  tardiness: Tardy[];
  alerts: AcademicAlert[];
}

export const ReportsSection: React.FC<ReportsSectionProps> = ({
  students,
  modules,
  grades,
  absences,
  tardiness,
  alerts
}) => {
  const [copied, setCopied] = useState(false);
  const [reportTitle, setReportTitle] = useState('Rapport Pédagogique du Trimestre 1');

  // Compute overall stats
  const studentStats = useMemo(() => {
    return computeAllStudentStats(students, grades, absences, tardiness);
  }, [students, grades, absences, tardiness]);

  const statsList = Object.values(studentStats) as StudentStats[];

  // Group stats calculations
  const summaryKPIs = useMemo(() => {
    if (statsList.length === 0) return { meanGpa: 0, highestGpa: 0, safeRatio: 100, totalsAbs: 0 };
    
    const gpas = statsList.map(s => s.gpa);
    const meanGpa = gpas.reduce((acc, v) => acc + v, 0) / gpas.length;
    const highestGpa = Math.max(...gpas);
    
    const atRisk = students.filter(s => s.status === 'À risque').length;
    const safeRatio = ((students.length - atRisk) / students.length) * 100;

    const totalsAbs = absences.reduce((acc, curr) => acc + curr.hours, 0);

    return {
      meanGpa: Math.round(meanGpa * 100) / 100,
      highestGpa,
      safeRatio: Math.round(safeRatio * 10) / 10,
      totalsAbs
    };
  }, [statsList, students, absences]);

  // Aggregate stats by Class
  const classStats = useMemo(() => {
    const classes: Record<string, { sum: number; count: number }> = {};
    Object.keys(studentStats).forEach((studentId) => {
      const stat = studentStats[studentId];
      const student = students.find((s) => s.id === studentId);
      if (student) {
        const className = student.className;
        if (!classes[className]) {
          classes[className] = { sum: 0, count: 0 };
        }
        classes[className].sum += stat.gpa;
        classes[className].count += 1;
      }
    });

    return Object.entries(classes).map(([className, data]) => ({
      className,
      gpa: Math.round((data.sum / data.count) * 100) / 100,
      count: data.count
    }));
  }, [studentStats, students]);

  // Generate dynamic recommendation insights list
  const generalRecommendations = useMemo(() => {
    const recs: string[] = [];
    if (summaryKPIs.meanGpa < 11.5) {
      recs.push("🚨 Renforcement général des acquis : Programmer des devoirs d'entraînement supplémentaires pour la cohorte M1-DATA suite à des résultats hétérogènes sur le module de Programmation Python.");
    } else {
      recs.push("✅ Consolidation positive : La moyenne globale est satisfaisante. Recommander des séances avancées facultatives pour maintenir la dynamique positive.");
    }

    if (alerts.length > 3) {
      recs.push(`⚠️ Alerte Assiduité administrative : Planifier un audit de présence pour convoquer les 3 étudiants ayant cumulé plus de 8 heures d'absences injustifiées.`);
    }

    const lowPerformersCount = statsList.filter(s => s.gpa < 10).length;
    if (lowPerformersCount > 0) {
      recs.push(`👥 Programme de parrainage étudiant : Associer les ${lowPerformersCount} élèves ayant une moyenne de validation inférieure à 10/20 avec des parrains de niveau "Excellent" de la même classe.`);
    }

    return recs;
  }, [summaryKPIs, alerts, statsList]);

  // Compile raw HTML for instant copy playboards
  const compiledHtmlString = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #1e293b; padding: 30px; }
    .header { border-bottom: 2px solid #5EA8DA; padding-bottom: 15px; margin-bottom: 25px; }
    .title { color: #0f172a; font-size: 24px; margin: 0; }
    .kpi-row { display: flex; gap: 15px; margin-bottom: 30px; }
    .kpi-card { flex: 1; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .kpi-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
    .kpi-val { font-size: 28px; font-weight: bold; color: #011d33; margin-top: 5px; }
    .rec-box { background-color: #F4DBE3; padding: 20px; border-radius: 8px; margin-top: 35px; border-left: 5px solid #5EA8DA; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">${reportTitle}</h1>
    <p style="color: #64748b; font-size: 12px; margin-top: 5px;">Généré automatiquement par EduTrack Analytics | Maroc Ynov Campus</p>
  </div>
  
  <div class="kpi-row">
    <div class="kpi-card" style="background-color: #AFE3F4;">
      <div class="kpi-title">Moyenne Générale</div>
      <div class="kpi-val">${summaryKPIs.meanGpa}/20</div>
    </div>
    <div class="kpi-card" style="background-color: #B9DDF5;">
      <div class="kpi-title">Taux de Sécurité</div>
      <div class="kpi-val">${summaryKPIs.safeRatio}%</div>
    </div>
    <div class="kpi-card" style="background-color: #83C5F1;">
      <div class="kpi-title">Absences Totales</div>
      <div class="kpi-val">${summaryKPIs.totalsAbs} heures</div>
    </div>
  </div>

  <h2>Préconisations du Corps Enseignant</h2>
  <ul>
    ${generalRecommendations.map(r => `<li>${r}</li>`).join('')}
  </ul>
</body>
</html>`;
  }, [reportTitle, summaryKPIs, generalRecommendations]);

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(compiledHtmlString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="reports-section" className="space-y-6 animate-fade-in pb-12">
      
      {/* Intro block */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-sans">
            Générateur de Rapports Académiques
          </h2>
          <p className="text-slate-500 text-xs mt-1 font-sans">
            Générez des rapports synthétiques PDF ou HTML formatés selon la charte Ynov pour l&apos;inspecteur général ou la direction.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleCopyHtml}
            id="btn-copy-html-report"
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold font-sans px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Copié dans le presse-papier !</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copier le Code HTML</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            id="btn-print-report"
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-white text-xs font-bold font-sans px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#AFE3F4]" />
            <span>Imprimer / PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Config Title and Main Report Sheet Previews */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest font-sans">
              Paramètres Administrateur
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 block font-sans">Objet du rapport :</label>
              <input
                id="report-title-input"
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Ex. Rapport Pédagogique Trimestre 1..."
                className="w-full bg-slate-50 border border-slate-250 py-2.5 px-3.5 text-xs text-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#5EA8DA] font-sans"
              />
            </div>
          </div>

          {/* Actual Print Sheet Canvas */}
          <div id="report-print-sheet" className="bg-white border border-slate-250 rounded-2xl p-8 shadow-md space-y-6 relative overflow-hidden text-slate-800 print:border-none print:shadow-none font-sans">
            {/* Stamp Ribbon background */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#AFE3F4]/15 rounded-full blur-2xl pointer-events-none" />

            {/* School Header */}
            <div className="border-b-2 border-[#5EA8DA] pb-5 flex justify-between items-start">
              <div>
                <h4 className="text-[10px] tracking-widest font-bold uppercase text-slate-400 font-sans">DOCUMENT INTERNE • YNOV CAMPUS</h4>
                <h3 className="text-xl font-extrabold text-slate-950 mt-1 font-sans">{reportTitle}</h3>
                <p className="text-xs text-slate-500 mt-1 font-sans">
                  Généré le {new Date().toLocaleDateString('fr-FR')} | Établissement Maroc
                </p>
              </div>
              <div className="bg-slate-100 border border-slate-200 text-slate-700 p-2 text-center rounded-xl font-sans min-w-[100px]">
                <span className="text-[9px] text-slate-400 block font-bold font-sans">Période</span>
                <span className="text-[11px] font-mono font-bold leading-none">TRIMESTRE 1</span>
              </div>
            </div>

            {/* Print KPIs Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-[#AFE3F4]/40 border border-[#AFE3F4]/60 rounded-xl">
                <span className="text-[9px] uppercase font-mono font-bold text-slate-700">Moyenne Générale</span>
                <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{summaryKPIs.meanGpa}<span className="text-sm font-semibold text-slate-400">/20</span></div>
              </div>

              <div className="p-4 bg-[#B9DDF5]/40 border border-[#B9DDF5]/60 rounded-xl">
                <span className="text-[9px] uppercase font-mono font-bold text-slate-700">Taux de Réussite</span>
                <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{summaryKPIs.safeRatio}%</div>
              </div>

              <div className="p-4 bg-[#F4DBE3]/40 border border-[#F4DBE3]/60 rounded-xl">
                <span className="text-[9px] uppercase font-mono font-bold text-slate-700">Absences cumulées</span>
                <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{summaryKPIs.totalsAbs}h</div>
              </div>
            </div>

            {/* Comparative class stats */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-sans flex items-center gap-1.5 border-b border-slate-150 pb-1 w-full">
                <Award className="w-4 h-4 text-[#83C5F1]" />
                <span>Performances par cohorte académique</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {classStats.map((c) => (
                  <div key={c.className} className="p-3 bg-slate-50 border border-slate-100/60 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800 text-xs font-sans">{c.className}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5 font-sans">({c.count} élèves admis)</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      Moy: {c.gpa}/20
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations Sheet block */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-550 border-b border-slate-150 pb-1 font-sans flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                <span>Mesures & Directives Pédagogiques Prescrites</span>
              </h4>

              <div className="space-y-2 font-sans text-xs">
                {generalRecommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 bg-[#F4DBE3]/20 border border-[#F4DBE3]/30 rounded-xl leading-relaxed text-slate-700">
                    {rec}
                  </div>
                ))}
              </div>
            </div>

            {/* Print footer stamp */}
            <div className="pt-6 border-t border-slate-150 flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>Maroc Ynov Campus - Département DATA</span>
              <span>Visa de validation administrative</span>
            </div>

          </div>
        </div>

        {/* Right Info pane */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span>Génération de Rapports</span>
            </h3>
            
            <p className="text-[11.5px] text-slate-500 leading-normal font-sans">
              Notre outil compile des KPIs réels (moyennes, coefficients scolaires, quotas d&apos;absences) calculés en temps réel d&apos;après les fiches d&apos;importation locales et distantes.
            </p>

            <div className="bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-200/55 text-[10.5px] text-slate-400 leading-normal font-sans">
              💡 <strong>Astuce Print:</strong> Lors de l&apos;impression via le bouton supérieur, sélectionnez <strong>&quot;Enregistrer au format PDF&quot;</strong> pour enregistrer la fiche sur votre ordinateur.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
