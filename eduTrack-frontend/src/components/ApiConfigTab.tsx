/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ApiService } from '../utils/apiService';
import { 
  Settings, 
  Wifi, 
  WifiOff, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Save,
  Link
} from 'lucide-react';

interface ApiConfigTabProps {
  apiMode: 'offline' | 'online';
  onModeChange: (mode: 'offline' | 'online') => void;
  onUrlChange: (url: string) => void;
}

export const ApiConfigTab: React.FC<ApiConfigTabProps> = ({
  apiMode,
  onModeChange,
  onUrlChange
}) => {
  const [baseUrlInput, setBaseUrlInput] = useState<string>('');
  const [pingStatus, setPingStatus] = useState<'unchecked' | 'testing' | 'success' | 'failed'>('unchecked');
  const [saveToast, setSaveToast] = useState<boolean>(false);

  useEffect(() => {
    setBaseUrlInput(ApiService.getBaseUrl());
  }, []);

  const handlePing = async () => {
    setPingStatus('testing');
    const reachable = await ApiService.pingApi(baseUrlInput);
    if (reachable) {
      setPingStatus('success');
    } else {
      setPingStatus('failed');
    }
  };

  const handleSave = () => {
    ApiService.setBaseUrl(baseUrlInput);
    ApiService.setMode(apiMode);
    onUrlChange(baseUrlInput);
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
    }, 2500);
  };

  return (
    <div id="api-config-tab animate-fade-in" className="space-y-6">
      
      {/* Configuration Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-sans">
            Configuration de la Base l&apos;API (EduTrack API)
          </h2>
          <p className="text-slate-500 text-xs mt-1 font-sans">
            Ajustez l&apos;adresse de votre serveur académique distant pour synchroniser vos tables d&apos;évaluation.
          </p>
        </div>
        <Link className="w-8 h-8 text-[#5EA8DA]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Connection panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
            
            {/* Mode selection grid */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block font-sans">
                Sélection du Mode d&apos;Exécution
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Offline Selector */}
                <button
                  onClick={() => onModeChange('offline')}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-36 ${
                    apiMode === 'offline'
                      ? 'bg-[#B9DDF5]/40 border-[#83C5F1] shadow-md'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <WifiOff className={`w-8 h-8 ${apiMode === 'offline' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="text-xs font-bold font-sans text-slate-900 block">
                      Mode Simulateur Client
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans mt-0.5 block leading-normal">
                      Exécute l&apos;analyse de données scolaires et le clustering K-Means localement. Idéal pour évaluer l&apos;interface sans paramétrage serveur !
                    </span>
                  </div>
                </button>

                {/* Online Selector */}
                <button
                  onClick={() => onModeChange('online')}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-36 ${
                    apiMode === 'online'
                      ? 'bg-[#AFE3F4]/30 border-[#5EA8DA] shadow-md'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <Wifi className={`w-8 h-8 ${apiMode === 'online' ? 'text-teal-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="text-xs font-bold font-sans text-slate-900 block">
                      Connexion API EduTrack Distante
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans mt-0.5 block leading-normal">
                      Interroge l&apos;infrastructure de production. Envoie des requêtes réelles aux endpoints pour récupérer les vues globales, alertes et dossiers individuels.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Base URL parameters input */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-550 block font-sans">
                Adresse URL du Serveur Académique (Base URL)
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
                  className="flex-1 bg-slate-50 border border-slate-250 py-3 px-4 text-xs font-mono text-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#5EA8DA] tracking-tight"
                />

                <button
                  onClick={handlePing}
                  disabled={pingStatus === 'testing' || !baseUrlInput}
                  className="bg-slate-100 border border-slate-200 text-slate-700 font-sans text-xs font-bold py-3 px-5 rounded-xl hover:bg-slate-100/85 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {pingStatus === 'testing' ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                      <span>Ping en cours...</span>
                    </>
                  ) : (
                    <span>Tester la connexion</span>
                  )}
                </button>
              </div>

              {/* Status Display badge */}
              {pingStatus === 'success' && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-150 flex items-center gap-2.5 text-xs text-emerald-800 font-sans">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Serveur connecté avec succès ! Les requêtes s&apos;exécuteront proprement sur cette URL.</span>
                </div>
              )}

              {pingStatus === 'failed' && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-150 flex items-center gap-2.5 text-xs text-rose-800 font-sans">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Connexion impossible. Veuillez vérifier que votre serveur EduTrack API est lancé et qu&apos;aucun proxy CORS ne bloque l&apos;iframe.</span>
                </div>
              )}
            </div>

            {/* Actions button group */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                id="btn-save-api-config"
                onClick={handleSave}
                className="bg-slate-900 border border-slate-800 text-white font-sans text-xs font-bold py-3 px-6 rounded-xl hover:bg-slate-850 cursor-pointer flex items-center gap-2 shadow-xs transition-transform"
              >
                <Save className="w-3.5 h-3.5 text-[#AFE3F4]" />
                <span>Sauvegarder les configurations</span>
              </button>
            </div>

          </div>
        </div>

        {/* Right Help Box */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest font-sans flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#83C5F1]" />
              <span>Endpoints Supportés</span>
            </h3>

            <p className="text-[11px] text-slate-500 leading-normal font-sans">
              Lorsque le mode distant est activé, notre tableau de bord interroge les URLs de production pour alimenter ses pipelines statistiques :
            </p>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[9px] text-slate-600 space-y-1.5">
              <div><strong className="text-[#5EA8DA]">POST</strong> /imports/etudiants</div>
              <div><strong className="text-[#5EA8DA]">POST</strong> /imports/notes</div>
              <div><strong className="text-[#5EA8DA]">GET</strong> /dashboard/overview</div>
              <div><strong className="text-[#5EA8DA]">GET</strong> /alerts</div>
              <div><strong className="text-[#5EA8DA]">GET</strong> /students</div>
            </div>
          </div>
        </div>

      </div>

      {saveToast && (
        <div className="fixed bottom-6 right-6 bg-slate-950 text-white text-xs font-sans px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 border border-slate-800 animate-slide-up z-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Paramètres d&apos;API mis à jour avec succès !</span>
        </div>
      )}

    </div>
  );
};
