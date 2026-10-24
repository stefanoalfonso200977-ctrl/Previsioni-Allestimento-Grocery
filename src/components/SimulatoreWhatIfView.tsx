import React from 'react';
import { SimulationParams, Sottoreparto } from '../types/forecasting';
import { DEPARTMENTS, DEFAULT_PARAMS } from '../services/forecastingEngine';
import { RotateCcw, Check, ArrowRight, Gauge } from 'lucide-react';

interface SimulatoreWhatIfViewProps {
  params: SimulationParams;
  onChangeParams: (params: SimulationParams) => void;
  onReset: () => void;
  baselineTotals: {
    turniTeoriciFTE: number;
    squadraOttimaleReale: number;
    addettiJollyMobilita: number;
    oreNetteScoperte: number;
    totaleColliL: number;
  };
  currentTotals: {
    turniTeoriciFTE: number;
    squadraOttimaleReale: number;
    addettiJollyMobilita: number;
    oreNetteScoperte: number;
    totaleColliL: number;
  };
}

export const SimulatoreWhatIfView: React.FC<SimulatoreWhatIfViewProps> = ({
  params,
  onChangeParams,
  onReset,
  baselineTotals,
  currentTotals,
}) => {
  const handleResaChange = (dept: Sottoreparto, value: number) => {
    onChangeParams({
      ...params,
      reseOrarie: {
        ...params.reseOrarie,
        [dept]: Math.max(10, Math.min(100, value)),
      },
    });
  };

  const isModified =
    params.oreTurno !== DEFAULT_PARAMS.oreTurno ||
    params.sogliaArrotondamento !== DEFAULT_PARAMS.sogliaArrotondamento ||
    params.deltaPercentualeVolumi !== DEFAULT_PARAMS.deltaPercentualeVolumi ||
    params.squadraMaxLunGio !== DEFAULT_PARAMS.squadraMaxLunGio ||
    params.squadraMaxVenSab !== DEFAULT_PARAMS.squadraMaxVenSab ||
    DEPARTMENTS.some((d) => params.reseOrarie[d] !== DEFAULT_PARAMS.reseOrarie[d]);

  const diffFte = (currentTotals.turniTeoriciFTE - baselineTotals.turniTeoriciFTE).toFixed(2);
  const diffReali = currentTotals.squadraOttimaleReale - baselineTotals.squadraOttimaleReale;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">
              Pannello di Simulazione Parametri & Analisi What-If
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Regola le rese orarie di picking, la durata del turno, o simula picchi promozionali per osservare l&apos;impatto immediato sulla squadra.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isModified && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ripristina Benchmark Python</span>
            </button>
          )}
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Box 1: Rese Orarie Reparti */}
        <div className="lg:col-span-2 bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-3">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
            Rese Orarie di Allestimento (Colli / Ora)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {DEPARTMENTS.map((dept) => (
              <div key={dept} className="flex items-center justify-between bg-white p-2.5 rounded border border-slate-200">
                <span className="font-semibold text-slate-800">{dept}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step={1}
                    min={10}
                    max={100}
                    value={params.reseOrarie[dept]}
                    onChange={(e) => handleResaChange(dept, parseFloat(e.target.value) || 30)}
                    className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-right font-mono tabular-nums font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <span className="text-[11px] text-slate-400">c/h</span>
                </div>
              </div>
            ))}
          </div>
          <span className="text-[11px] text-slate-500 block">
            Benchmark: Alimentari 40 · Chimica 45 · Liquidi 35 · Petfood 40 · Profumeria 30 c/h
          </span>
        </div>

        {/* Box 2: Parametri Turno & Soglia */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-3.5 text-xs">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
            Parametri Operativi Turno
          </span>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Durata Turno Base</label>
              <span className="font-mono tabular-nums font-bold text-slate-900">{params.oreTurno.toFixed(1)} ore</span>
            </div>
            <input
              type="range"
              min={2.0}
              max={6.0}
              step={0.5}
              value={params.oreTurno}
              onChange={(e) => onChangeParams({ ...params, oreTurno: parseFloat(e.target.value) })}
              className="w-full accent-slate-900"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>2.0h</span>
              <span>3.0h (default)</span>
              <span>6.0h</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Soglia Arrotondamento Reparto</label>
              <span className="font-mono tabular-nums font-bold text-slate-900">
                &ge; {params.sogliaArrotondamento.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0.30}
              max={0.70}
              step={0.05}
              value={params.sogliaArrotondamento}
              onChange={(e) => onChangeParams({ ...params, sogliaArrotondamento: parseFloat(e.target.value) })}
              className="w-full accent-slate-900"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0.30 (più rigido)</span>
              <span>0.50 (default)</span>
              <span>0.70 (più conservativo)</span>
            </div>
          </div>
        </div>

        {/* Box 3: Simulazione Volumi (+/- %) */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-3.5 text-xs">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
            Stress Test Volumi (Promo/Stagionalità)
          </span>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Delta Volumi Allestimento</label>
              <span className={`font-mono tabular-nums font-bold ${params.deltaPercentualeVolumi > 0 ? 'text-amber-800' : params.deltaPercentualeVolumi < 0 ? 'text-blue-800' : 'text-slate-900'}`}>
                {params.deltaPercentualeVolumi > 0 ? `+${params.deltaPercentualeVolumi}%` : `${params.deltaPercentualeVolumi}%`}
              </span>
            </div>
            <input
              type="range"
              min={-30}
              max={50}
              step={5}
              value={params.deltaPercentualeVolumi}
              onChange={(e) => onChangeParams({ ...params, deltaPercentualeVolumi: parseInt(e.target.value) })}
              className="w-full accent-slate-900"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>-30%</span>
              <span>0% (Reale)</span>
              <span>+50% (Picco)</span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-600 bg-white p-2.5 rounded border border-slate-200">
            {params.deltaPercentualeVolumi === 0
              ? 'Volumi standard da storico Colonna L'
              : params.deltaPercentualeVolumi > 0
              ? `Simulazione picco: +${Math.round(currentTotals.totaleColliL - baselineTotals.totaleColliL)} colli in settimana`
              : `Simulazione flessione: ${Math.round(currentTotals.totaleColliL - baselineTotals.totaleColliL)} colli in settimana`}
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Box */}
      <div className="bg-slate-900 text-white rounded-lg p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-3">
          Confronto Istantaneo: Modello Benchmark vs Scenario Simulato
        </span>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* Colli Totali */}
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-[11px] text-slate-400">Colli Totali Settimana</span>
            <div className="mt-1 flex items-baseline gap-2 font-mono tabular-nums">
              <span className="text-slate-400 line-through text-xs">
                {Math.round(baselineTotals.totaleColliL).toLocaleString('it-IT')}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="text-lg font-bold text-white">
                {Math.round(currentTotals.totaleColliL).toLocaleString('it-IT')}
              </span>
            </div>
          </div>

          {/* Turni FTE Teorici */}
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-[11px] text-slate-400">FTE Teorici Complessivi</span>
            <div className="mt-1 flex items-baseline gap-2 font-mono tabular-nums">
              <span className="text-slate-400 line-through text-xs">{baselineTotals.turniTeoriciFTE.toFixed(2)}</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="text-lg font-bold text-amber-300">
                {currentTotals.turniTeoriciFTE.toFixed(2)}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Delta: {parseFloat(diffFte) >= 0 ? `+${diffFte}` : diffFte} FTE
            </div>
          </div>

          {/* Squadra Reale */}
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-[11px] text-slate-400">Squadra Ottimale Reale</span>
            <div className="mt-1 flex items-baseline gap-2 font-mono tabular-nums">
              <span className="text-slate-400 line-through text-xs">{baselineTotals.squadraOttimaleReale}</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="text-lg font-bold text-emerald-300">
                {currentTotals.squadraOttimaleReale} turni
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Delta: {diffReali >= 0 ? `+${diffReali}` : diffReali} turni reali
            </div>
          </div>

          {/* Addetti Jolly */}
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-[11px] text-slate-400">Addetti Jolly Mobilità</span>
            <div className="mt-1 flex items-baseline gap-2 font-mono tabular-nums">
              <span className="text-slate-400 line-through text-xs">{baselineTotals.addettiJollyMobilita}</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="text-lg font-bold text-cyan-300">
                {currentTotals.addettiJollyMobilita} jolly
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Copertura ore scoperte: {currentTotals.oreNetteScoperte.toFixed(1)}h
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
