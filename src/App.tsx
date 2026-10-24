import { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { SquadraMobilitaView } from './components/SquadraMobilitaView';
import { ColliPrevisioneView } from './components/ColliPrevisioneView';
import { BilancioOreView } from './components/BilancioOreView';
import { OrizzontiTemporaliView } from './components/OrizzontiTemporaliView';
import { RischioTagliView } from './components/RischioTagliView';
import { SimulatoreWhatIfView } from './components/SimulatoreWhatIfView';
import { FileUploadModal } from './components/FileUploadModal';
import {
  DEFAULT_COLLI_EFFETTIVI,
  DEFAULT_PARAMS,
  calculateForecast,
  exportExcelReport,
} from './services/forecastingEngine';
import { SimulationParams, Sottoreparto } from './types/forecasting';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('squadra');
  const [colliData, setColliData] = useState<Record<string, Record<Sottoreparto, number>>>(DEFAULT_COLLI_EFFETTIVI);
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [activeDatasetName, setActiveDatasetName] = useState<string>('Benchmark Calibrato Modello Python');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Baseline forecast with default benchmark values
  const baselineForecast = useMemo(() => {
    return calculateForecast(DEFAULT_COLLI_EFFETTIVI, DEFAULT_PARAMS);
  }, []);

  // Current forecast with active matrix and parameters
  const currentForecast = useMemo(() => {
    return calculateForecast(colliData, params);
  }, [colliData, params]);

  const handleExportExcel = () => {
    try {
      exportExcelReport(currentForecast, 'Report_Previsionale_Colli_e_Addetti_Unificato.xlsx');
      showToast('Report Excel ufficiale (4 fogli) generato e scaricato!');
    } catch {
      showToast('Errore durante la generazione del file Excel.');
    }
  };

  const handleDataLoaded = (
    newMatrix: Record<string, Record<Sottoreparto, number>>,
    filename: string
  ) => {
    setColliData(newMatrix);
    setActiveDatasetName(filename);
    showToast(`Dati caricati da "${filename}". Previsioni ricalcolate.`);
  };

  const handleRestoreDefault = () => {
    setColliData(DEFAULT_COLLI_EFFETTIVI);
    setParams(DEFAULT_PARAMS);
    setActiveDatasetName('Benchmark Calibrato Modello Python');
    showToast('Ripristinato il dataset benchmark originale dal codice Python.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-slate-900 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-xl border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Contract (3 zones) */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onExportExcel={handleExportExcel}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onToggleWhatIf={() => setIsWhatIfOpen(!isWhatIfOpen)}
        isWhatIfActive={isWhatIfOpen}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6 flex-1">
        {/* Context Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200/80 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700">Dataset attivo:</span>
            <span className="text-slate-900 font-medium">{activeDatasetName}</span>
            <span aria-hidden="true">·</span>
            <span>Turno standard: {params.oreTurno.toFixed(1)}h</span>
            <span aria-hidden="true">·</span>
            <span>Soglia reparto: {params.sogliaArrotondamento.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="hover:text-slate-900 underline transition-colors"
            >
              Cambia file Excel
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={handleExportExcel}
              className="hover:text-slate-900 underline transition-colors font-medium text-slate-700"
            >
              Scarica Report .XLSX
            </button>
          </div>
        </div>

        {/* Top KPI Metric Cards */}
        <MetricCards
          weeklyTotals={currentForecast.weeklyTotals}
          daySummaries={currentForecast.daySummaries}
        />

        {/* Collapsible What-If Simulator Panel */}
        {isWhatIfOpen && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-150">
            <SimulatoreWhatIfView
              params={params}
              onChangeParams={setParams}
              onReset={() => setParams(DEFAULT_PARAMS)}
              baselineTotals={baselineForecast.weeklyTotals}
              currentTotals={currentForecast.weeklyTotals}
            />
          </div>
        )}

        {/* Active Tab View */}
        <div>
          {activeTab === 'squadra' && (
            <SquadraMobilitaView
              daySummaries={currentForecast.daySummaries}
              weeklyTotals={currentForecast.weeklyTotals}
            />
          )}

          {activeTab === 'colli' && (
            <ColliPrevisioneView daySummaries={currentForecast.daySummaries} />
          )}

          {activeTab === 'bilancio' && (
            <BilancioOreView detailedPredictions={currentForecast.detailedPredictions} />
          )}

          {activeTab === 'orizzonti' && (
            <OrizzontiTemporaliView
              orizzonti={currentForecast.orizzonti}
              weeklyTotals={currentForecast.weeklyTotals}
            />
          )}

          {activeTab === 'tagli' && <RischioTagliView />}
        </div>
      </main>

      {/* Upload Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDataLoaded={handleDataLoaded}
        onRestoreDefault={handleRestoreDefault}
      />

      {/* Clean Footer with quiet links and no fake telemetry */}
      <footer className="border-t border-slate-200 bg-white mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div>
            <span>Sistema Previsionale Unificato Allestimento GDO</span>
            <span className="mx-2">·</span>
            <span>Basato su HistGradientBoosting (Colonna L & Classificatore Tagli)</span>
          </div>
          <div>
            <span>Squadra: 12 (Lun-Gio) / 11 (Ven-Sab) · Turno 3,0 ore</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
