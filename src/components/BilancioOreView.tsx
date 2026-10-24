import React, { useState, useMemo } from 'react';
import { DepartmentDayPrediction, Sottoreparto } from '../types/forecasting';
import { DEPARTMENTS, GIORNI_ITA } from '../services/forecastingEngine';
import { Filter, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BilancioOreViewProps {
  detailedPredictions: DepartmentDayPrediction[];
}

export const BilancioOreView: React.FC<BilancioOreViewProps> = ({ detailedPredictions }) => {
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'DEFICIT' | 'SURPLUS'>('ALL');

  // Filter out Sunday because in the python script: self.df_staff[self.df_staff['Giorno_Num'] < 6]
  const workingDayPredictions = useMemo(() => {
    return detailedPredictions.filter((p) => p.giornoNum < 6);
  }, [detailedPredictions]);

  const filteredPredictions = useMemo(() => {
    return workingDayPredictions.filter((item) => {
      if (selectedDept !== 'ALL' && item.sottoreparto !== selectedDept) return false;
      if (selectedDay !== 'ALL' && item.giorno !== selectedDay) return false;
      if (balanceFilter === 'DEFICIT' && item.bilancioOreMobilita <= 0) return false;
      if (balanceFilter === 'SURPLUS' && item.bilancioOreMobilita >= 0) return false;
      return true;
    });
  }, [workingDayPredictions, selectedDept, selectedDay, balanceFilter]);

  // Aggregate stats
  const totalOreRichieste = workingDayPredictions.reduce((acc, p) => acc + p.oreRichieste, 0);
  const totalOreCoperte = workingDayPredictions.reduce((acc, p) => acc + p.addettiSoglia050 * 3, 0);
  const totalDeficitHours = workingDayPredictions
    .filter((p) => p.bilancioOreMobilita > 0)
    .reduce((acc, p) => acc + p.bilancioOreMobilita, 0);
  const totalSurplusHours = workingDayPredictions
    .filter((p) => p.bilancioOreMobilita < 0)
    .reduce((acc, p) => acc + Math.abs(p.bilancioOreMobilita), 0);

  return (
    <div className="space-y-6">
      {/* Header notice */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Dettaglio Ore Richieste, Addetti Soglia 0,50 & Bilancio Ore (Foglio 4)
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Formula: Bilancio Ore = (FTE Teorico - Addetti Soglia 0,50) × 3h Turno</span>
              <span aria-hidden="true">·</span>
              <span>Valore positivo (+) = Deficit orario da coprire con Jolly in mobilità</span>
              <span aria-hidden="true">·</span>
              <span>Valore negativo (-) = Avanzo orario potenziale</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
            <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
              <span className="font-semibold block text-[10px] uppercase text-amber-700">Deficit Lordo Da Coprire</span>
              <span className="text-sm font-bold">+{totalDeficitHours.toFixed(1)} ore</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
              <span className="font-semibold block text-[10px] uppercase text-emerald-700">Avanzo Fisiologico</span>
              <span className="text-sm font-bold">-{totalSurplusHours.toFixed(1)} ore</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Filtri:
            </span>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">Tutti i Sottoreparti (5)</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* Day Filter */}
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">Tutti i Giorni Lavorativi (Lun-Sab)</option>
              {GIORNI_ITA.slice(0, 6).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>

            {/* Status Segmented Control */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
              <button
                onClick={() => setBalanceFilter('ALL')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  balanceFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tutti ({workingDayPredictions.length})
              </button>
              <button
                onClick={() => setBalanceFilter('DEFICIT')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  balanceFilter === 'DEFICIT' ? 'bg-white text-amber-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Deficit (+)
              </button>
              <button
                onClick={() => setBalanceFilter('SURPLUS')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  balanceFilter === 'SURPLUS' ? 'bg-white text-emerald-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Avanzo (-)
              </button>
            </div>
          </div>

          <span className="text-xs text-slate-500 font-mono tabular-nums">
            Visualizzate {filteredPredictions.length} di {workingDayPredictions.length} combinazioni
          </span>
        </div>
      </div>

      {/* Main Table Foglio 4 */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Giorno</th>
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Sottoreparto</th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Colli Previsti (L)</th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">Resa (c/h)</th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Ore Richieste</th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">FTE Teorici (3h)</th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap bg-slate-800">
                  Addetti (Soglia 0,50)
                </th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap bg-slate-800">
                  Bilancio Ore (+ Deficit / - Avanzo)
                </th>
                <th className="py-3 px-4 font-semibold text-left whitespace-nowrap">
                  Azione Mobilità
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPredictions.map((row, idx) => {
                const isDeficit = row.bilancioOreMobilita > 0;
                const isSurplus = row.bilancioOreMobilita < 0;

                return (
                  <tr key={`${row.giorno}-${row.sottoreparto}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                      {row.giorno}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {row.sottoreparto}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {row.colliL.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {row.resaOraria}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
                      {row.oreRichieste.toFixed(2)} h
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {row.fteTeorici3h.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold font-mono tabular-nums bg-slate-50 text-slate-900 whitespace-nowrap text-sm">
                      {row.addettiSoglia050}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                      {isDeficit ? (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          +{row.bilancioOreMobilita.toFixed(2)} h
                        </span>
                      ) : isSurplus ? (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {row.bilancioOreMobilita.toFixed(2)} h
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-mono">
                          0.00 h
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-xs whitespace-nowrap">
                      {isDeficit ? (
                        <span className="text-amber-800 font-medium flex items-center gap-1.5">
                          Riceve supporto da Jolly mobilità ({row.bilancioOreMobilita.toFixed(1)}h)
                        </span>
                      ) : isSurplus ? (
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Coperto autonomamente con riserva
                        </span>
                      ) : (
                        <span className="text-slate-400">Perfettamente bilanciato</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                <td colSpan={4} className="py-3 px-4 text-slate-900 uppercase tracking-wider">
                  Riepilogo Ore Lavorative Settimanali
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                  {totalOreRichieste.toFixed(2)} h
                </td>
                <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-700">
                  {(totalOreRichieste / 3).toFixed(2)}
                </td>
                <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-900 text-sm">
                  {workingDayPredictions.reduce((a, b) => a + b.addettiSoglia050, 0)}
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                  Ore Coperte: {totalOreCoperte.toFixed(1)} h
                </td>
                <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                  Residuo netto assorbito da Jolly
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
