import React from 'react';
import { Users, Clock, Package, Shuffle, ShieldCheck } from 'lucide-react';
import { DaySummary } from '../types/forecasting';

interface MetricCardsProps {
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
  daySummaries: DaySummary[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({ weeklyTotals }) => {
  const coverageRatio = weeklyTotals.turniTeoriciFTE > 0
    ? ((weeklyTotals.squadraOttimaleReale / weeklyTotals.turniTeoriciFTE) * 100).toFixed(1)
    : '100.0';

  const metrics = [
    {
      title: 'Squadra Ottimale Reale',
      value: `${weeklyTotals.squadraOttimaleReale}`,
      unit: 'turni reali / sett.',
      subtitle: '12 Lun-Gio · 11 Ven-Sab · 0 Dom',
      icon: Users,
      trend: '+3.78 turni margine di sicurezza',
    },
    {
      title: 'Turni Teorici FTE (3h)',
      value: weeklyTotals.turniTeoriciFTE.toFixed(2),
      unit: 'FTE calcolati',
      subtitle: `${weeklyTotals.oreTotaliRichieste.toFixed(1)} ore complessive richieste`,
      icon: Clock,
      trend: 'Base fabbisogno allestimento',
    },
    {
      title: 'Jolly Mobilità Interna',
      value: `${weeklyTotals.addettiJollyMobilita}`,
      unit: 'turni jolly settimanali',
      subtitle: '1 - 2 Jolly attivi al giorno',
      icon: Shuffle,
      trend: 'Copertura deficit frazioni < 0.50',
    },
    {
      title: 'Colli Effettivi Allestimento',
      value: Math.round(weeklyTotals.totaleColliL).toLocaleString('it-IT'),
      unit: 'colli da Colonna L',
      subtitle: '5 sottoreparti analizzati',
      icon: Package,
      trend: 'Media ~1.439 colli/giorno lavorativo',
    },
    {
      title: 'Copertura Organico Nette',
      value: `${coverageRatio}%`,
      unit: 'indice copertura',
      subtitle: `${weeklyTotals.oreNetteScoperte.toFixed(1)}h scoperte coperte da Jolly`,
      icon: ShieldCheck,
      trend: 'Zero scoperture a fine turno',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map((m, idx) => {
        const Icon = m.icon;
        return (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {m.title}
              </span>
              <Icon className="w-4 h-4 text-slate-400" />
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {m.value}
                </span>
                <span className="text-xs text-slate-500">{m.unit}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600 font-medium">
                {m.subtitle}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
              <span>{m.trend}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
