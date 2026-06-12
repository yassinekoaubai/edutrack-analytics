import {
  GraduationCap,
  UploadCloud,
  BarChart3,
  Users,
  BellRing,
  FileText,
  Settings,
  RotateCcw,
  LucideIcon,
} from 'lucide-react';

export type TabId = 'overview' | 'imports' | 'analytics' | 'students' | 'alerts' | 'reports' | 'api-link';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  apiConnected: boolean;
  onRefreshData: () => void;
  alertCount: number;
}

interface MenuItem {
  id: TabId;
  label: string;
  icon: LucideIcon;
  color: string;
  badge?: boolean;
}

const menuItems: MenuItem[] = [
  { id: 'overview', label: 'Vue Globale', icon: GraduationCap, color: '#AFE3F4' },
  { id: 'imports', label: 'Gestion des Imports', icon: UploadCloud, color: '#B9DDF5' },
  { id: 'analytics', label: 'Analyses & Clustering', icon: BarChart3, color: '#83C5F1' },
  { id: 'students', label: 'Directoire Étudiants', icon: Users, color: '#F4DBE3' },
  { id: 'alerts', label: "Centre d'Alertes", icon: BellRing, color: '#5EA8DA', badge: true },
  { id: 'reports', label: 'Rapports Professionnels', icon: FileText, color: '#AFE3F4' },
];

/** Sidebar navigation with tab switching, API status, and data refresh. */
export function Navigation({
  activeTab,
  onTabChange,
  apiConnected,
  onRefreshData,
  alertCount,
}: NavigationProps) {
  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col justify-between">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5EA8DA] to-[#AFE3F4] flex items-center justify-center shadow-lg">
            <GraduationCap className="w-6 h-6 text-slate-900 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white font-sans">
              EduTrack <span className="text-[#83C5F1]">Analytics</span>
            </h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
              MAROC YNOV CAMPUS
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 font-mono">
          Tableaux de Bord
        </p>

        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 transform group text-left ${
                isActive
                  ? 'scale-[1.02] shadow-md font-semibold'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
              style={{
                backgroundColor: isActive ? item.color : undefined,
                color: isActive ? '#0F172A' : undefined,
              }}
              title={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                <span className="text-sm tracking-tight font-sans">{item.label}</span>
              </div>

              {item.badge && alertCount > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? 'bg-slate-900 text-white' : 'bg-red-500 text-white animate-bounce'
                  }`}
                >
                  {alertCount}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-6 border-t border-slate-800 mt-6 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 font-mono">
            Paramétrage
          </p>

          <button
            id="nav-tab-api"
            onClick={() => onTabChange('api-link')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-all duration-300 ${
              activeTab === 'api-link'
                ? 'bg-[#B9DDF5] text-slate-900 font-semibold'
                : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5 text-slate-400 group-hover:text-white" />
            <span className="font-sans">Configuration API</span>
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/50 space-y-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                apiConnected
                  ? 'bg-emerald-500 shadow-[0_0_8px_4px_rgba(16,185,129,0.2)]'
                  : 'bg-rose-500 shadow-[0_0_8px_4px_rgba(244,63,94,0.2)]'
              }`}
            />
            <span className="text-xs text-slate-300 font-sans tracking-tight">
              {apiConnected ? "Connecté à l'API" : 'API indisponible'}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase bg-slate-800 px-1.5 py-0.5 rounded">
            {apiConnected ? 'LIVE' : 'OFF'}
          </span>
        </div>

        <button
          onClick={onRefreshData}
          id="btn-refresh-data"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-slate-800 rounded-lg hover:bg-slate-800 hover:border-slate-700 text-xs text-slate-400 hover:text-slate-100 transition-colors cursor-pointer group"
          title="Rafraîchir les données depuis l'API"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-45 transition-transform" />
          <span className="font-sans">Rafraîchir les données</span>
        </button>
      </div>
    </aside>
  );
}
