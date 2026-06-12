import { useState, useCallback, useEffect } from 'react';
import { getBaseUrl, setBaseUrl, getToken } from './services/apiClient';
import { pingApi } from './services/academicApi';
import { useAlerts } from './hooks/useAcademicData';
import { Navigation, TabId } from './components/Navigation';
import { LoadingSpinner } from './components/LoadingSpinner';
import { OverviewPage } from './pages/OverviewPage';
import { ImportsPage } from './pages/ImportsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { StudentsPage } from './pages/StudentsPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ApiConfigPage } from './pages/ApiConfigPage';
import { LoginPage } from './pages/LoginPage';

type ApiMode = 'online' | 'offline';

/** Root application shell with auth gate, sidebar navigation, and tab routing. */
export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [apiUrl, setApiUrlState] = useState<string>(() => getBaseUrl());
  const [apiMode, setApiMode] = useState<ApiMode>('online');
  const [refreshKey, setRefreshKey] = useState(0);
  const [apiConnected, setApiConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!getToken());

  const { data: alerts, refetch: refetchAlerts } = useAlerts(refreshKey);

  useEffect(() => {
    const syncWithBackend = async () => {
      setIsInitializing(true);
      if (apiMode === 'online') {
        const connected = await pingApi(apiUrl);
        setApiConnected(connected);
      } else {
        setApiConnected(false);
      }
      setIsInitializing(false);
    };

    syncWithBackend();
  }, [refreshKey, apiUrl, apiMode]);

  const handleRefresh = useCallback(async () => {
    setRefreshKey((k) => k + 1);
    refetchAlerts();
  }, [refetchAlerts]);

  const handleUrlChange = (url: string) => {
    setBaseUrl(url);
    setApiUrlState(url);
    handleRefresh();
  };

  const handleViewStudentFile = (studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveTab('students');
  };

  if (isInitializing) {
    return (
      <LoadingSpinner
        fullScreen
        size="lg"
        message="Initialisation de la synchronisation..."
      />
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div id="app-viewport" className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'students') setSelectedStudentId(null);
        }}
        apiConnected={apiConnected}
        onRefreshData={handleRefresh}
        alertCount={alerts.length}
      />

      <main id="main-content-scroll" className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
          {!apiConnected && apiMode === 'online' && activeTab !== 'api-link' && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
              <div className="flex items-center gap-3 text-rose-800">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <p className="text-sm font-semibold">Le serveur backend est actuellement injoignable.</p>
              </div>
              <button
                onClick={() => setActiveTab('api-link')}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 underline"
              >
                Vérifier la configuration
              </button>
            </div>
          )}

          {activeTab === 'overview' && (
            <OverviewPage refreshKey={refreshKey} onViewStudent={handleViewStudentFile} />
          )}

          {activeTab === 'imports' && (
            <ImportsPage refreshKey={refreshKey} onImportSuccess={handleRefresh} />
          )}

          {activeTab === 'analytics' && <AnalyticsPage refreshKey={refreshKey} />}

          {activeTab === 'students' && (
            <StudentsPage
              refreshKey={refreshKey}
              selectedStudentId={selectedStudentId}
              onSelectStudent={setSelectedStudentId}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsPage refreshKey={refreshKey} onViewStudent={handleViewStudentFile} />
          )}

          {activeTab === 'reports' && <ReportsPage refreshKey={refreshKey} />}

          {activeTab === 'api-link' && (
            <ApiConfigPage
              apiUrl={apiUrl}
              onUrlChange={handleUrlChange}
              apiMode={apiMode}
              onModeChange={setApiMode}
            />
          )}
        </div>
      </main>
    </div>
  );
}
