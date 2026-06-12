import { useState } from 'react';
import { useDashboardOverview } from '../hooks/useAcademicData';
import { DataLoader } from '../components/DataLoader';
import { StatCard } from '../components/StatCard';
import { ModuleSuccessRateChart } from '../components/charts/ModuleSuccessRateChart';
import { RiskLevelPieChart } from '../components/charts/RiskLevelPieChart';
import { TrendingUp, AlertTriangle, Calendar, Clock, BookOpen } from 'lucide-react';

const BUCKET_COLORS: Record<string, string> = {
  '[0-8)': '#F4DBE3',
  '[8-10)': '#AFE3F4',
  '[10-12)': '#B9DDF5',
  '[12-14)': '#83C5F1',
  '[14-16)': '#5EA8DA',
  '[16-20]': '#AFE3F4',
};

const BAR_COLORS = ['bg-[#5EA8DA]', 'bg-[#83C5F1]', 'bg-[#AFE3F4]'];

function mapStatutColor(statut: string | null | undefined): string {
  if (!statut || typeof statut !== 'string') return '#0EA5E9';
  const s = statut.toLowerCase();
  if (s.includes('excellent')) return '#10B981';
  if (s.includes('irrégulier') || s.includes('irregulier')) return '#F59E0B';
  if (s.includes('risque')) return '#F43F5E';
  if (s.includes('progression')) return '#5EA8DA';
  return '#0EA5E9';
}

interface OverviewPageProps {
  refreshKey?: number;
  onViewStudent: (studentId: string) => void;
}

