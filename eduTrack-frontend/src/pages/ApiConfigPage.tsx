import { useState, useEffect } from 'react';
import { pingApi } from '../services/academicApi';
import { getBaseUrl, setBaseUrl } from '../services/apiClient';
import { Database, CheckCircle2, AlertCircle, Save, Link } from 'lucide-react';

interface ApiConfigPageProps {
  apiUrl: string;
  onUrlChange: (url: string) => void;
  apiMode: 'online' | 'offline';
  onModeChange: (mode: 'online' | 'offline') => void;
}

/** API connection settings with ping test and online/offline mode toggle. */
export function ApiConfigPage({
  apiUrl,
  onUrlChange,
  apiMode,
  onModeChange,
}: ApiConfigPageProps) {
  const [baseUrlInput, setBaseUrlInput] = useState(apiUrl);
  const [pingStatus, setPingStatus] = useState<'unchecked' | 'testing' | 'success' | 'failed'>('unchecked');
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    setBaseUrlInput(apiUrl);
  }, [apiUrl]);

  const handlePing = async () => {
    setPingStatus('testing');
    const reachable = await pingApi(baseUrlInput);
    setPingStatus(reachable ? 'success' : 'failed');
  };

  const handleSave = () => {
    setBaseUrl(baseUrlInput);
    onUrlChange(baseUrlInput);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div id="api-config-tab" className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-sans">
            Configuration de l&apos;API EduTrack
          </h2>
          <p className="text-slate-500 text-xs mt-1 font-sans">
            Gérez la connexion entre votre interface et le moteur d&apos;analyse backend.
          </p>
        </div>
        <Link className="w-8 h-8 text-[#5EA8DA]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-550 block font-sans">
                Mode de fonctionnement
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => onModeChange('online')}
                  className={`flex-1 py-3 rounded-xl border font-bold text-xs transition-all ${
                    apiMode === 'online'
                      ? 'bg-[#B9DDF5] border-[#83C5F1] text-slate-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Mode Connecté (Backend API)
                </button>
                <button
                  onClick={() => onModeChange('offline')}
                  className={`flex-1 py-3 rounded-xl border font-bold text-xs transition-all ${
                    apiMode === 'offline'
                      ? 'bg-[#F4DBE3] border-[#F4DBE3] text-slate-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Mode Isolé (Local Only)
                </button>
              </div>
            </div>

            {apiMode === 'online' && (
              <div className="space-y-4 animate-fade-in">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-550 block font-sans">
                  Adresse URL du serveur (Base URL)
                </label>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    id="api-url-input"
                    type="url"
                    value={baseUrlInput}
                    onChange={(e) => {
                      setBaseUrlInput(e.target.value);
                      setPingStatus('unchecked');
                    }}
                    placeholder="Ex. http://localhost:8002"
                    className="flex-1 bg-slate-50 border border-slate-250 py-3 px-4 text-xs font-mono text-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#5EA8DA]"
                  />

                  <button
                    onClick={handlePing}
                    disabled={pingStatus === 'testing' || !baseUrlInput}
                    className="bg-slate-100 border border-slate-200 text-slate-700 font-sans text-xs font-bold py-3 px-5 rounded-xl hover:bg-slate-100/85 cursor-pointer disabled:opacity-50"
                  >
                    {pingStatus === 'testing' ? 'Ping en cours...' : 'Tester la connexion'}
                  </button>
                </div>

                {pingStatus === 'success' && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-150 flex items-center gap-2.5 text-xs text-emerald-800 font-sans">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Serveur connecté avec succès. Prêt pour la synchronisation.</span>
                  </div>
                )}

                {pingStatus === 'failed' && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-150 flex items-center gap-2.5 text-xs text-rose-800 font-sans">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Connexion impossible. Vérifiez que le backend est lancé sur ce port.</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                id="btn-save-api-config"
                onClick={handleSave}
                className="bg-slate-900 text-white font-sans text-xs font-bold py-3 px-6 rounded-xl cursor-pointer flex items-center gap-2 hover:bg-slate-800 transition-colors"
              >
                <Save className="w-3.5 h-3.5 text-[#AFE3F4]" />
                <span>Enregistrer la Configuration</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest font-sans flex items-center gap-1.5">
            <Database className="w-4 h-4 text-[#83C5F1]" />
            <span>Endpoints Axios</span>
          </h3>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[9px] text-slate-600 space-y-1.5">
            <div><strong className="text-[#5EA8DA]">GET</strong> /students/</div>
            <div><strong className="text-[#5EA8DA]">GET</strong> /modules</div>
            <div><strong className="text-[#5EA8DA]">GET</strong> /notes</div>
            <div><strong className="text-[#5EA8DA]">GET</strong> /absences</div>
            <div><strong className="text-[#5EA8DA]">GET</strong> /retards</div>
            <div><strong className="text-[#5EA8DA]">GET</strong> /alerts/</div>
            <div><strong className="text-[#5EA8DA]">POST</strong> /imports/etudiants</div>
          </div>
        </div>
      </div>

      {saveToast && (
        <div className="fixed bottom-6 right-6 bg-slate-950 text-white text-xs font-sans px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 border border-slate-800 z-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>URL API mise à jour.</span>
        </div>
      )}
    </div>
  );
}
