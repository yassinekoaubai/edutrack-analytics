/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Clipboard, 
  Play, 
  HelpCircle,
  FileCheck2,
  Brush
} from 'lucide-react';
import { ImportLog } from '../types';
import { ApiService } from '../utils/apiService';

interface ImportsSectionProps {
  apiMode: 'offline' | 'online';
  onImportSuccess: (
    type: 'students' | 'modules' | 'tardy' | 'absences' | 'evaluations' | 'grades', 
    data: any[], 
    fileName: string
  ) => void;
  onApiImportSuccess?: () => Promise<void>;
  importHistory: ImportLog[];
}

const API_IMPORT_TYPE_MAP = {
  students: 'etudiants',
  modules: 'modules',
  tardy: 'retards',
  absences: 'absences',
  evaluations: 'evaluations',
  grades: 'notes',
} as const;

// Pre-configured CSV string templates for easy, instant testing
const MOCK_TEMPLATES = {
  students: `id,firstName,lastName,className,email
STD-301,Karim,Fenniri,M1-DATA,k.fenniri@ynov.ma
STD-302,Houda,Benjelloun,M1-DATA,h.benjelloun@ynov.ma
STD-302,Houda,Benjelloun,M1-DATA,h.benjelloun@ynov.ma  # DUPLICATE (Autocleaned)
STD-303,Nabil,Ouazzani,M1-DATA,n.ouazzani@ynov.ma
STD-304,Sofia,Chérif,M2-BI,s.cherif@ynov.ma
STD-305,Yassine,,M2-BI,y.sahli@ynov.ma                   # MISSING VALUE (Autocleaned)`,

  grades: `studentId,moduleId,evaluationId,score,coefficient,date
STD-101,MOD-DS,EVAL-DS-EX,18.5,0.6,2026-06-01
STD-102,MOD-DS,EVAL-DS-EX,19.0,0.6,2026-06-01
STD-105,MOD-PY,EVAL-PY-EX,92.0,0.6,2026-06-02          # INVALID SCORE (Corrected to 20 or flagged)
STD-106,MOD-PY,EVAL-PY-EX,,0.6,2025-06-02              # EMPTY SCORE (Imputed with module mean)`,

  absences: `studentId,moduleId,date,hours,justified,notes
STD-101,MOD-DS,2026-05-15,2,false,Retard bus
STD-106,MOD-ML,2026-05-16,4,true,Certificat médical
STD-109,MOD-SQL,2026-05-17,2,false,Non documentée`
};

