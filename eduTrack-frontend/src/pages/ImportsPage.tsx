import { useState, useRef } from 'react';
import { Upload, History, HelpCircle, FileCheck2, Brush } from 'lucide-react';
import { uploadImportFile } from '../services/academicApi';
import { getBaseUrl } from '../services/apiClient';
import { useImportLogs } from '../hooks/useAcademicData';
import { DataLoader } from '../components/DataLoader';

interface ImportsPageProps {
  refreshKey?: number;
  onImportSuccess?: () => void;
}

const API_IMPORT_TYPE_MAP = {
  students: 'etudiants',
  modules: 'modules',
  tardy: 'retards',
  absences: 'absences',
  evaluations: 'evaluations',
  grades: 'notes',
} as const;

type ImportType = keyof typeof API_IMPORT_TYPE_MAP;

/** File import pipeline with drag-and-drop upload and import history. */
export function ImportsPage({ refreshKey = 0, onImportSuccess }: ImportsPageProps) {
  const { data: importHistory, loading, error, refetch } = useImportLogs(refreshKey);
  const [activeImportType, setActiveImportType] = useState<ImportType>('students');
  const [dragActive, setDragActive] = useState(false);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statResult, setStatResult] = useState<{ count: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToApi = async (file: File) => {
    setIsProcessing(true);
    setPipelineLogs([`[API] Envoi de "${file.name}" vers ${getBaseUrl()}...`]);
    setStatResult(null);

    try {
      const result = await uploadImportFile(API_IMPORT_TYPE_MAP[activeImportType], file);
      setPipelineLogs((prev) => [
        ...prev,
        `[API] ${result.message}`,
        `[Final] ${result.rowCount} ligne(s) importée(s) avec succès.`,
      ]);
      setStatResult({ count: result.rowCount });
      refetch();
      onImportSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'import API.";
      setPipelineLogs((prev) => [...prev, `[Échec-API] ${message}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      uploadToApi(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      uploadToApi(e.target.files[0]);
    }
  };

  return (
    <DataLoader loading={loading} error={error}>
      <div id="imports-section" className="space-y-6 animate-fade-in">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-sans">Pipeline d&apos;Importation</h2>
            <p className="text-slate-500 text-xs mt-1 font-sans">
              Les fichiers sont envoyés au backend et stockés dans votre base de données.
            </p>
          </div>
          <Brush className="w-8 h-8 text-[#5EA8DA]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 font-sans">
                1. Type d&apos;importation
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(['students', 'grades', 'absences', 'tardy', 'modules', 'evaluations'] as const).map((type) => {
                  const labels: Record<ImportType, string> = {
                    students: 'Étudiants',
                    grades: 'Notes',
                    absences: 'Absences',
                    tardy: 'Retards',
                    modules: 'Modules',
                    evaluations: 'Évaluations',
                  };
                  const isSel = activeImportType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        setActiveImportType(type);
                        setStatResult(null);
                        setPipelineLogs([]);
                      }}
                      className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer font-sans text-xs font-bold leading-tight ${
                        isSel
                          ? 'bg-[#B9DDF5] border-[#83C5F1] text-slate-900 shadow-xs scale-102'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      {labels[type]}
                    </button>
                  );
                })}
              </div>

              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mt-6 mb-4 font-sans">
                2. Déposer le fichier
              </h3>

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 hover:bg-slate-50/50 cursor-pointer text-center transition-colors group ${
                  dragActive ? 'border-[#5EA8DA] bg-sky-50/30' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Upload className="w-8 h-8 mx-auto text-slate-400 group-hover:scale-110 transition-transform duration-200" />
                <p className="text-xs font-semibold text-slate-700 mt-3 font-sans">
                  {isProcessing ? 'Import en cours...' : 'Glissez-déposez un fichier .csv ou .xlsx ici'}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-400 font-sans">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Formats attendus par le backend (nom, prenom, email pour les étudiants, etc.).</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-[11px] uppercase font-mono tracking-wider text-[#83C5F1]">Console API</span>
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="min-h-36 max-h-52 overflow-y-auto font-mono text-[10.5px] space-y-1.5 text-slate-300 pr-1">
                {pipelineLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={
                      log.includes('[Échec-API]')
                        ? 'text-rose-400 font-bold'
                        : log.includes('[Final]')
                          ? 'text-emerald-400 font-bold'
                          : 'text-sky-400'
                    }
                  >
                    {log}
                  </div>
                ))}
                {pipelineLogs.length === 0 && (
                  <div className="italic text-slate-500">En attente de fichier...</div>
                )}
              </div>

              {statResult && (
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 font-sans text-xs text-slate-200">
                  Lignes importées:{' '}
                  <span className="font-mono text-emerald-400 font-bold">{statResult.count}</span>
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <History className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
                  Historique (base de données)
                </h3>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {importHistory.length === 0 && (
                  <p className="text-[11px] text-slate-400 font-sans">Aucun import enregistré.</p>
                )}
                {importHistory.map((item) => (
                  <div key={item.id} className="text-xs border-b border-slate-50 pb-2">
                    <div className="flex justify-between">
                      <span className="font-bold truncate max-w-[140px]" title={item.fileName}>
                        {item.fileName}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono leading-none ${
                          item.status === 'Succès'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>{item.timestamp}</span>
                      <span>{item.rowCount} lignes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DataLoader>
  );
}
