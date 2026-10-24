import React, { useState } from 'react';
import {
  CATEGORY_RISK_DATA,
  simulateOrderRisk,
  OrderRiskInput,
  DEPARTMENTS,
  GIORNI_ITA,
} from '../services/forecastingEngine';
import { Sottoreparto } from '../types/forecasting';
import { ShieldAlert, CheckCircle, Calculator, HelpCircle } from 'lucide-react';

export const RischioTagliView: React.FC = () => {
  const [orderInput, setOrderInput] = useState<OrderRiskInput>({
    categoria: 'FRESCHI & GASTRONOMIA',
    sottoreparto: 'ALIMENTARI',
    colliOrdinati: 120,
    tipoCarico: 'Picking Colli',
    piattaforma: 'HUB Nord',
    giorno: 'Venerdì',
  });

  const prediction = simulateOrderRisk(orderInput);

  const riskBadgeStyles: Record<string, string> = {
    ELEVATO: 'text-amber-800 bg-amber-50 border-amber-200',
    MEDIO: 'text-blue-800 bg-blue-50 border-blue-200',
    BASSO: 'text-emerald-800 bg-emerald-50 border-emerald-200',
  };

  const handleDeptChange = (dept: Sottoreparto) => {
    // Find matching category
    const cat = CATEGORY_RISK_DATA.find((c) => c.sottoreparto === dept);
    setOrderInput((prev) => ({
      ...prev,
      sottoreparto: dept,
      categoria: cat ? cat.categoria : prev.categoria,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header notice */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Stadio 1: Classificatore Gradient Boosting Rischio Tagli & Rotture Stock
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Target: Taglio = (Colli Effettivi L &lt; Colli Ordinati K)</span>
              <span aria-hidden="true">·</span>
              <span>Modello: HistGradientBoostingClassifier (balanced, max_depth=6, lr=0.05)</span>
              <span aria-hidden="true">·</span>
              <span>Previene discrepanze tra volumi ordinati dal buyer e colli effettivamente allestiti</span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Discriminazione ROC-AUC
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">0.8924</span>
            <span className="text-xs text-emerald-700 font-medium">Ottimale (&gt;0.85)</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Capacità di isolare gli ordini ad alto rischio di fornitura.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Precision-Recall PR-AUC
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">0.7410</span>
            <span className="text-xs text-slate-500 font-medium">Sbilanciamento gestito</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Ponderazione balanced per catturare rotture rare ma critiche.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Tasso Taglio Medio Storico
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">14.8%</span>
            <span className="text-xs text-slate-500 font-medium">delle righe d&apos;ordine</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Incidenza media ordini inevasi o ridotti a monte dal CeDi.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Feature Primarie Modello
          </span>
          <div className="mt-2 text-xs font-semibold text-slate-800">
            Categoria · Sottoreparto · Giorno · Tipo Carico
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Target encoding su Codice Categoria + log(Colli Ordinati K).
          </p>
        </div>
      </div>

      {/* Main Grid: Categories Table & Interactive Order Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Category Vulnerability Matrix */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Vulnerabilità Merceologica & Tasso di Taglio Storico
            </span>
            <span className="text-xs text-slate-500">Analisi cluster categorie</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="py-2.5 px-4 font-semibold whitespace-nowrap">Categoria Merceologica</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Sottoreparto</th>
                  <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">Tasso Taglio</th>
                  <th className="py-2.5 px-3 font-semibold text-center whitespace-nowrap">Livello</th>
                  <th className="py-2.5 px-4 font-semibold whitespace-nowrap">Causa Operativa Primaria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {CATEGORY_RISK_DATA.map((cat) => (
                  <tr key={cat.categoria} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {cat.categoria}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-600 whitespace-nowrap">
                      {cat.sottoreparto}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                      {(cat.tassoTaglio * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${riskBadgeStyles[cat.rischioLivello]}`}>
                        {cat.rischioLivello}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {cat.causeTipiche}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Interactive Order Simulator */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Strumento Operativo
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Simulatore Rischio Taglio Singolo Ordine
                </h3>
              </div>
              <Calculator className="w-5 h-5 text-slate-500" />
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              {/* Sottoreparto */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sottoreparto</label>
                <select
                  value={orderInput.sottoreparto}
                  onChange={(e) => handleDeptChange(e.target.value as Sottoreparto)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Categoria */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Categoria Merceologica</label>
                <select
                  value={orderInput.categoria}
                  onChange={(e) => setOrderInput({ ...orderInput, categoria: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800"
                >
                  {CATEGORY_RISK_DATA.filter((c) => c.sottoreparto === orderInput.sottoreparto).map((c) => (
                    <option key={c.categoria} value={c.categoria}>
                      {c.categoria}
                    </option>
                  ))}
                </select>
              </div>

              {/* Colli Ordinati K & Giorno */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Colli Ordinati (K)</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={orderInput.colliOrdinati}
                    onChange={(e) =>
                      setOrderInput({ ...orderInput, colliOrdinati: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giorno Allestimento</label>
                  <select
                    value={orderInput.giorno}
                    onChange={(e) => setOrderInput({ ...orderInput, giorno: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    {GIORNI_ITA.slice(0, 6).map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tipo Carico & Piattaforma */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo Carico</label>
                  <select
                    value={orderInput.tipoCarico}
                    onChange={(e) =>
                      setOrderInput({
                        ...orderInput,
                        tipoCarico: e.target.value as OrderRiskInput['tipoCarico'],
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    <option value="Picking Colli">Picking Colli</option>
                    <option value="Pallet Intero">Pallet Intero</option>
                    <option value="Roll Container">Roll Container</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Piattaforma Consegna</label>
                  <select
                    value={orderInput.piattaforma}
                    onChange={(e) =>
                      setOrderInput({
                        ...orderInput,
                        piattaforma: e.target.value as OrderRiskInput['piattaforma'],
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    <option value="HUB Nord">HUB Nord</option>
                    <option value="HUB Centro">HUB Centro</option>
                    <option value="Transit Point Diretto">Transit Point Diretto</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Prediction Result Box */}
            <div className="mt-5 p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Stima Modello Previsionale</span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                    prediction.livelloRischio === 'CRITICO'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : prediction.livelloRischio === 'MEDIO'
                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}
                >
                  Rischio {prediction.livelloRischio}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">Probabilità Taglio</div>
                  <div className="text-base font-bold font-mono tabular-nums text-slate-900">
                    {(prediction.probabilitaTaglio * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="bg-white p-2 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">Colli Effettivi L</div>
                  <div className="text-base font-bold font-mono tabular-nums text-slate-900">
                    {prediction.colliEffettiviPrevisti}
                  </div>
                </div>

                <div className="bg-white p-2 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">Colli Tagliati</div>
                  <div className="text-base font-bold font-mono tabular-nums text-amber-700">
                    -{prediction.colliTaglioStimati}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200 flex items-start gap-2">
                {prediction.livelloRischio === 'CRITICO' ? (
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <span>{prediction.consiglioOperativo}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              Scostamento atteso tra Colonna K ed L
            </span>
            <span className="font-mono tabular-nums text-slate-700">
              Resa reparto: {orderInput.sottoreparto === 'PROFUMERIA' ? 30 : orderInput.sottoreparto === 'LIQUIDI' ? 35 : orderInput.sottoreparto === 'CHIMICA' ? 45 : 40} c/h
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
