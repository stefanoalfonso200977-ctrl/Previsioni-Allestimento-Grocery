import React, { useState } from 'react';
import { DaySummary } from '../types/forecasting';
import { DEPARTMENTS } from '../services/forecastingEngine';
import { Layers, Activity, Calendar } from 'lucide-react';

interface ColliPrevisioneViewProps {
  daySummaries: DaySummary[];
}

export const ColliPrevisioneView: React.FC<ColliPrevisioneViewProps> = ({ daySummaries }) => {
  const [activeDayIdx, setActiveDayIdx] = useState<number>(0);
  const activeDay = daySummaries[activeDayIdx] || daySummaries[0];

  const deptColors: Record<string, string> = {
    ALIMENTARI: 'bg-blue-600',
    CHIMICA: 'bg-emerald-600',
    LIQUIDI: 'bg-cyan-600',
    PETFOOD: 'bg-amber-600',
    PROFUMERIA: 'bg-purple-600',
  };

  const deptBorderColors: Record<string, string> = {
    ALIMENTARI: 'border-blue-200 text-blue-900 bg-blue-50/50',
    CHIMICA: 'border-emerald-200 text-emerald-900 bg-emerald-50/50',
    LIQUIDI: 'border-cyan-200 text-cyan-900 bg-cyan-50/50',
    PETFOOD: 'border-amber-200 text-amber-900 bg-amber-50/50',
    PROFUMERIA: 'border-purple-200 text-purple-900 bg-purple-50/50',
  };

  const totalWeeklyColli = daySummaries.reduce((acc, d) => acc + d.totaleColliL, 0);

  return (
    <div className="space-y-6">
      {/* Header notice */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Previsione Settimanale Colli Effettivi da Allestire (Foglio 3)
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Target: Colonna L (idx 11) - Colli Allestimento Effettivi</span>
              <span aria-hidden="true">·</span>
              <span>Modello: HistGradientBoostingRegressor (loss=&apos;poisson&apos;, lag_1, lag_7, rolling_3)</span>
              <span aria-hidden="true">·</span>
              <span>Totale Settimanale: {Math.round(totalWeeklyColli).toLocaleString('it-IT')} colli</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">Seleziona giorno:</span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
              {daySummaries.slice(0, 6).map((day, idx) => (
                <button
                  key={day.giorno}
                  onClick={() => setActiveDayIdx(idx)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeDayIdx === idx
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {day.giorno.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Foglio 3 Master Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Matrice Previsionale Colli per Giorno e Sottoreparto (Colonna L)
          </span>
          <span className="text-xs text-slate-500">Unità di misura: Colli fisici allestiti</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Giorno</th>
                {DEPARTMENTS.map((dept) => (
                  <th key={dept} className="py-3 px-4 font-semibold text-right whitespace-nowrap">
                    {dept}
                  </th>
                ))}
                <th className="py-3 px-4 font-bold text-right whitespace-nowrap bg-slate-800 text-amber-200">
                  TOTALE COLLI GIORNO
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {daySummaries.map((day, idx) => {
                const isSelected = activeDayIdx === idx;
                const isSunday = idx === 6;

                return (
                  <tr
                    key={day.giorno}
                    onClick={() => setActiveDayIdx(idx)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-100/80 font-medium'
                        : isSunday
                        ? 'bg-slate-50/40 text-slate-400'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-900' : 'bg-transparent'}`}></span>
                      {day.giorno}
                    </td>

                    {DEPARTMENTS.map((dept) => (
                      <td key={dept} className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {isSunday ? '-' : day.reparti[dept].colliL.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </td>
                    ))}

                    <td className="py-3 px-4 text-right font-bold font-mono tabular-nums bg-slate-100/60 text-slate-900 whitespace-nowrap">
                      {isSunday ? '-' : day.totaleColliL.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                <td className="py-3.5 px-4 text-slate-900 uppercase tracking-wider whitespace-nowrap">
                  Totale Settimanale
                </td>
                {DEPARTMENTS.map((dept) => {
                  const deptSum = daySummaries.reduce((a, b) => a + b.reparti[dept].colliL, 0);
                  return (
                    <td key={dept} className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                      {deptSum.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </td>
                  );
                })}
                <td className="py-3.5 px-4 text-right font-mono tabular-nums bg-slate-200 text-slate-950 text-sm whitespace-nowrap">
                  {totalWeeklyColli.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Visual breakdown & Daily Picking Pace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Department Share on Active Day */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Ripartizione Volumetrica
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Focus Volumi: {activeDay.giorno} ({activeDay.totaleColliL.toLocaleString('it-IT')} colli)
              </h3>
            </div>
            <Layers className="w-5 h-5 text-slate-400" />
          </div>

          <div className="mt-5 space-y-4">
            {activeDay.giornoNum === 6 ? (
              <p className="text-xs text-slate-500 py-8 text-center">Nessun allestimento di domenica.</p>
            ) : (
              DEPARTMENTS.map((dept) => {
                const colli = activeDay.reparti[dept].colliL;
                const percentage = activeDay.totaleColliL > 0
                  ? ((colli / activeDay.totaleColliL) * 100).toFixed(1)
                  : '0.0';

                return (
                  <div key={dept} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-sm ${deptColors[dept]}`}></span>
                        <span className="font-semibold text-slate-800">{dept}</span>
                      </div>
                      <div className="font-mono tabular-nums text-slate-700">
                        <span className="font-bold text-slate-900">{colli.toLocaleString('it-IT')} colli</span>
                        <span className="text-slate-500 ml-2">({percentage}%)</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full ${deptColors[dept]} rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Operational Picking Pace (Cadenza Allestimento) */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Ritmo Operativo (3 Ore)
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Cadenza Picking {activeDay.giorno}
                </h3>
              </div>
              <Activity className="w-5 h-5 text-slate-400" />
            </div>

            <div className="mt-4 space-y-3">
              {activeDay.giornoNum === 6 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Impianto a riposo.</p>
              ) : (
                DEPARTMENTS.map((dept) => {
                  const r = activeDay.reparti[dept];
                  const colliMinuto = (r.colliL / (3 * 60)).toFixed(2);
                  const colliOraReparto = (r.colliL / 3).toFixed(1);

                  return (
                    <div
                      key={dept}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${deptBorderColors[dept]}`}
                    >
                      <div>
                        <span className="font-bold">{dept}</span>
                        <div className="text-[11px] opacity-80">
                          {colliOraReparto} colli/ora complessivi
                        </div>
                      </div>
                      <div className="text-right font-mono tabular-nums">
                        <div className="font-bold text-sm">{colliMinuto}</div>
                        <div className="text-[10px] opacity-75">colli / minuto</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Turno di allestimento: 06:00 - 09:00 (3h)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
