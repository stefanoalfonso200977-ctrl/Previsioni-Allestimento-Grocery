import React, { useState } from 'react';
import { DaySummary } from '../types/forecasting';
import { DEPARTMENTS } from '../services/forecastingEngine';
import { Info, UserCheck, ArrowRightLeft } from 'lucide-react';

interface SquadraMobilitaViewProps {
  daySummaries: DaySummary[];
  weeklyTotals: {
    totaleColliL: number;
    sommaAddetti050: number;
    turniTeoriciFTE: number;
    oreTotaliRichieste: number;
    oreCoperte050: number;
    oreNetteScoperte: number;
    squadraOttimaleReale: number;
    addettiJollyMobilita: number;
  };
}

export const SquadraMobilitaView: React.FC<SquadraMobilitaViewProps> = ({
  daySummaries,
  weeklyTotals,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const selectedDay = daySummaries[selectedDayIndex] || daySummaries[0];

  return (
    <div className="space-y-6">
      {/* Overview header notice */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Pianificazione Squadra Allestimento & Mobilità Interna (Foglio 1)
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Regola soglia: decimale &lt; 0,50 per difetto, &ge; 0,50 per eccesso</span>
              <span aria-hidden="true">·</span>
              <span>Turno operativo: 3,0 ore</span>
              <span aria-hidden="true">·</span>
              <span>Squadra reale: 12 (Lun-Gio) / 11 (Ven-Sab) = 70 turni totali</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              Fisso Reparto (Soglia 0,50)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-800 font-medium border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Jolly Mobilità Interna
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Squadra Ottimale
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Matching Foglio 1 */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Tabella Settimanale di Assegnazione Turni (3h)
          </span>
          <span className="text-xs text-slate-500">
            Fai clic su un giorno per visualizzare i compiti degli addetti Jolly
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Giorno</th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">
                  ALIMENTARI <span className="font-normal text-slate-300 block text-[11px]">40 c/h</span>
                </th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">
                  CHIMICA <span className="font-normal text-slate-300 block text-[11px]">45 c/h</span>
                </th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">
                  LIQUIDI <span className="font-normal text-slate-300 block text-[11px]">35 c/h</span>
                </th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">
                  PETFOOD <span className="font-normal text-slate-300 block text-[11px]">40 c/h</span>
                </th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">
                  PROFUMERIA <span className="font-normal text-slate-300 block text-[11px]">30 c/h</span>
                </th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap bg-slate-800">
                  Somma Addetti <span className="font-normal text-slate-300 block text-[11px]">(Soglia 0,50)</span>
                </th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">
                  Ore Nette Scoperte
                </th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap bg-amber-900/60 text-amber-200">
                  Jolly Mobilità
                </th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">
                  Turni Teorici (FTE)
                </th>
                <th className="py-3 px-4 font-bold text-center whitespace-nowrap bg-emerald-900 text-emerald-100">
                  SQUADRA REALE <span className="font-normal text-emerald-300 block text-[11px]">Turni 3h</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {daySummaries.map((day, idx) => {
                const isSelected = selectedDayIndex === idx;
                const isSunday = idx === 6;

                return (
                  <tr
                    key={day.giorno}
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-100/90 font-medium'
                        : isSunday
                        ? 'bg-slate-50/50 text-slate-400'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-900' : 'bg-transparent'}`}></span>
                      {day.giorno}
                    </td>

                    {/* Sottoreparti cells: showing Addetti (FTE) */}
                    {DEPARTMENTS.map((dept) => {
                      const r = day.reparti[dept];
                      return (
                        <td key={dept} className="py-3 px-3 text-center whitespace-nowrap font-mono tabular-nums">
                          {isSunday ? (
                            <span className="text-slate-300">-</span>
                          ) : (
                            <span>
                              <span className="font-bold text-slate-900 text-sm">{r.addetti050}</span>
                              <span className="text-slate-500 text-[11px] ml-1.5">({r.fteTeorici.toFixed(2)})</span>
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Somma Addetti 0.50 */}
                    <td className="py-3 px-3 text-center font-bold font-mono tabular-nums bg-slate-100/70 text-slate-900 whitespace-nowrap">
                      {isSunday ? '-' : day.sommaAddetti050}
                    </td>

                    {/* Ore Nette Scoperte */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {isSunday ? '-' : `${day.oreNetteScoperte.toFixed(2)} h`}
                    </td>

                    {/* Addetti Jolly */}
                    <td className="py-3 px-3 text-center font-bold font-mono tabular-nums bg-amber-50 text-amber-900 border-x border-amber-100 whitespace-nowrap">
                      {isSunday ? '-' : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-200/80 text-amber-900 font-bold text-xs">
                          {day.addettiJollyMobilita}
                        </span>
                      )}
                    </td>

                    {/* Turni Teorici FTE */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {isSunday ? '-' : day.turniTeoriciFTE.toFixed(2)}
                    </td>

                    {/* Squadra Ottimale Reale */}
                    <td className="py-3 px-4 text-center font-bold font-mono tabular-nums bg-emerald-50 text-emerald-900 whitespace-nowrap text-sm border-l border-emerald-100">
                      {isSunday ? '0 (Chiuso)' : day.squadraOttimaleReale}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Totale Settimana Footer */}
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                <td className="py-3.5 px-4 text-slate-900 whitespace-nowrap uppercase tracking-wider">
                  Totale Settimana
                </td>
                {DEPARTMENTS.map((dept) => {
                  const arrTot = daySummaries.reduce((a, b) => a + b.reparti[dept].addetti050, 0);
                  const fteTot = daySummaries.reduce((a, b) => a + b.reparti[dept].fteTeorici, 0);
                  return (
                    <td key={dept} className="py-3.5 px-3 text-center font-mono tabular-nums whitespace-nowrap">
                      <span className="text-slate-900 text-sm">{arrTot}</span>
                      <span className="text-slate-500 text-[11px] ml-1.5 font-normal">({fteTot.toFixed(2)})</span>
                    </td>
                  );
                })}
                <td className="py-3.5 px-3 text-center font-mono tabular-nums bg-slate-200/80 text-slate-900 whitespace-nowrap text-sm">
                  {weeklyTotals.sommaAddetti050}
                </td>
                <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                  {weeklyTotals.oreNetteScoperte.toFixed(2)} h
                </td>
                <td className="py-3.5 px-3 text-center font-mono tabular-nums bg-amber-100 text-amber-900 whitespace-nowrap text-sm">
                  {weeklyTotals.addettiJollyMobilita}
                </td>
                <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                  {weeklyTotals.turniTeoriciFTE.toFixed(2)}
                </td>
                <td className="py-3.5 px-4 text-center font-mono tabular-nums bg-emerald-100 text-emerald-950 whitespace-nowrap text-base">
                  {weeklyTotals.squadraOttimaleReale}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Inspector for the selected day & Jolly deployment plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Selected Day Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Dettaglio Giornata
              </span>
              <h3 className="text-base font-bold text-slate-900">{selectedDay.giorno}</h3>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded bg-slate-900 text-white font-mono tabular-nums">
              {selectedDay.squadraOttimaleReale} turni totali
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {selectedDay.giornoNum === 6 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Domenica: impianto chiuso, nessun allestimento programmato.
              </p>
            ) : (
              DEPARTMENTS.map((dept) => {
                const r = selectedDay.reparti[dept];
                const isDeficit = r.bilancioOre > 0;
                return (
                  <div
                    key={dept}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{dept}</span>
                      <div className="text-[11px] text-slate-500">
                        {r.colliL} colli · {r.oreRichieste.toFixed(1)}h richieste
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <div className="font-bold text-slate-900">
                        {r.addetti050} addetti ({r.fteTeorici.toFixed(2)} FTE)
                      </div>
                      <div
                        className={`text-[11px] ${
                          isDeficit ? 'text-amber-700 font-medium' : 'text-slate-500'
                        }`}
                      >
                        {isDeficit
                          ? `+${r.bilancioOre.toFixed(2)}h da coprire`
                          : `${r.bilancioOre.toFixed(2)}h avanzo`}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Card 2: Jolly Deployment and Internal Mobility Tasks */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Mobilità Interna & Jolly
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Compiti Addetti Jolly ({selectedDay.addettiJollyMobilita})
              </h3>
            </div>
            <ArrowRightLeft className="w-5 h-5 text-amber-600" />
          </div>

          <div className="mt-4 space-y-3">
            {selectedDay.giornoNum === 6 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Nessun turno jolly attivo.</p>
            ) : selectedDay.addettiJollyMobilita === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Tutti i fabbisogni sono già coperti dai ruoli assegnati al reparto.
              </p>
            ) : (
              selectedDay.jollyTaskAssignments.map((task, i) => (
                <div
                  key={i}
                  className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-semibold text-amber-950">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                      Addetto Jolly #{task.jollyId}
                    </span>
                    <span className="font-mono tabular-nums text-amber-800">
                      {task.ore.toFixed(1)} ore turno
                    </span>
                  </div>
                  <div className="text-amber-900 font-medium">
                    Assegnato prioritario: <span className="font-bold underline">{task.supporta}</span>
                  </div>
                  <div className="text-[11px] text-amber-700">
                    {task.motivo}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 3: Model Rules & Methodology */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Metodologia Modello
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Regola Soglia 0,50 & Mobilità
                </h3>
              </div>
              <Info className="w-5 h-5 text-slate-400" />
            </div>

            <div className="mt-4 space-y-2.5 text-xs text-slate-600">
              <p>
                <strong className="text-slate-900 font-semibold">1. Arrotondamento Sottoreparto:</strong> Se la parte decimale dell&apos;FTE teorico è &lt; 0,50 si assegna per difetto; se &ge; 0,50 per eccesso.
              </p>
              <p>
                <strong className="text-slate-900 font-semibold">2. Ore Nette Scoperte:</strong> Differenza complessiva tra le ore richieste dai colli previsti (Colonna L) e le ore garantite dagli addetti arrotondati.
              </p>
              <p>
                <strong className="text-slate-900 font-semibold">3. Squadra Jolly:</strong> La squadra reale (12 da Lunedì a Giovedì, 11 Venerdì e Sabato) include 1-2 addetti Jolly trasversali per azzerare i micro-deficit e prevenire colli di bottiglia nei reparti più lenti.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Rese: Alm 40 · Chm 45 · Liq 35 · Pet 40 · Prof 30 c/h</span>
            <span className="font-mono tabular-nums">70 Turni Reali</span>
          </div>
        </div>
      </div>
    </div>
  );
};
