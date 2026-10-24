import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, X, AlertCircle, CheckCircle2, Database, Trash2 } from 'lucide-react';
import { Sottoreparto } from '../types/forecasting';
import { parseUploadedExcel } from '../services/forecastingEngine';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (
    data: Record<string, Record<Sottoreparto, number>>,
    filename: string,
    diagnostics?: {
      validRowsExtracted: number;
      totalColliExtracted: number;
      distinctDatesCount: number;
    }
  ) => void;
  onRestoreDefault: () => void;
  savedAt?: string | null;
  activeDatasetName?: string;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onDataLoaded,
  onRestoreDefault,
  savedAt,
  activeDatasetName,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successDetails, setSuccessDetails] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessDetails(null);

    try {
      const result = await parseUploadedExcel(file);
      const diag = result.diagnostics;
      setSuccessDetails(
        `File elaborato: ${diag.validRowsExtracted.toLocaleString('it-IT')} righe valide estratte (${diag.totalColliExtracted.toLocaleString('it-IT')} colli su ${diag.distinctDatesCount} date).`
      );
      setTimeout(() => {
        onDataLoaded(result.matrix, file.name, {
          validRowsExtracted: diag.validRowsExtracted,
          totalColliExtracted: diag.totalColliExtracted,
          distinctDatesCount: diag.distinctDatesCount,
        });
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore nel caricamento del file Excel.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Caricamento Dati Ordini Allestimento
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-600">
            Carica il file Excel o CSV degli ordini per ricalcolare le previsioni di allestimento, il dimensionamento della squadra e la mobilità interna secondo la pipeline del modello.
          </p>

          {/* Active Memory Status Notice */}
          {savedAt && (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3 text-emerald-950 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <Database className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-900 block">
                    File salvato in memoria permanente:
                  </span>
                  <span className="text-[11px] text-emerald-800">
                    &ldquo;{activeDatasetName}&rdquo; &bull; Salvato alle {new Date(savedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} del {new Date(savedAt).toLocaleDateString('it-IT')}.
                  </span>
                  <p className="text-[10px] text-emerald-700 mt-0.5">
                    Quando esci o ricarichi la pagina, i dati rimangono conservati automaticamente nel browser.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onRestoreDefault();
                }}
                className="text-[11px] font-semibold text-emerald-800 hover:text-red-700 underline shrink-0 inline-flex items-center gap-1"
                title="Elimina il file salvato e ripristina il dataset di base"
              >
                <Trash2 className="w-3 h-3" />
                Cancella
              </button>
            </div>
          )}

          {/* Expected structure explanation */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-slate-700">
            <span className="font-semibold text-slate-900 block text-[11px] uppercase tracking-wider">
              Struttura Riconosciuta dal Modello:
            </span>
            <ul className="space-y-1 text-[11px]">
              <li>· <strong>Colonna B (idx 1):</strong> Data Allestimento (es. <em>Lunedì 15 Gennaio 2024</em>)</li>
              <li>· <strong>Colonna K (idx 10):</strong> Colli Ordinati K</li>
              <li>· <strong>Colonna L (idx 11):</strong> Colli Allestimento Effettivi L (target principale)</li>
              <li>· <strong>Sottoreparti:</strong> ALIMENTARI, CHIMICA, LIQUIDI, PETFOOD, PROFUMERIA</li>
            </ul>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging
                ? 'border-slate-900 bg-slate-50'
                : 'border-slate-300 hover:border-slate-400 bg-white'
            }`}
          >
            <input
              type="file"
              id="file-excel-upload"
              accept=".xlsx,.xls,.csv"
              onChange={onFileInputChange}
              className="hidden"
            />
            <label
              htmlFor="file-excel-upload"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <UploadCloud className="w-8 h-8 text-slate-400" />
              <div>
                <span className="font-semibold text-slate-900">Fai clic per selezionare il file</span>
                <span className="text-slate-500"> oppure trascinalo qui</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Formati supportati: .xlsx, .xls, .csv
              </span>
            </label>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-2 text-slate-600 font-medium">
              <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
              Elaborazione file e calcolo delle matrici previsionali...
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="whitespace-pre-line leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {successDetails && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successDetails}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <button
            onClick={() => {
              onRestoreDefault();
              onClose();
            }}
            className="text-xs text-slate-600 hover:text-slate-900 underline font-medium"
          >
            Ripristina Dati Benchmark Python
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