export const ImportsSection: React.FC<ImportsSectionProps> = ({
  apiMode,
  onImportSuccess,
  onApiImportSuccess,
  importHistory
}) => {
  const [activeImportType, setActiveImportType] = useState<'students' | 'modules' | 'tardy' | 'absences' | 'evaluations' | 'grades'>('students');
  const [csvInput, setCsvInput] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statResult, setStatResult] = useState<{ count: number; duplicatesCleared: number; warnings: string[] } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger loading template into playground
  const loadTemplate = (type: 'students' | 'grades' | 'absences') => {
    setActiveImportType(type);
    setCsvInput(MOCK_TEMPLATES[type]);
    setPipelineLogs([`[Système] Gabarit de données chargé pour "${type}".`]);
    setStatResult(null);
  };

  // Automated parsing, validation, cleaning, and storage mapping pipeline
  const executePipeline = (rawText: string, fileName: string = 'import_manuel.csv') => {
    if (!rawText.trim()) {
      setPipelineLogs([`[Erreur] Veuillez copier des données CSV valides dans le champ de saisie.`]);
      return;
    }

    setIsProcessing(true);
    const logs: string[] = [`[Lecture] Début du pipeline d'importation. Analyse de "${fileName}"`];
    
    setTimeout(() => {
      try {
        const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length < 2) {
          throw new Error("Contenu CSV insuffisant. En-tête + au moins une ligne requis.");
        }

        // 1. Process headers
        const rawHeaders = lines[0].split(',').map(h => h.trim().toLowerCase());
        logs.push(`[Analyse-Entêtes] Colonnes détectées: [${rawHeaders.join(', ')}]`);

        // Validate mandatory columns depending on type
        let requiredColsByImport: string[] = [];
        if (activeImportType === 'students') requiredColsByImport = ['id', 'firstname', 'lastname', 'classname'];
        else if (activeImportType === 'grades') requiredColsByImport = ['studentid', 'moduleid', 'score'];
        else if (activeImportType === 'absences') requiredColsByImport = ['studentid', 'moduleid', 'hours'];
        
        const missing = requiredColsByImport.filter(col => !rawHeaders.includes(col));
        if (missing.length > 0) {
          throw new Error(`Colonnes obligatoires manquantes pour cet import : ${missing.join(', ')}`);
        }

        const validObjects: any[] = [];
        let duplicatesCleared = 0;
        const seenIds = new Set<string>();
        const warnings: string[] = [];

        // 2. Data Cleaning Loop
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          // Skip comment lines in template
          if (line.startsWith('#') || line.includes('//')) {
            continue;
          }

          const cells = line.split('#')[0].split(',').map(c => c.trim()); // clear commented parts
          if (cells.length < rawHeaders.length) {
            warnings.push(`Ligne ${i + 1} rejetée : Nombre de cellules inférieur aux colonnes déclarées.`);
            continue;
          }

          // Build row item mapping rawHeaders to lower values
          const rowObj: any = {};
          rawHeaders.forEach((header, cellIndex) => {
            rowObj[header] = cells[cellIndex] || '';
          });

          // Unique key verification depending on row context
          const uniqueKey = activeImportType === 'students' 
            ? rowObj.id 
            : `${rowObj.studentid}-${rowObj.moduleid}-${rowObj.evaluationid || i}`;

          // A. Duplicate purging
          if (seenIds.has(uniqueKey)) {
            duplicatesCleared++;
            continue;
          }
          seenIds.add(uniqueKey);

          // B. Input normalizations / Standardizations
          if (activeImportType === 'students') {
            // Cap lastname to UPPER and capitalize first name
            if (rowObj.lastname) rowObj.lastname = rowObj.lastname.toUpperCase();
            if (rowObj.firstname) {
              rowObj.firstname = rowObj.firstname.charAt(0).toUpperCase() + rowObj.firstname.slice(1).toLowerCase();
            }
            if (!rowObj.lastname) {
              rowObj.lastname = 'YNOVIEN'; // Fallback imputation
              warnings.push(`Champs 'nom' vide détecté à la ligne ${i + 1}, remplacé par 'YNOVIEN'`);
            }
            // Clean statuses
            rowObj.id = rowObj.id.toUpperCase();
            rowObj.className = rowObj.classname.toUpperCase();
            rowObj.firstName = rowObj.firstname;
            rowObj.lastName = rowObj.lastname;
            rowObj.email = rowObj.email || `${rowObj.firstname.toLowerCase()}.${rowObj.lastname.toLowerCase()}@ynov.ma`;
            rowObj.createdAt = new Date().toISOString().split('T')[0];
            rowObj.status = 'Régulier'; // Default
          }

          if (activeImportType === 'grades') {
            // Score validation
            let scoreVal = parseFloat(rowObj.score);
            if (isNaN(scoreVal)) {
              scoreVal = 10.0; // Mean imputation
              warnings.push(`Note invalide / vide détectée à la ligne ${i + 1}, valeur imputée à 10.0`);
            } else if (scoreVal > 20) {
              scoreVal = 20.0;
              warnings.push(`Note supérieure à 20 (${scoreVal}) rabattue à 20.0 (Ligne ${i + 1})`);
            } else if (scoreVal < 0) {
              scoreVal = 0.0;
              warnings.push(`Note négative (${scoreVal}) ramenée à 0.0 (Ligne ${i + 1})`);
            }
            rowObj.studentId = rowObj.studentid.toUpperCase();
            rowObj.moduleId = rowObj.moduleid.toUpperCase();
            rowObj.evaluationId = rowObj.evaluationid || `EVAL-AUTO-${i}`;
            rowObj.score = scoreVal;
            rowObj.coefficient = parseFloat(rowObj.coefficient) || 0.5;
            rowObj.date = rowObj.date || new Date().toISOString().split('T')[0];
          }

          if (activeImportType === 'absences') {
            rowObj.studentId = rowObj.studentid.toUpperCase();
            rowObj.moduleId = rowObj.moduleid.toUpperCase();
            rowObj.hours = parseFloat(rowObj.hours) || 2;
            rowObj.justified = rowObj.justified === 'true' || rowObj.justified === '1';
            rowObj.date = rowObj.date || new Date().toISOString().split('T')[0];
            rowObj.notes = rowObj.notes || 'Import manuel';
          }

          validObjects.push(rowObj);
        }

        logs.push(`[Nettoyage] Suppression de ${duplicatesCleared} ligne(s) en doublon.`);
        logs.push(`[Validation] ${validObjects.length} enregistrements jugés conformes.`);
        if (warnings.length > 0) {
          logs.push(`[Traitement-Anomalies] ${warnings.length} corrections appliquées.`);
        }

        setPipelineLogs(prev => [...prev, ...logs, `[Final] Importation finalisée avec succès.`]);
        setStatResult({
          count: validObjects.length,
          duplicatesCleared,
          warnings
        });

        // Trigger parent state modification callback
        onImportSuccess(activeImportType, validObjects, fileName);

      } catch (err: any) {
        setPipelineLogs(prev => [...prev, `[Échec-Pipeline] ${err.message || "Erreur de format de pipeline."}`]);
      } finally {
        setIsProcessing(false);
      }
    }, 1000); // 1-second simulation animation
  };

  // Drag-and-drop mechanics
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (apiMode === 'online') {
      setIsProcessing(true);
      setPipelineLogs([`[API] Envoi de "${file.name}" vers ${ApiService.getBaseUrl()}...`]);
      try {
        const result = await ApiService.uploadImportFile(
          API_IMPORT_TYPE_MAP[activeImportType],
          file
        );
        setPipelineLogs((prev) => [
          ...prev,
          `[API] ${result.message}`,
          `[Final] ${result.rowCount} ligne(s) importée(s) avec succès.`,
        ]);
        setStatResult({
          count: result.rowCount,
          duplicatesCleared: 0,
          warnings: [],
        });
        onImportSuccess(activeImportType, [], file.name);
        if (onApiImportSuccess) {
          await onApiImportSuccess();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur lors de l\'import API.';
        setPipelineLogs((prev) => [...prev, `[Échec-API] ${message}`]);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      executePipeline(text, file.name);
    };
    reader.readAsText(file);
  };

  return (
    <div id="imports-section" className="space-y-6 animate-fade-in">
      
      {/* Intro header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-sans">
            Pipeline d&apos;Importation & Validation des Données
          </h2>
          <p className="text-slate-500 text-xs mt-1 font-sans">
            Chargez vos fichiers académiques (.csv, .xlsx) et laissez le pipeline nettoyer automatiquement vos anomalies.
          </p>
        </div>
        <Brush className="w-8 h-8 text-[#5EA8DA]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Import configuration & Drag area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 font-sans">
              1. Type d&apos;Importation
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(['students', 'grades', 'absences', 'tardy', 'modules', 'evaluations'] as const).map((type) => {
                const isSel = activeImportType === type;
                let word = 'Étudiants';
                if (type === 'grades') word = 'Notes/Évals';
                if (type === 'absences') word = 'Absences';
                if (type === 'tardy') word = 'Retards';
                if (type === 'modules') word = 'Modules';
                if (type === 'evaluations') word = 'Évaluations';

                return (
                  <button
                    key={type}
                    onClick={() => {
                      setActiveImportType(type);
                      setStatResult(null);
                    }}
                    className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer font-sans text-xs font-bold leading-tight ${
                      isSel 
                        ? 'bg-[#B9DDF5] border-[#83C5F1] text-slate-900 shadow-xs scale-102'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    {word}
                  </button>
                );
              })}
            </div>

            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mt-6 mb-4 font-sans">
              2. Déposer le fichier CSV
            </h3>

            {/* Drag Zone */}
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
                accept=".csv,.txt,.xlsx"
                className="hidden" 
                onChange={handleFileChange}
              />
              <Upload className="w-8 h-8 mx-auto text-slate-400 group-hover:scale-110 transition-transform duration-200" />
              <p className="text-xs font-semibold text-slate-700 mt-3 font-sans">
                Glissez-déposez un fichier `.csv` ici ou cliquez pour parcourir.
              </p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-sans">
                La détection d&apos;en-tête, le renommage et le typage automatique se lancent instantanément.
              </p>
            </div>

            <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-400 font-sans">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Pour un test immédiat sans fichier local, cliquez sur l&apos;un des gabarits rapides sur la colonne de droite !</span>
            </div>
          </div>

          {/* Playground csv console input */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider font-sans">
                Console de données brute & Traitements
              </h3>
              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                Éditeur CSV interactif
              </span>
            </div>

            <textarea
              id="csv-textarea"
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder="Copiez vos cellules CSV brutes ici, puis cliquez sur 'Lancer le pipeline'..."
              className="w-full h-44 bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#83C5F1] tracking-normal"
            />

            <div className="mt-4 flex justify-end">
              <button
                id="btn-run-pipeline"
                disabled={isProcessing}
                onClick={() => executePipeline(csvInput, `web_playground_${activeImportType}.csv`)}
                className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-white font-sans text-xs font-bold py-2.5 px-5 rounded-xl hover:bg-slate-800 transition-transform cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-[#AFE3F4] border-t-transparent rounded-full animate-spin" />
                    <span>Calculs & Nettoyages...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-[#AFE3F4]" />
                    <span>Lancer le pipeline d&apos;Import</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Templates / Logs / History */}
        <div className="space-y-6">
          
          {/* Templates Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3.5 font-sans">
              Gabarits de test rapides
            </h3>
            <p className="text-[11.5px] text-slate-500 mb-4 leading-normal font-sans">
              Injectez instantanément des jeux de données avec des anomalies intégrées (doublons, valeurs absurdes, cellules manquantes) pour voir notre pipeline à l&apos;œuvre :
            </p>

            <div className="space-y-2">
              <button
                onClick={() => loadTemplate('students')}
                className="w-full flex justify-between items-center px-3.5 py-2.5 bg-[#AFE3F4]/10 border border-[#AFE3F4]/30 hover:bg-[#AFE3F4]/20 rounded-xl text-[11.5px] font-sans font-semibold text-slate-800 transition-colors text-left"
              >
                <span>Fichier Étudiants (contenant doublons)</span>
                <Clipboard className="w-3.5 h-3.5 text-slate-500" />
              </button>
              <button
                onClick={() => loadTemplate('grades')}
                className="w-full flex justify-between items-center px-3.5 py-2.5 bg-[#F4DBE3]/10 border border-[#F4DBE3]/30 hover:bg-[#F4DBE3]/20 rounded-xl text-[11.5px] font-sans font-semibold text-slate-800 transition-colors text-left"
              >
                <span>Fichier Notes (évaluations absurdes/vides)</span>
                <Clipboard className="w-3.5 h-3.5 text-slate-500" />
              </button>
              <button
                onClick={() => loadTemplate('absences')}
                className="w-full flex justify-between items-center px-3.5 py-2.5 bg-[#B9DDF5]/10 border border-[#B9DDF5]/30 hover:bg-[#B9DDF5]/20 rounded-xl text-[11.5px] font-sans font-semibold text-slate-800 transition-colors text-left"
              >
                <span>Fichier Absences scolaires</span>
                <Clipboard className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Pipeline outputs console */}
          <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-[11px] uppercase font-mono tracking-wider text-[#83C5F1]">Console Pipeline</span>
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="min-h-36 max-h-52 overflow-y-auto font-mono text-[10.5px] space-y-1.5 scrollbar-thin text-slate-300 pr-1">
              {pipelineLogs.map((log, idx) => {
                let col = 'text-sky-400';
                if (log.includes('[Erreur]') || log.includes('[Échec]')) col = 'text-rose-400 font-bold';
                if (log.includes('[Final]') || log.includes('[Nettoyage]')) col = 'text-emerald-400 font-bold';
                
                return (
                  <div key={idx} className={col}>
                    {log}
                  </div>
                );
              })}
              {pipelineLogs.length === 0 && (
                <div className="italic text-slate-500">Aucun traitement lancé. En attente de fichier...</div>
              )}
            </div>

            {statResult && (
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 font-sans text-xs space-y-1 text-slate-200">
                <div className="flex justify-between">
                  <span>Enregistrements importés:</span>
                  <span className="font-mono text-emerald-400 font-bold">{statResult.count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Doublons résolus:</span>
                  <span className="font-mono text-indigo-400 font-bold">{statResult.duplicatesCleared}</span>
                </div>
                {statResult.warnings.length > 0 && (
                  <div className="text-amber-400 font-semibold text-[10px] pt-1">
                    ⚠️ {statResult.warnings.length} imputations ou recadrages effectués.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Integration import list history */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <History className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
                Historique des Imports
              </h3>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {importHistory.map((item) => (
                <div key={item.id} className="text-xs border-b border-slate-50 pb-2">
                  <div className="flex justify-between">
                    <span className="font-bold truncate max-w-[140px]" title={item.fileName}>
                      {item.fileName}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono leading-none ${
                      item.status === 'Succès' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
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
  );
};
