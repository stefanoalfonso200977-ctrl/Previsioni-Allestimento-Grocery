import React from 'react';
import { Download, UploadCloud, Sliders } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onExportExcel: () => void;
  onOpenUpload: () => void;
  onToggleWhatIf: () => void;
  isWhatIfActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onExportExcel,
  onOpenUpload,
  onToggleWhatIf,
  isWhatIfActive,
}) => {
  const navItems = [
    { id: 'squadra', label: 'Squadra & Mobilità' },
    { id: 'colli', label: 'Previsione Colli L' },
    { id: 'bilancio', label: 'Bilancio Ore' },
    { id: 'orizzonti', label: 'Sintesi Orizzonti' },
    { id: 'tagli', label: 'Rischio Tagli (Stadio 1)' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Logistica GDO · Previsione Allestimento
            </span>
          </div>

          {/* Zone 2: Clean single-line navigation links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions zone */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleWhatIf}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                isWhatIfActive
                  ? 'bg-amber-50 border-amber-300 text-amber-800 font-semibold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Configura rese e simula scenari What-If"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Simulatore What-If</span>
            </button>

            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
              title="Carica file Excel ordini (.xlsx)"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Carica Dati</span>
            </button>

            <button
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shadow-xs"
              title="Esporta il report Excel con i 4 fogli ufficiali"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Esporta Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="lg:hidden border-t border-slate-100 px-4 py-2 flex items-center gap-1 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
