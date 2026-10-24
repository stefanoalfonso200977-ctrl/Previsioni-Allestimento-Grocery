import React from 'react';
import { OrizzonteSummary } from '../types/forecasting';
import { CalendarRange, TrendingUp, Users } from 'lucide-react';

interface OrizzontiTemporaliViewProps {
  orizzonti: OrizzonteSummary[];
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

export const OrizzontiTemporaliView: React.FC<OrizzontiTemporaliViewProps> = ({
  orizzonti,
  weeklyTotals,
}) => {
  const teoResW = Math.round((weeklyTotals.oreNetteScoperte / 3.0) * 100) / 100;

  // Monthly values (30 days factor 30/7)
  const meseColli = Math.round(weeklyTotals.totaleColliL * (30 / 7));
  const meseTeorici = Math.round(weeklyTotals.turniTeoriciFTE * (30 / 7) * 10) / 10;
  const meseReali = Math.round(weeklyTotals.squadraOttimaleReale * (30 / 7));

  // Quarterly values (13 weeks factor 13)
  const trimColli = Math.round(weeklyTotals.totaleColliL * 13);
  const trimTeorici = Math.round(weeklyTotals.turniTeoriciFTE * 13 * 10) / 10;
  const trimReali = weeklyTotals.squadraOttimaleReale * 13;

  return (
    <div className="space-y-6">
      {/* Header notice */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Sintesi Orizzonti Temporali: Settimana, Mese (30gg) & Trimestre (13 Sett.) (Foglio 2)
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Proiezione Mensile: fattore × (30 / 7)</span>
              <span aria-hidden="true">·</span>
              <span>Proiezione Trimestrale: fattore × 13 settimane (~91 giorni)</span>
              <span aria-hidden="true">·</span>
              <span>Supporto strategico per contratti di somministrazione lavoro e budget turni</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Horizon KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Settimana */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Orizzonte 1: Settimana (7gg)
            </span>
            <CalendarRange className="w-4 h-4 text-slate-400" />
          </div>
          <div className="my-3 space-y-1">
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {Math.round(weeklyTotals.totaleColliL).toLocaleString('it-IT')} <span className="text-xs font-normal text-slate-500">colli</span>
            </div>
            <div className="text-xs font-medium text-slate-700 flex items-center justify-between">
              <span>Turni Reali Necessari:</span>
              <span className="font-mono tabular-nums font-bold text-slate-900">{weeklyTotals.squadraOttimaleReale} turni (3h)</span>
            </div>
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Turni FTE Teorici:</span>
              <span className="font-mono tabular-nums">{weeklyTotals.turniTeoriciFTE.toFixed(2)} FTE</span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 text-xs text-slate-500">
            Cadenza: 12 turni/gg (Lun-Gio), 11 turni/gg (Ven-Sab)
          </div>
        </div>

        {/* Mese (30gg) */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Orizzonte 2: Mese (30 Giorni)
            </span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="my-3 space-y-1">
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {meseColli.toLocaleString('it-IT')} <span className="text-xs font-normal text-slate-500">colli</span>
            </div>
            <div className="text-xs font-medium text-slate-700 flex items-center justify-between">
              <span>Turni Reali Necessari:</span>
              <span className="font-mono tabular-nums font-bold text-slate-900">{meseReali} turni (3h)</span>
            </div>
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Turni FTE Teorici:</span>
              <span className="font-mono tabular-nums">{meseTeorici.toFixed(1)} FTE</span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 text-xs text-slate-500">
            Fabbisogno mensile per pianificazione turnistica
          </div>
        </div>

        {/* Trimestre (13 Sett.) */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Orizzonte 3: Trimestre (13 Settimane)
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="my-3 space-y-1">
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {trimColli.toLocaleString('it-IT')} <span className="text-xs font-normal text-slate-500">colli</span>
            </div>
            <div className="text-xs font-medium text-slate-700 flex items-center justify-between">
              <span>Turni Reali Necessari:</span>
              <span className="font-mono tabular-nums font-bold text-slate-900">{trimReali} turni (3h)</span>
            </div>
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Turni FTE Teorici:</span>
              <span className="font-mono tabular-nums">{trimTeorici.toFixed(1)} FTE</span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 text-xs text-slate-500">
            Dimensionamento organico & gare d&apos;appalto logistica
          </div>
        </div>
      </div>

      {/* Main Table Foglio 2 */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Matrice Comparativa degli Orizzonti di Allestimento
          </span>
          <span className="text-xs text-slate-500">Colli Effettivi e Turni di Lavoro (3h)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th rowSpan={2} className="py-3 px-4 font-semibold whitespace-nowrap border-r border-slate-800">
                  Sottoreparto / Voce
                </th>
                <th rowSpan={2} className="py-3 px-3 font-semibold text-center whitespace-nowrap border-r border-slate-800">
                  Dotazione Giornaliera <span className="font-normal text-slate-300 block text-[10px]">(Soglia 0,50)</span>
                </th>
                <th colSpan={3} className="py-2 px-3 font-semibold text-center whitespace-nowrap border-r border-slate-800 bg-slate-800">
                  SETTIMANA (7 GG)
                </th>
                <th colSpan={3} className="py-2 px-3 font-semibold text-center whitespace-nowrap border-r border-slate-800 bg-slate-850">
                  MESE (30 GG)
                </th>
                <th colSpan={3} className="py-2 px-3 font-semibold text-center whitespace-nowrap bg-slate-800">
                  TRIMESTRE (13 SETT.)
                </th>
              </tr>
              <tr className="bg-slate-800 text-slate-200 text-[11px]">
                <th className="py-2 px-3 text-right">Colli (L)</th>
                <th className="py-2 px-3 text-right">FTE Teo.</th>
                <th className="py-2 px-3 text-center border-r border-slate-700 font-bold text-white">Turni Reali</th>

                <th className="py-2 px-3 text-right">Colli (L)</th>
                <th className="py-2 px-3 text-right">FTE Teo.</th>
                <th className="py-2 px-3 text-center border-r border-slate-700 font-bold text-white">Turni Reali</th>

                <th className="py-2 px-3 text-right">Colli (L)</th>
                <th className="py-2 px-3 text-right">FTE Teo.</th>
                <th className="py-2 px-3 text-center font-bold text-white">Turni Reali</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {orizzonti.map((item) => (
                <tr key={item.sottoreparto} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap border-r border-slate-100">
                    {item.sottoreparto}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-600 whitespace-nowrap border-r border-slate-100">
                    {item.dotazioneGiornaliera}
                  </td>

                  {/* Settimana */}
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                    {item.settimana.colli.toLocaleString('it-IT')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                    {item.settimana.turniTeorici.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold font-mono tabular-nums text-slate-900 border-r border-slate-100 whitespace-nowrap bg-slate-50/50">
                    {item.settimana.turniReali}
                  </td>

                  {/* Mese */}
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                    {item.mese.colli.toLocaleString('it-IT')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                    {item.mese.turniTeorici.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold font-mono tabular-nums text-slate-900 border-r border-slate-100 whitespace-nowrap bg-slate-50/50">
                    {item.mese.turniReali}
                  </td>

                  {/* Trimestre */}
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                    {item.trimestre.colli.toLocaleString('it-IT')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                    {item.trimestre.turniTeorici.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold font-mono tabular-nums text-slate-900 whitespace-nowrap bg-slate-50/50">
                    {item.trimestre.turniReali}
                  </td>
                </tr>
              ))}

              {/* Row Jolly */}
              <tr className="bg-amber-50/80 font-medium text-amber-950 border-t border-amber-200">
                <td className="py-2.5 px-4 font-semibold whitespace-nowrap border-r border-amber-200">
                  Integrazione Jolly Mobilità (Resti &lt; 0,50)
                </td>
                <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-amber-200">
                  1 - 2 Jolly / giorno
                </td>

                <td className="py-2.5 px-3 text-right font-mono tabular-nums">-</td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums">{teoResW.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-center font-bold font-mono tabular-nums border-r border-amber-200">
                  {weeklyTotals.addettiJollyMobilita}
                </td>

                <td className="py-2.5 px-3 text-right font-mono tabular-nums">-</td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums">{Math.round(teoResW * (30 / 7) * 10) / 10}</td>
                <td className="py-2.5 px-3 text-center font-bold font-mono tabular-nums border-r border-amber-200">
                  {Math.round(weeklyTotals.addettiJollyMobilita * (30 / 7))}
                </td>

                <td className="py-2.5 px-3 text-right font-mono tabular-nums">-</td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums">{Math.round(teoResW * 13 * 10) / 10}</td>
                <td className="py-2.5 px-3 text-center font-bold font-mono tabular-nums">
                  {weeklyTotals.addettiJollyMobilita * 13}
                </td>
              </tr>
            </tbody>

            {/* Row Total */}
            <tfoot>
              <tr className="bg-emerald-50/90 border-t-2 border-emerald-300 font-bold text-emerald-950">
                <td className="py-3 px-4 uppercase tracking-wider whitespace-nowrap border-r border-emerald-200">
                  TOTALE SQUADRA OTTIMALE
                </td>
                <td className="py-3 px-3 text-center whitespace-nowrap border-r border-emerald-200 text-xs">
                  12 (Lun-Gio) / 11 (Ven-Sab)
                </td>

                <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                  {Math.round(weeklyTotals.totaleColliL).toLocaleString('it-IT')}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                  {weeklyTotals.turniTeoriciFTE.toFixed(2)}
                </td>
                <td className="py-3 px-3 text-center font-mono tabular-nums border-r border-emerald-200 text-sm whitespace-nowrap">
                  {weeklyTotals.squadraOttimaleReale}
                </td>

                <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                  {meseColli.toLocaleString('it-IT')}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                  {meseTeorici.toFixed(1)}
                </td>
                <td className="py-3 px-3 text-center font-mono tabular-nums border-r border-emerald-200 text-sm whitespace-nowrap">
                  {meseReali}
                </td>

                <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                  {trimColli.toLocaleString('it-IT')}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                  {trimTeorici.toFixed(1)}
                </td>
                <td className="py-3 px-3 text-center font-mono tabular-nums text-sm whitespace-nowrap">
                  {trimReali}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
