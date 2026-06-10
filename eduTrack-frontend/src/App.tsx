/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  loadStateFromStorage, 
  saveStateToStorage, 
  AppState, 
  generateInitialGrades, 
  generateInitialAbsences, 
  generateInitialTardiness, 
  generateInitialAlerts,
  INITIAL_STUDENTS,
  INITIAL_MODULES,
  INITIAL_EVALUATIONS,
  INITIAL_IMPORT_LOGS
} from './data/mockData';
import { ApiService } from './utils/apiService';
import { Navigation, TabId } from './components/Navigation';
import { OverviewSection } from './components/OverviewSection';
import { ImportsSection } from './components/ImportsSection';
import { AnalyticsSection } from './components/AnalyticsSection';
import { StudentsSection } from './components/StudentsSection';
import { AlertsSection } from './components/AlertsSection';
import { ReportsSection } from './components/ReportsSection';
import { ApiConfigTab } from './components/ApiConfigTab';
import { Student, Grade, Absence, Tardy, ImportLog, AcademicAlert } from './types';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadStateFromStorage());
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // Api configurations
  const [apiMode, setApiMode] = useState<'offline' | 'online'>(() => ApiService.getMode());
  const [apiUrl, setApiUrl] = useState<string>(() => ApiService.getBaseUrl());
  const [apiSyncing, setApiSyncing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const syncFromBackend = useCallback(async () => {
    if (ApiService.getMode() !== 'online') return;

    setApiSyncing(true);
    setApiError(null);
    try {
      const { students, alerts } = await ApiService.syncFromBackend();
      setState((prev) => ({
        ...prev,
        students,
        alerts,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de joindre le serveur EduTrack.';
      setApiError(message);
    } finally {
      setApiSyncing(false);
    }
  }, []);

  // Automatically persist changes to localstorage when state transitions
  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);

  useEffect(() => {
    if (apiMode === 'online') {
      syncFromBackend();
    } else {
      setApiError(null);
    }
  }, [apiMode, apiUrl, syncFromBackend]);

  // Synchronizes mode from child setters
  const handleModeChange = (mode: 'offline' | 'online') => {
    setApiMode(mode);
    ApiService.setMode(mode);
    if (mode === 'online') {
      syncFromBackend();
    }
  };

  const handleUrlChange = (url: string) => {
    setApiUrl(url);
    ApiService.setBaseUrl(url);
  };

  // Safe reset routine
  const handleResetData = useCallback(() => {
    const freshState: AppState = {
      students: INITIAL_STUDENTS,
      modules: INITIAL_MODULES,
      grades: generateInitialGrades(),
      absences: generateInitialAbsences(),
      tardiness: generateInitialTardiness(),
      evaluations: INITIAL_EVALUATIONS,
      importLogs: INITIAL_IMPORT_LOGS,
      alerts: generateInitialAlerts()
    };
    setState(freshState);
    setSelectedStudentId(null);
    setActiveTab('overview');
  }, []);

  // Student card navigation linkage
  const handleViewStudentFile = (studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveTab('students');
  };

  // Master import append processor
  const handleImportSuccess = (
    type: 'students' | 'modules' | 'tardy' | 'absences' | 'evaluations' | 'grades',
    data: any[],
    fileName: string
  ) => {
    setState((prev) => {
      // Create detailed history log entry
      const logEntry: ImportLog = {
        id: `IMP-LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString('fr-FR'),
        fileName,
        type,
        rowCount: data.length,
        status: 'Succès',
        details: `Importation réussie : ${data.length} enregistrements traités et insérés.`
      };

      const updatedLogs = [logEntry, ...prev.importLogs];

      // Merge elements depending on row category
      switch (type) {
        case 'students': {
          const incoming = data as Student[];
          const filtered = prev.students.filter((ex) => !incoming.some((inc) => inc.id === ex.id));
          return { ...prev, students: [...filtered, ...incoming], importLogs: updatedLogs };
        }
        case 'modules': {
          const incoming = data;
          const filtered = prev.modules.filter((ex) => !incoming.some((inc) => inc.id === ex.id));
          return { ...prev, modules: [...filtered, ...incoming], importLogs: updatedLogs };
        }
        case 'grades': {
          const incoming = data as Grade[];
          const filtered = prev.grades.filter((ex) => !incoming.some((inc) => inc.studentId === ex.studentId && inc.evaluationId === ex.evaluationId));
          return { ...prev, grades: [...filtered, ...incoming], importLogs: updatedLogs };
        }
        case 'absences': {
          const incoming = data as Absence[];
          const filtered = prev.absences.filter((ex) => !incoming.some((inc) => inc.studentId === ex.studentId && inc.date === ex.date && inc.moduleId === ex.moduleId));
          return { ...prev, absences: [...filtered, ...incoming], importLogs: updatedLogs };
        }
        case 'tardy': {
          const incoming = data as Tardy[];
          return { ...prev, tardiness: [...prev.tardiness, ...incoming], importLogs: updatedLogs };
        }
        default:
          return { ...prev, importLogs: updatedLogs };
      }
    });
  };

  return (
    <div id="app-viewport" className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* Navigation sidebar */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'students') {
            setSelectedStudentId(null);
          }
        }}
        apiMode={apiMode}
        onResetData={handleResetData}
        alertCount={state.alerts.length}
      />

      {/* Primary Dashboard Content Area */}
      <main id="main-content-scroll" className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        
        {/* Main section wrappers */}
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">

          {apiMode === 'online' && (
            <div className={`rounded-xl border px-4 py-3 text-xs font-sans ${
              apiError
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              {apiSyncing && <span>Synchronisation avec {apiUrl}...</span>}
              {!apiSyncing && apiError && <span>{apiError}</span>}
              {!apiSyncing && !apiError && (
                <span>Connecté à l&apos;API ({apiUrl}) — {state.students.length} étudiant(s), {state.alerts.length} alerte(s).</span>
              )}
            </div>
          )}
          
          {activeTab === 'overview' && (
            <OverviewSection
              students={state.students}
              grades={state.grades}
              absences={state.absences}
              tardiness={state.tardiness}
              alerts={state.alerts}
              onViewStudent={handleViewStudentFile}
            />
          )}

          {activeTab === 'imports' && (
            <ImportsSection
              apiMode={apiMode}
              onImportSuccess={handleImportSuccess}
              onApiImportSuccess={syncFromBackend}
              importHistory={state.importLogs}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsSection
              students={state.students}
              modules={state.modules}
              grades={state.grades}
              absences={state.absences}
              tardiness={state.tardiness}
            />
          )}

          {activeTab === 'students' && (
            <StudentsSection
              students={state.students}
              modules={state.modules}
              grades={state.grades}
              absences={state.absences}
              tardiness={state.tardiness}
              evaluations={state.evaluations}
              selectedStudentId={selectedStudentId}
              onSelectStudent={setSelectedStudentId}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsSection
              students={state.students}
              grades={state.grades}
              absences={state.absences}
              tardiness={state.tardiness}
              activeAlerts={state.alerts}
              onSetAlerts={(al) => setState(prev => ({ ...prev, alerts: al }))}
              onViewStudent={handleViewStudentFile}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsSection
              students={state.students}
              modules={state.modules}
              grades={state.grades}
              absences={state.absences}
              tardiness={state.tardiness}
              alerts={state.alerts}
            />
          )}

          {activeTab === 'api-link' && (
            <ApiConfigTab
              apiMode={apiMode}
              onModeChange={handleModeChange}
              onUrlChange={handleUrlChange}
            />
          )}

        </div>
      </main>

    </div>
  );
}