/** Dashboard overview with KPIs, charts, and active alerts from the API. */
export function OverviewPage({ refreshKey = 0, onViewStudent }: OverviewPageProps) {
  const { overview, classComparison, gradeDistribution, moduleStats, scatter, alerts, loading, error } =
    useDashboardOverview(refreshKey);

  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    label: string;
    score: number;
    abs: number;
  } | null>(null);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  const scatterPoints = scatter.map((pt) => ({
    id: String(pt.student_id),
    name: pt.student_name,
    gpa: pt.gpa,
    abs: pt.total_absences,
    status: pt.statut,
    cx: 10 + (pt.gpa / 20) * 80,
    cy: 90 - (Math.min(16, pt.total_absences) / 16) * 80,
  }));

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const maxBucketCount = Math.max(...gradeDistribution.map((b) => b.count), 1);

  return (
    <DataLoader loading={loading} error={error}>
      <div id="overview-section" className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">
              Performances Académiques
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-sans">
              Données en temps réel depuis la base de données EduTrack.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 px-4 py-2 rounded-xl text-slate-700 text-xs font-medium font-sans">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>{overview.progression_globale}</span>
          </div>
        </div>

        {overview.total_students === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-8 text-center">
            <p className="text-sm font-semibold text-amber-800 font-sans">Aucune donnée en base</p>
            <p className="text-xs text-amber-600 mt-2 font-sans">
              Importez des étudiants et des notes via l&apos;onglet Imports pour alimenter ce tableau de bord.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Moyenne Générale"
                accentColor="#83C5F1"
                value={
                  <>
                    {overview.moyenne_generale}
                    <span className="text-sm font-medium text-slate-400">/20</span>
                  </>
                }
                footer={
                  <>
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{overview.total_students} étudiant(s) en base</span>
                  </>
                }
              />
              <StatCard
                label="Taux de Réussite"
                accentColor="#AFE3F4"
                value={
                  <>
                    {overview.taux_reussite}
                    <span className="text-sm font-medium text-slate-400">%</span>
                  </>
                }
                footer={
                  <>
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold text-emerald-600 font-mono">
                      {overview.students_passing}/{overview.total_students}
                    </span>
                    <span className="text-slate-500">élèves avec moyenne ≥ 10</span>
                  </>
                }
              />
              <StatCard
                label="Absences Moyennes"
                accentColor="#B9DDF5"
                value={
                  <>
                    {overview.taux_absence}
                    <span className="text-sm font-medium text-slate-400">h</span>
                  </>
                }
                footer={
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-semibold text-amber-600 font-mono">
                      {overview.unjustified_absences}
                    </span>
                    <span className="text-slate-500">absences non-justifiées</span>
                  </>
                }
              />
              <StatCard
                label="Étudiants à Risque"
                accentColor="#F4DBE3"
                value={overview.nombre_etudiants_a_risque}
                footer={
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span className="font-semibold text-rose-600 font-mono">
                      {overview.critical_alerts}
                    </span>
                    <span className="text-slate-500">alertes actives</span>
                  </>
                }
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
                <h3 className="text-base font-bold text-slate-800 font-sans">Moyenne Générale par Classe</h3>
                <p className="text-slate-400 text-xs font-sans mt-0.5">Source: GET /dashboard/classes/compare</p>

                {classComparison.length === 0 ? (
                  <p className="text-xs text-slate-400 mt-8 text-center font-sans">Aucune classe enregistrée.</p>
                ) : (
                  <div className="relative mt-6 h-56 flex items-end justify-around border-b border-l border-slate-100 pb-2 pl-4">
                    {classComparison.map((cStat, index) => {
                      const heightPct = (cStat.moyenne_generale / 20) * 100;
                      const isHovered = hoveredBar === cStat.class_name;
                      return (
                        <div
                          key={cStat.class_name}
                          className="flex flex-col items-center w-20 group relative cursor-pointer"
                          onMouseEnter={() => setHoveredBar(cStat.class_name)}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          <div
                            className={`absolute -top-12 bg-slate-900 text-white text-[11px] p-2 rounded-lg font-mono z-10 transition-opacity ${
                              isHovered ? 'opacity-100' : 'opacity-0'
                            }`}
                          >
                            <span>{cStat.class_name}</span>
                            <span className="font-bold block">{cStat.moyenne_generale}/20</span>
                            <span className="text-[10px] text-slate-300">{cStat.total_students} élèves</span>
                          </div>
                          <div
                            className={`w-12 ${BAR_COLORS[index % BAR_COLORS.length]} rounded-t-lg transition-all`}
                            style={{ height: `${Math.max(heightPct, 5)}%`, minHeight: '15px' }}
                          >
                            <span className="text-[11px] font-mono font-bold text-slate-900 flex justify-center mb-1">
                              {cStat.moyenne_generale}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 mt-2 font-mono font-bold">{cStat.class_name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
                <h3 className="text-base font-bold text-slate-800 font-sans">Corrélation: Notes vs. Absences</h3>
                <p className="text-slate-400 text-xs font-sans mt-0.5">Source: GET /dashboard/scatter</p>

                <div className="relative mt-6 h-56 border-b border-l border-slate-200 pl-4 pb-2">
                  <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                    <line x1="10" y1="50" x2="90" y2="50" stroke="#f1f5f9" strokeWidth="0.5" strokeDasharray="1" />
                    <line x1="50" y1="10" x2="50" y2="90" stroke="#f1f5f9" strokeWidth="0.5" strokeDasharray="1" />
                    {scatterPoints.map((pt) => (
                      <circle
                        key={pt.id}
                        cx={pt.cx}
                        cy={pt.cy}
                        r={hoveredPoint?.label === pt.name ? 4.5 : 3}
                        fill={mapStatutColor(pt.status)}
                        stroke="#ffffff"
                        strokeWidth="0.5"
                        className="cursor-pointer"
                        onClick={() => onViewStudent(pt.id)}
                        onMouseEnter={() =>
                          setHoveredPoint({ x: pt.cx, y: pt.cy, label: pt.name, score: pt.gpa, abs: pt.abs })
                        }
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    ))}
                  </svg>
                  {hoveredPoint && (
                    <div
                      className="absolute bg-slate-900 text-white p-2.5 rounded-xl text-xs font-mono shadow-xl z-20 pointer-events-none"
                      style={{
                        left: `${hoveredPoint.x}%`,
                        top: `${hoveredPoint.y - 12}%`,
                        transform: 'translate(-50%, -100%)',
                      }}
                    >
                      <span className="font-bold">{hoveredPoint.label}</span>
                      <span className="block text-[10px] text-teal-400">Moyenne: {hoveredPoint.score}/20</span>
                      <span className="block text-[10px] text-orange-400">Absences: {hoveredPoint.abs}h</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ModuleSuccessRateChart data={moduleStats} />
              <RiskLevelPieChart alerts={alerts} totalStudents={overview.total_students} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs lg:col-span-2">
                <h3 className="text-base font-bold text-slate-800 font-sans">Distribution des Moyennes Générales</h3>
                <p className="text-slate-400 text-xs font-sans">Source: GET /dashboard/grades/distribution</p>
                <div className="space-y-3.5 mt-5">
                  {gradeDistribution.map((bucket) => {
                    const pct = (bucket.count / maxBucketCount) * 100;
                    return (
                      <div key={bucket.label} className="flex items-center gap-4">
                        <span className="w-16 text-xs text-slate-600 font-mono font-bold">{bucket.label}</span>
                        <div className="flex-1 bg-slate-50 h-6 rounded-lg overflow-hidden relative border border-slate-100/40">
                          <div
                            className="h-full rounded-r-lg transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: BUCKET_COLORS[bucket.label] ?? '#83C5F1',
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

              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-slate-800 font-sans">Alertes Pédagogiques</h3>
                  <span className="bg-rose-50 text-rose-600 font-mono font-bold text-xs px-2.5 py-0.5 rounded-full">
                    {activeAlerts.length}
                  </span>
                </div>
                <p className="text-slate-400 text-xs font-sans mb-3">Source: GET /alerts/</p>

                <div className="space-y-3.5 max-h-48 overflow-y-auto">
                  {activeAlerts.length === 0 && (
                    <p className="text-xs text-slate-400 font-sans text-center py-4">Aucune alerte en base.</p>
                  )}
                  {activeAlerts.slice(0, 5).map((a) => (
                    <div
                      key={a.id}
                      className="p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:border-slate-200"
                      onClick={() => onViewStudent(a.studentId)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800">{a.title}</span>
                        <span className="text-[9px] font-mono text-slate-400 capitalize">{a.type}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{a.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DataLoader>
  );
}
