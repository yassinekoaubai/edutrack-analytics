/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { computeAllStudentStats, predictFailureRiskScore } from '../utils/dataEngine';
import { useStudentsData, useStudentProfile } from '../hooks/useAcademicData';
import { DataLoader } from './DataLoader';
import { 
  Search, 
  Filter, 
  Calendar, 
  BookOpen, 
  ShieldAlert, 
  TrendingDown, 
  User, 
  CheckCircle,
  FileSpreadsheet,
  X,
  Mail,
  Award,
  Clock,
  ArrowRight
} from 'lucide-react';

interface StudentsSectionProps {
  refreshKey?: number;
  selectedStudentId: string | null;
  onSelectStudent: (id: string | null) => void;
}

export const StudentsSection: React.FC<StudentsSectionProps> = ({
  refreshKey = 0,
  selectedStudentId,
  onSelectStudent,
}) => {
  const { students, modules, grades, absences, tardiness, evaluations, loading: listLoading, error: listError } =
    useStudentsData(refreshKey);
  const { data: profileData, loading: profileLoading, error: profileError } = useStudentProfile(selectedStudentId, refreshKey);

  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Compute stats for the list
  const studentStats = useMemo(() => {
    return computeAllStudentStats(students, grades, absences, tardiness);
  }, [students, grades, absences, tardiness]);

  // List of distinct classes for select filters
  const distinctClasses = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.className)));
  }, [students]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClass = classFilter === 'all' || s.className === classFilter;
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchClass && matchStatus;
    });
  }, [students, searchQuery, classFilter, statusFilter]);

  // Detailed selected student data (Now using backend data)
  const studentProfile = useMemo(() => {
    if (!profileData) return null;

    // We still need the base student object for names/etc if not fully in profileData
    // But profileData from backend (EtudiantRead) should have everything
    const stats = studentStats[String(profileData.id)] || {
      gpa: 0,
      totalAbsences: profileData.absences_count || 0,
      unjustifiedAbsences: profileData.absences_count || 0,
      tardyCount: profileData.retards_count || 0,
      gpaTrend: 0,
      rank: profileData.classement || 0
    };

    // Use risk score from backend if available
    const failureRiskScore = profileData.risk_score ?? predictFailureRiskScore(stats, 10, 8);

    // Generate recommendations
    const recommendations: string[] = [];
    if (profileData.notes) {
      profileData.notes.forEach(n => {
        if (n.valeur !== null && n.valeur < 10) {
          recommendations.push(`📚 Renforcer l'accompagnement sur le module "${n.module}" (Moyenne actuelle: ${n.valeur}/20).`);
        }
      });
    }
    
    if (stats.gpa < 10) recommendations.push("⚠️ Moyenne globale sous la barre d'admission (10/20).");
    if (stats.totalAbsences > 6) recommendations.push("🛑 Seuil critique d'absences dépassé.");
    
    if (recommendations.length === 0) {
      recommendations.push("🌟 Excellence académique et assiduité remarquable.");
    }

    return {
      student: {
        id: String(profileData.id),
        firstName: profileData.prenom,
        lastName: profileData.nom,
        email: profileData.email || "",
        className: profileData.classe || "Non assigné",
      },
      stats,
      notes: profileData.notes || [],
      absencesCount: profileData.absences_count || 0,
      retardsCount: profileData.retards_count || 0,
      failureRiskScore,
      recommendations
    };
  }, [profileData, studentStats]);

  return (
    <DataLoader loading={listLoading || (!!selectedStudentId && profileLoading)} error={listError || profileError}>
    <div id="students-section" className="space-y-6 animate-fade-in">

      {selectedStudentId && studentProfile ? (
        /* Detailed Student File view */
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md animate-scale-up space-y-6">
          
          {/* Header row with breadcrumb-like close */}
          <div className="flex justify-between items-start border-b border-slate-50 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#AFE3F4] text-slate-950 flex items-center justify-center font-bold font-sans text-xl shadow-xs">
                {studentProfile.student.firstName.charAt(0)}{studentProfile.student.lastName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-extrabold text-slate-800 font-sans">
                    {studentProfile.student.firstName} {studentProfile.student.lastName}
                  </h3>
                  <span className="bg-slate-100 text-slate-600 font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wide">
                    {studentProfile.student.className}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-slate-400 mt-1 font-sans">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {studentProfile.student.email}</span>
                  <span>•</span>
                  <span>ID: {studentProfile.student.id}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => onSelectStudent(null)}
              id="btn-close-profile"
              className="p-2 border border-slate-200/50 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              title="Retour à la liste"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Study indicators card */}
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl relative overflow-hidden space-y-4">
                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-sans">Performance Trimestrielle</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block font-sans">MOYENNE</span>
                    <span className="text-3xl font-extrabold text-slate-900 font-mono">
                      {studentProfile.stats?.gpa || 0}<span className="text-xs font-normal text-slate-400">/20</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block font-sans font-mono-sub uppercase">Rang Classe</span>
                    <span className="text-3xl font-extrabold text-slate-900 font-mono">
                      #{studentProfile.stats?.rank || 0}<span className="text-xs font-normal text-slate-400">/{students.filter(s => s.className === studentProfile.student.className).length}</span>
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-200/60 pt-4 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold font-sans">ABSENCES</span>
                      <span className="text-xs font-mono font-bold text-slate-700">{studentProfile.absencesCount}h</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold font-sans">RETARDS</span>
                      <span className="text-xs font-mono font-bold text-slate-700">{studentProfile.retardsCount} éven.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Predictor Panel: BONUS A failure score */}
              <div className="p-5 border border-slate-200 rounded-2xl space-y-3.5 relative">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold text-slate-700 font-sans tracking-tight uppercase">Risque de Décrochage</h4>
                  <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">Predictive Risk Index</span>
                </div>

                <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700"
                    style={{ 
                      width: `${studentProfile.failureRiskScore}%`,
                      backgroundColor: studentProfile.failureRiskScore > 50 ? '#EF4444' : studentProfile.failureRiskScore > 30 ? '#F59E0B' : '#10B981'
                    }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-sans">Probabilité calculée :</span>
                  <span className={`font-mono font-extrabold text-sm ${
                    studentProfile.failureRiskScore > 50 ? 'text-red-600' : studentProfile.failureRiskScore > 30 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {studentProfile.failureRiskScore}%
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 leading-normal font-sans italic">
                  Ce score est recalculé en temps réel en combinant : moyenne, tendances d&apos;examens, retards récurrents et heures d&apos;absences injustifiées.
                </p>
              </div>
            </div>

            {/* Column 2 & 3: Modules detail grid and logs */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Grades Grid table */}
              <div className="border border-slate-200/60 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 p-4 border-b border-slate-150 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono uppercase text-slate-600">Relevé Synthétique de Notes</span>
                  <Award className="w-4 h-4 text-slate-500" />
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {studentProfile.notes.map((n, idx) => {
                    const valCol = n.valeur !== null && n.valeur >= 10 ? 'text-emerald-700' : 'text-rose-600';

                    return (
                      <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                        <div>
                          <div className="font-semibold text-slate-800 font-sans">{n.module}</div>
                          <div className="text-[10px] text-slate-400 font-sans">Dernière évaluation enregistrée</div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="border-l border-slate-150 pl-4 text-right min-w-[70px]">
                            <span className="text-[9px] text-slate-400 block font-bold font-sans">MOYENNE</span>
                            <span className={`font-mono font-extrabold text-sm ${valCol}`}>
                              {n.valeur !== null ? `${n.valeur}/20` : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {studentProfile.notes.length === 0 && (
                    <div className="p-8 text-center text-slate-400 italic">Aucune note enregistrée pour cet étudiant.</div>
                  )}
                </div>
              </div>

              {/* Pedagogic Recommendations List */}
              <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-xs space-y-3">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 font-sans">
                  Préconisations Pédagogiques individualisées
                </h4>
                
                <div className="space-y-2">
                  {studentProfile.recommendations.map((rec, rIdx) => (
                    <div key={rIdx} className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl text-[11px] leading-relaxed text-slate-700 font-sans flex items-start gap-2.5">
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      ) : (
        /* Students Directory List */
        <div className="space-y-6">
          
          {/* Filters shelf */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-4 items-center">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
              <input
                id="student-search-input"
                type="text"
                placeholder="Rechercher par nom, email ou ID d'étudiant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#83C5F1] text-slate-700 font-sans"
              />
            </div>

            {/* Class selection dropdown */}
            <div className="flex items-center gap-2 w-full md:w-fit shrink-0">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                id="class-filter"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans py-2.5 px-3 focus:outline-none text-slate-600 w-full md:w-36 cursor-pointer"
              >
                <option value="all">Toutes Classes</option>
                {distinctClasses.map((cl) => (
                  <option key={cl} value={cl}>{cl}</option>
                ))}
              </select>
            </div>

            {/* Status selection dropdown */}
            <div className="w-full md:w-fit shrink-0">
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans py-2.5 px-3 focus:outline-none text-slate-600 w-full md:w-36 cursor-pointer"
              >
                <option value="all">Tous Profiles</option>
                <option value="Excellent">Excellent</option>
                <option value="Régulier">Régulier</option>
                <option value="En progression">En progression</option>
                <option value="Irrégulier">Irrégulier</option>
                <option value="À risque">À risque</option>
              </select>
            </div>

          </div>

          {/* Directory Count */}
          <div className="flex justify-between items-center text-xs text-slate-500 font-sans px-2">
            <span>{filteredStudents.length} étudiant{filteredStudents.length > 1 ? 's' : ''} correspondant{filteredStudents.length > 1 ? 's' : ''}</span>
            <span>Conseil: Cliquez sur un étudiant pour consulter sa fiche détaillée.</span>
          </div>

          {/* Students list grid table */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-mono text-[9.5px] uppercase border-b border-slate-100">
                    <th className="p-4 pl-6">Étudiant</th>
                    <th className="p-4 text-center">ID</th>
                    <th className="p-4 text-center">Classe</th>
                    <th className="p-4 text-center">Moyenne Générale</th>
                    <th className="p-4 text-center">Abs (justif.)</th>
                    <th className="p-4 text-center">Retards</th>
                    <th className="p-4 text-right pr-6">Statut Segmenté</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {filteredStudents.map((student) => {
                    const stats = studentStats[student.id] || { gpa: 10, totalAbsences: 0, unjustifiedAbsences: 0, tardyCount: 0 };
                    
                    let statusColor = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                    if (student.status === 'Régulier') statusColor = 'bg-sky-50 text-sky-600 border border-sky-100';
                    if (student.status === 'En progression') statusColor = 'bg-[#B9DDF5]/40 text-slate-800 border border-[#83C5F1]/30';
                    if (student.status === 'Irrégulier') statusColor = 'bg-amber-50 text-amber-600 border border-amber-100';
                    if (student.status === 'À risque') statusColor = 'bg-rose-50 text-rose-500 border border-rose-100 animate-pulse';

                    return (
                      <tr 
                        key={student.id}
                        id={`student-row-${student.id}`}
                        onClick={() => onSelectStudent(student.id)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="p-4 pl-6 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-[#5EA8DA] font-sans">
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 font-sans hover:text-[#5EA8DA]">{student.firstName} {student.lastName}</div>
                            <div className="text-[10px] text-slate-400">{student.email}</div>
                          </div>
                        </td>
                        <td className="p-4 text-center font-mono text-slate-500">{student.id}</td>
                        <td className="p-4 text-center font-mono text-slate-600 font-bold">{student.className}</td>
                        <td className="p-4 text-center font-mono">
                          <span className="font-bold text-slate-800 text-sm">{stats.gpa}</span>
                          <span className="text-[10px] text-slate-300">/20</span>
                        </td>
                        <td className="p-4 text-center font-mono text-slate-500">
                          <span className="font-bold text-slate-700">{stats.totalAbsences}h</span>
                          <span className="text-[10px] text-slate-400 ml-1">({stats.totalAbsences - stats.unjustifiedAbsences}j)</span>
                        </td>
                        <td className="p-4 text-center font-mono text-slate-500">
                          <span className="font-semibold">{stats.tardyCount}</span>
                        </td>
                        <td className="p-4 text-right pr-6">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase leading-none ${statusColor}`}>
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr className="italic text-slate-400">
                      <td colSpan={7} className="p-6 text-center">Aucun étudiant ne correspond à vos filtres.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
    </DataLoader>
  );
};
