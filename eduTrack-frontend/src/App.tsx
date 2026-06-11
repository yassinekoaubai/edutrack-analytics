/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { getBaseUrl, setBaseUrl, getToken, logout } from './api/client';
import { pingApi } from './api/academicApi';
import { useAlerts } from './hooks/useAcademicData';
import { Navigation, TabId } from './components/Navigation';
import { OverviewSection } from './components/OverviewSection';
import { ImportsSection } from './components/ImportsSection';
import { AnalyticsSection } from './components/AnalyticsSection';
import { StudentsSection } from './components/StudentsSection';
import { AlertsSection } from './components/AlertsSection';
import { ReportsSection } from './components/ReportsSection';
import { ApiConfigTab } from './components/ApiConfigTab';
import { LoginSection } from './components/LoginSection';

type ApiMode = 'online' | 'offline';

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

  // Connection safety: Sync with backend on boot and whenever settings change
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
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#5EA8DA] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Initialisation de la synchronisation...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginSection onLoginSuccess={() => setIsAuthenticated(true)} />;
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
            <OverviewSection refreshKey={refreshKey} onViewStudent={handleViewStudentFile} />
          )}

          {activeTab === 'imports' && (
            <ImportsSection refreshKey={refreshKey} onImportSuccess={handleRefresh} />
          )}

          {activeTab === 'analytics' && <AnalyticsSection refreshKey={refreshKey} />}

          {activeTab === 'students' && (
            <StudentsSection
              refreshKey={refreshKey}
              selectedStudentId={selectedStudentId}
              onSelectStudent={setSelectedStudentId}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsSection refreshKey={refreshKey} onViewStudent={handleViewStudentFile} />
          )}

          {activeTab === 'reports' && <ReportsSection refreshKey={refreshKey} />}

          {activeTab === 'api-link' && (
            <ApiConfigTab 
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
