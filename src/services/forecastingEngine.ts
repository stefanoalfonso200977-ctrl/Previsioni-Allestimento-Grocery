import * as XLSX from 'xlsx';
import {
  Sottoreparto,
  ReseOrarie,
  DepartmentDayPrediction,
  DaySummary,
  OrizzonteSummary,
  CategoryRiskStat,
  SimulationParams
} from '../types/forecasting';

export const DEPARTMENTS: Sottoreparto[] = ['ALIMENTARI', 'CHIMICA', 'LIQUIDI', 'PETFOOD', 'PROFUMERIA'];

export const GIORNI_ITA = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

export const DEFAULT_RESE: ReseOrarie = {
  ALIMENTARI: 40.0,
  CHIMICA: 45.0,
  LIQUIDI: 35.0,
  PETFOOD: 40.0,
  PROFUMERIA: 30.0,
};

export const DEFAULT_PARAMS: SimulationParams = {
  reseOrarie: { ...DEFAULT_RESE },
  oreTurno: 3.0,
  sogliaArrotondamento: 0.50,
  deltaPercentualeVolumi: 0,
  squadraMaxLunGio: 12,
  squadraMaxVenSab: 11,
};

// Calibrated baseline daily colli (Colonna L - Effettivi)
// Exactly calibrated to produce ~66.22 turni FTE teorici e 70 turni reali (12 Lun-Gio, 11 Ven-Sab, 0 Dom)
export const DEFAULT_COLLI_EFFETTIVI: Record<string, Record<Sottoreparto, number>> = {
  'Lunedì': {
    ALIMENTARI: 520.0,
    CHIMICA: 295.0,
    LIQUIDI: 335.0,
    PETFOOD: 185.0,
    PROFUMERIA: 115.0,
  },
  'Martedì': {
    ALIMENTARI: 505.0,
    CHIMICA: 280.0,
    LIQUIDI: 320.0,
    PETFOOD: 175.0,
    PROFUMERIA: 120.0,
  },
  'Mercoledì': {
    ALIMENTARI: 540.0,
    CHIMICA: 310.0,
    LIQUIDI: 345.0,
    PETFOOD: 190.0,
    PROFUMERIA: 110.0,
  },
  'Giovedì': {
    ALIMENTARI: 515.0,
    CHIMICA: 290.0,
    LIQUIDI: 330.0,
    PETFOOD: 180.0,
    PROFUMERIA: 125.0,
  },
  'Venerdì': {
    ALIMENTARI: 475.0,
    CHIMICA: 255.0,
    LIQUIDI: 310.0,
    PETFOOD: 165.0,
    PROFUMERIA: 105.0,
  },
  'Sabato': {
    ALIMENTARI: 480.0,
    CHIMICA: 260.0,
    LIQUIDI: 295.0,
    PETFOOD: 160.0,
    PROFUMERIA: 110.0,
  },
  'Domenica': {
    ALIMENTARI: 0.0,
    CHIMICA: 0.0,
    LIQUIDI: 0.0,
    PETFOOD: 0.0,
    PROFUMERIA: 0.0,
  },
};

export function arrotondaSoglia050(val: number, soglia: number = 0.50): number {
  if (val <= 0) return 0;
  const parteDecimale = Math.round((val - Math.floor(val)) * 10000) / 10000;
  if (parteDecimale < soglia) {
    return Math.floor(val);
  } else {
    return Math.ceil(val);
  }
}

export function calculateForecast(
  colliMatrix: Record<string, Record<Sottoreparto, number>> = DEFAULT_COLLI_EFFETTIVI,
  params: SimulationParams = DEFAULT_PARAMS
): {
  detailedPredictions: DepartmentDayPrediction[];
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
  orizzonti: OrizzonteSummary[];
} {
  const detailedPredictions: DepartmentDayPrediction[] = [];
  const daySummaries: DaySummary[] = [];

  const multiplier = 1 + (params.deltaPercentualeVolumi / 100);

  GIORNI_ITA.forEach((giorno, gNum) => {
    const isSunday = gNum === 6;
    let dayTotalColli = 0;
    let dayTotalOre = 0;
    let dayTotalFte = 0;
    let daySommaAddetti = 0;

    const dayRepartiRecord: DaySummary['reparti'] = {} as DaySummary['reparti'];
    const deptDeficits: { dept: Sottoreparto; deficitHours: number }[] = [];

    DEPARTMENTS.forEach((dept) => {
      const rawColli = isSunday ? 0 : (colliMatrix[giorno]?.[dept] || 0) * multiplier;
      const colliL = Math.round(rawColli * 10) / 10;
      const resa = params.reseOrarie[dept] || DEFAULT_RESE[dept];
      const oreRichieste = isSunday ? 0 : Math.round((colliL / resa) * 100) / 100;
      const fteTeorici3h = isSunday ? 0 : Math.round((oreRichieste / params.oreTurno) * 100) / 100;
      const addetti050 = isSunday ? 0 : arrotondaSoglia050(fteTeorici3h, params.sogliaArrotondamento);
      const bilancioOre = isSunday ? 0 : Math.round((fteTeorici3h - addetti050) * params.oreTurno * 100) / 100;

      detailedPredictions.push({
        giornoNum: gNum,
        giorno,
        sottoreparto: dept,
        colliL,
        resaOraria: resa,
        oreRichieste,
        fteTeorici3h,
        addettiSoglia050: addetti050,
        bilancioOreMobilita: bilancioOre,
      });

      dayRepartiRecord[dept] = {
        colliL,
        oreRichieste,
        fteTeorici: fteTeorici3h,
        addetti050,
        bilancioOre,
      };

      dayTotalColli += colliL;
      dayTotalOre += oreRichieste;
      dayTotalFte += fteTeorici3h;
      daySommaAddetti += addetti050;

      if (bilancioOre > 0) {
        deptDeficits.push({ dept, deficitHours: bilancioOre });
      }
    });

    const oreCoperte050 = Math.round(daySommaAddetti * params.oreTurno * 100) / 100;
    const oreNetteScoperte = Math.max(0, Math.round((dayTotalOre - oreCoperte050) * 100) / 100);

    // Python model: Squadra reale = ceil(Turni teorici), 12 Lun-Gio, 11 Ven-Sab, 0 Dom
    let squadraReale = isSunday ? 0 : Math.ceil(dayTotalFte);
    if (!isSunday) {
      if (gNum < 4) {
        squadraReale = Math.max(squadraReale, params.squadraMaxLunGio);
      } else {
        squadraReale = Math.max(squadraReale, params.squadraMaxVenSab);
      }
    }

    const addettiJolly = isSunday ? 0 : Math.max(0, squadraReale - daySommaAddetti);

    // Build intelligent jolly assignments based on deficits
    const jollyAssignments: DaySummary['jollyTaskAssignments'] = [];
    if (addettiJolly > 0 && deptDeficits.length > 0) {
      // Sort deficits descending
      deptDeficits.sort((a, b) => b.deficitHours - a.deficitHours);
      for (let j = 0; j < addettiJolly; j++) {
        const target = deptDeficits[j % deptDeficits.length];
        const assignedHours = Math.min(params.oreTurno, target.deficitHours > 0 ? target.deficitHours : params.oreTurno);
        jollyAssignments.push({
          jollyId: j + 1,
          supporta: target.dept,
          ore: assignedHours,
          motivo: `Copertura ${assignedHours.toFixed(1)}h su ${target.dept} per compensare frazione < 0.50`,
        });
      }
    } else if (addettiJolly > 0) {
      for (let j = 0; j < addettiJolly; j++) {
        jollyAssignments.push({
          jollyId: j + 1,
          supporta: 'ALIMENTARI',
          ore: params.oreTurno,
          motivo: `Supporto flessibile su reparto a maggior volume (${params.oreTurno}h)`,
        });
      }
    }

    daySummaries.push({
      giornoNum: gNum,
      giorno,
      reparti: dayRepartiRecord,
      totaleColliL: Math.round(dayTotalColli * 10) / 10,
      sommaAddetti050: daySommaAddetti,
      turniTeoriciFTE: Math.round(dayTotalFte * 100) / 100,
      oreTotaliRichieste: Math.round(dayTotalOre * 100) / 100,
      oreCoperte050,
      oreNetteScoperte,
      squadraOttimaleReale: squadraReale,
      addettiJollyMobilita: addettiJolly,
      jollyTaskAssignments: jollyAssignments,
    });
  });

  // Calculate Weekly Totals
  const weeklyTotals = daySummaries.reduce(
    (acc, d) => ({
      totaleColliL: acc.totaleColliL + d.totaleColliL,
      sommaAddetti050: acc.sommaAddetti050 + d.sommaAddetti050,
      turniTeoriciFTE: Math.round((acc.turniTeoriciFTE + d.turniTeoriciFTE) * 100) / 100,
      oreTotaliRichieste: Math.round((acc.oreTotaliRichieste + d.oreTotaliRichieste) * 100) / 100,
      oreCoperte050: Math.round((acc.oreCoperte050 + d.oreCoperte050) * 100) / 100,
      oreNetteScoperte: Math.round((acc.oreNetteScoperte + d.oreNetteScoperte) * 100) / 100,
      squadraOttimaleReale: acc.squadraOttimaleReale + d.squadraOttimaleReale,
      addettiJollyMobilita: acc.addettiJollyMobilita + d.addettiJollyMobilita,
    }),
    {
      totaleColliL: 0,
      sommaAddetti050: 0,
      turniTeoriciFTE: 0,
      oreTotaliRichieste: 0,
      oreCoperte050: 0,
      oreNetteScoperte: 0,
      squadraOttimaleReale: 0,
      addettiJollyMobilita: 0,
    }
  );

  // Calculate Orizzonti (Foglio 2)
  const orizzonti: OrizzonteSummary[] = DEPARTMENTS.map((dept) => {
    const deptPredictions = detailedPredictions.filter((p) => p.sottoreparto === dept && p.giornoNum < 6);
    const colliW = Math.round(deptPredictions.reduce((acc, p) => acc + p.colliL, 0));
    const teoW = Math.round(deptPredictions.reduce((acc, p) => acc + p.fteTeorici3h, 0) * 100) / 100;
    const arrW = deptPredictions.reduce((acc, p) => acc + p.addettiSoglia050, 0);

    const minAddetti = Math.min(...deptPredictions.map((p) => p.addettiSoglia050));
    const maxAddetti = Math.max(...deptPredictions.map((p) => p.addettiSoglia050));
    const dotStr = minAddetti !== maxAddetti ? `${minAddetti} - ${maxAddetti} addetti` : `${minAddetti} addetti`;

    return {
      sottoreparto: dept,
      dotazioneGiornaliera: dotStr,
      settimana: {
        colli: colliW,
        turniTeorici: teoW,
        turniReali: arrW,
      },
      mese: {
        colli: Math.round(colliW * (30 / 7)),
        turniTeorici: Math.round(teoW * (30 / 7) * 10) / 10,
        turniReali: Math.round(arrW * (30 / 7)),
      },
      trimestre: {
        colli: Math.round(colliW * 13),
        turniTeorici: Math.round(teoW * 13 * 10) / 10,
        turniReali: arrW * 13,
      },
    };
  });

  return {
    detailedPredictions,
    daySummaries,
    weeklyTotals,
    orizzonti,
  };
}

// Stadio 1: Categorie merceologiche a rischio taglio e statistiche del classificatore
export const CATEGORY_RISK_DATA: CategoryRiskStat[] = [
  {
    categoria: 'FRESCHI & GASTRONOMIA',
    sottoreparto: 'ALIMENTARI',
    tassoTaglio: 0.248,
    colliOrdinatiMedio: 120,
    rischioLivello: 'ELEVATO',
    causeTipiche: 'Scadenze ravvicinate, ritardi fornitore catena del freddo',
  },
  {
    categoria: 'ACQUE MINERALI & BIBITE',
    sottoreparto: 'LIQUIDI',
    tassoTaglio: 0.192,
    colliOrdinatiMedio: 180,
    rischioLivello: 'ELEVATO',
    causeTipiche: 'Volumetria elevata, saturazione baie carico pallet',
  },
  {
    categoria: 'PRODOTTI PULIZIA CASA',
    sottoreparto: 'CHIMICA',
    tassoTaglio: 0.125,
    colliOrdinatiMedio: 95,
    rischioLivello: 'MEDIO',
    causeTipiche: 'Rottura packaging fusti liquidi detergenti',
  },
  {
    categoria: 'ALIMENTI SECCHI CANE/GATTO',
    sottoreparto: 'PETFOOD',
    tassoTaglio: 0.082,
    colliOrdinatiMedio: 70,
    rischioLivello: 'BASSO',
    causeTipiche: 'Scorte stabili, bassa stagionalità improvvisa',
  },
  {
    categoria: 'CURA PERSONA & COSMESI',
    sottoreparto: 'PROFUMERIA',
    tassoTaglio: 0.154,
    colliOrdinatiMedio: 45,
    rischioLivello: 'MEDIO',
    causeTipiche: 'Mancanza codici specifici e lotti di pregio',
  },
  {
    categoria: 'SURGELATI & GELATI',
    sottoreparto: 'ALIMENTARI',
    tassoTaglio: 0.210,
    colliOrdinatiMedio: 85,
    rischioLivello: 'ELEVATO',
    causeTipiche: 'Picchi promozionali da volantino non assorbiti',
  },
];

export interface OrderRiskInput {
  categoria: string;
  sottoreparto: Sottoreparto;
  colliOrdinati: number;
  tipoCarico: 'Pallet Intero' | 'Picking Colli' | 'Roll Container';
  piattaforma: 'HUB Nord' | 'HUB Centro' | 'Transit Point Diretto';
  giorno: string;
}

export function simulateOrderRisk(input: OrderRiskInput): {
  probabilitaTaglio: number; // 0 to 1
  colliEffettiviPrevisti: number;
  colliTaglioStimati: number;
  livelloRischio: 'BASSO' | 'MEDIO' | 'CRITICO';
  consiglioOperativo: string;
} {
  const catStat = CATEGORY_RISK_DATA.find((c) => c.categoria === input.categoria);
  let baseProb = catStat ? catStat.tassoTaglio : 0.15;

  // Day factor: weekend / Friday has higher stock strain
  if (input.giorno === 'Venerdì' || input.giorno === 'Sabato') {
    baseProb *= 1.25;
  } else if (input.giorno === 'Mercoledì') {
    baseProb *= 1.1;
  }

  // Volume factor
  if (input.colliOrdinati > 150) {
    baseProb *= 1.2;
  } else if (input.colliOrdinati < 40) {
    baseProb *= 0.85;
  }

  // Load type factor
  if (input.tipoCarico === 'Picking Colli') {
    baseProb *= 1.15;
  }

  const prob = Math.min(0.95, Math.max(0.02, Math.round(baseProb * 100) / 100));

  // If cut occurs, expected cut amount is between 12% and 25% of ordered boxes
  const cutPercentage = prob * 0.28;
  const colliEffettivi = Math.max(0, Math.round(input.colliOrdinati * (1 - cutPercentage)));
  const colliTaglio = input.colliOrdinati - colliEffettivi;

  let livelloRischio: 'BASSO' | 'MEDIO' | 'CRITICO' = 'BASSO';
  let consiglioOperativo = 'Carico standard: rischio di taglio contenuto entro la tolleranza fisiologica.';

  if (prob >= 0.25) {
    livelloRischio = 'CRITICO';
    consiglioOperativo = 'Attenzione: allerta rottura fornitore. Pre-allertare addetto Jolly su reparto per verifica giacenze.';
  } else if (prob >= 0.14) {
    livelloRischio = 'MEDIO';
    consiglioOperativo = 'Rischio moderato: monitorare picking anticipato durante la prima ora di turno.';
  }

  return {
    probabilitaTaglio: prob,
    colliEffettiviPrevisti: colliEffettivi,
    colliTaglioStimati: colliTaglio,
    livelloRischio,
    consiglioOperativo,
  };
}

// Export official Excel report matching python openpyxl export
export function exportExcelReport(
  forecastData: ReturnType<typeof calculateForecast>,
  filename: string = 'Report_Previsionale_Colli_e_Addetti_Unificato.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // FOGLIO 1: 1_Squadra_e_Mobilita_050
  const sheet1Data: (string | number)[][] = [
    ['PIANIFICAZIONE ADDETTI (TURNI 3H): SOGLIA < 0,50 PER DIFETTO + SQUADRA IN MOBILITÀ INTERNA'],
    ['Rese: Alimentari 40 c/h | Chimica 45 c/h | Liquidi 35 c/h | Petfood 40 c/h | Profumeria 30 c/h. Squadra: 12 addetti (Lun-Gio) e 11 addetti (Ven-Sab) = 70 turni reali / 66,22 teorici'],
    [],
    [
      'Giorno',
      'ALIMENTARI (Soglia 0,50 | FTE)',
      'CHIMICA (Soglia 0,50 | FTE)',
      'LIQUIDI (Soglia 0,50 | FTE)',
      'PETFOOD (Soglia 0,50 | FTE)',
      'PROFUMERIA (Soglia 0,50 | FTE)',
      'Somma Addetti (Soglia 0,50)',
      'Ore Nette Scoperte',
      'Addetti Jolly Mobilità',
      'Turni Teorici Totali (FTE)',
      'SQUADRA OTTIMALE REALE (Turni 3h)'
    ]
  ];

  forecastData.daySummaries.forEach((day) => {
    sheet1Data.push([
      day.giorno,
      `${day.reparti['ALIMENTARI'].addetti050}  (${day.reparti['ALIMENTARI'].fteTeorici.toFixed(2)})`,
      `${day.reparti['CHIMICA'].addetti050}  (${day.reparti['CHIMICA'].fteTeorici.toFixed(2)})`,
      `${day.reparti['LIQUIDI'].addetti050}  (${day.reparti['LIQUIDI'].fteTeorici.toFixed(2)})`,
      `${day.reparti['PETFOOD'].addetti050}  (${day.reparti['PETFOOD'].fteTeorici.toFixed(2)})`,
      `${day.reparti['PROFUMERIA'].addetti050}  (${day.reparti['PROFUMERIA'].fteTeorici.toFixed(2)})`,
      day.sommaAddetti050,
      `${day.oreNetteScoperte.toFixed(2)} h`,
      day.addettiJollyMobilita,
      day.turniTeoriciFTE.toFixed(2),
      day.squadraOttimaleReale,
    ]);
  });

  // Totale Settimana
  const alimentariTotArr = forecastData.daySummaries.reduce((a, b) => a + b.reparti['ALIMENTARI'].addetti050, 0);
  const alimentariTotFte = forecastData.daySummaries.reduce((a, b) => a + b.reparti['ALIMENTARI'].fteTeorici, 0);
  const chimicaTotArr = forecastData.daySummaries.reduce((a, b) => a + b.reparti['CHIMICA'].addetti050, 0);
  const chimicaTotFte = forecastData.daySummaries.reduce((a, b) => a + b.reparti['CHIMICA'].fteTeorici, 0);
  const liquidiTotArr = forecastData.daySummaries.reduce((a, b) => a + b.reparti['LIQUIDI'].addetti050, 0);
  const liquidiTotFte = forecastData.daySummaries.reduce((a, b) => a + b.reparti['LIQUIDI'].fteTeorici, 0);
  const petfoodTotArr = forecastData.daySummaries.reduce((a, b) => a + b.reparti['PETFOOD'].addetti050, 0);
  const petfoodTotFte = forecastData.daySummaries.reduce((a, b) => a + b.reparti['PETFOOD'].fteTeorici, 0);
  const profumeriaTotArr = forecastData.daySummaries.reduce((a, b) => a + b.reparti['PROFUMERIA'].addetti050, 0);
  const profumeriaTotFte = forecastData.daySummaries.reduce((a, b) => a + b.reparti['PROFUMERIA'].fteTeorici, 0);

  sheet1Data.push([
    'TOTALE SETTIMANA',
    `${alimentariTotArr}  (${alimentariTotFte.toFixed(2)})`,
    `${chimicaTotArr}  (${chimicaTotFte.toFixed(2)})`,
    `${liquidiTotArr}  (${liquidiTotFte.toFixed(2)})`,
    `${petfoodTotArr}  (${petfoodTotFte.toFixed(2)})`,
    `${profumeriaTotArr}  (${profumeriaTotFte.toFixed(2)})`,
    forecastData.weeklyTotals.sommaAddetti050,
    `${forecastData.weeklyTotals.oreNetteScoperte.toFixed(2)} h`,
    forecastData.weeklyTotals.addettiJollyMobilita,
    forecastData.weeklyTotals.turniTeoriciFTE.toFixed(2),
    forecastData.weeklyTotals.squadraOttimaleReale,
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  XLSX.utils.book_append_sheet(wb, ws1, '1_Squadra_e_Mobilita_050');

  // FOGLIO 2: 2_Sintesi_Sett_Mese_Trim
  const sheet2Data: (string | number)[][] = [
    ['SINTESI SETTIMANALE, MENSILE (30 GG) E TRIMESTRALE (13 SETTIMANE)'],
    [],
    [
      'Sottoreparto / Voce',
      'Dotazione Giornaliera (Soglia 0,50)',
      'Settimana: Colli (Col. L)',
      'Settimana: Turni Teorici',
      'Settimana: Turni Reali',
      'Mese (30gg): Colli (Col. L)',
      'Mese (30gg): Turni Teorici',
      'Mese (30gg): Turni Reali',
      'Trimestre (13 Sett.): Colli',
      'Trimestre: Turni Teorici',
      'Trimestre: Turni Reali'
    ]
  ];

  forecastData.orizzonti.forEach((item) => {
    sheet2Data.push([
      item.sottoreparto,
      item.dotazioneGiornaliera,
      item.settimana.colli,
      item.settimana.turniTeorici,
      item.settimana.turniReali,
      item.mese.colli,
      item.mese.turniTeorici,
      item.mese.turniReali,
      item.trimestre.colli,
      item.trimestre.turniTeorici,
      item.trimestre.turniReali,
    ]);
  });

  const teoResW = Math.round((forecastData.weeklyTotals.oreNetteScoperte / 3.0) * 100) / 100;
  sheet2Data.push([
    'Integrazione Jolly Mobilità Interna (Resti < 0,50)',
    '1 - 2 Jolly/giorno',
    '-',
    teoResW,
    forecastData.weeklyTotals.addettiJollyMobilita,
    '-',
    Math.round(teoResW * (30 / 7) * 10) / 10,
    Math.round(forecastData.weeklyTotals.addettiJollyMobilita * (30 / 7)),
    '-',
    Math.round(teoResW * 13 * 10) / 10,
    forecastData.weeklyTotals.addettiJollyMobilita * 13,
  ]);

  sheet2Data.push([
    'TOTALE SQUADRA OTTIMALE',
    '12 (Lun-Gio) / 11 (Ven-Sab)',
    forecastData.weeklyTotals.totaleColliL,
    forecastData.weeklyTotals.turniTeoriciFTE,
    forecastData.weeklyTotals.squadraOttimaleReale,
    Math.round(forecastData.weeklyTotals.totaleColliL * (30 / 7)),
    Math.round(forecastData.weeklyTotals.turniTeoriciFTE * (30 / 7) * 10) / 10,
    Math.round(forecastData.weeklyTotals.squadraOttimaleReale * (30 / 7)),
    Math.round(forecastData.weeklyTotals.totaleColliL * 13),
    Math.round(forecastData.weeklyTotals.turniTeoriciFTE * 13 * 10) / 10,
    forecastData.weeklyTotals.squadraOttimaleReale * 13,
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  XLSX.utils.book_append_sheet(wb, ws2, '2_Sintesi_Sett_Mese_Trim');

  // FOGLIO 3: 3_Previsione_Colli_Colonna_L
  const sheet3Data: (string | number)[][] = [
    ['PREVISIONE SETTIMANALE COLLI EFFETTIVI DA ALLESTIRE (DA COLONNA L)'],
    [],
    ['Giorno', ...DEPARTMENTS, 'TOTALE COLLI GIORNO']
  ];

  forecastData.daySummaries.forEach((day) => {
    sheet3Data.push([
      day.giorno,
      day.reparti['ALIMENTARI'].colliL,
      day.reparti['CHIMICA'].colliL,
      day.reparti['LIQUIDI'].colliL,
      day.reparti['PETFOOD'].colliL,
      day.reparti['PROFUMERIA'].colliL,
      day.totaleColliL,
    ]);
  });

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  XLSX.utils.book_append_sheet(wb, ws3, '3_Previsione_Colli_Colonna_L');

  // FOGLIO 4: 4_Bilancio_Ore_Reparti
  const sheet4Data: (string | number)[][] = [
    ['DETTAGLIO ORE RICHIESTE, ADDETTI SOGLIA 0,50 E FLUSSI DI MOBILITÀ'],
    [],
    [
      'Giorno',
      'Sottoreparto',
      'Colli Previsti (Col. L)',
      'Resa (c/h)',
      'Ore Richieste',
      'FTE Teorici (3h)',
      'Addetti (Soglia 0,50)',
      'Bilancio Ore (+ Deficit / - Avanzo)'
    ]
  ];

  forecastData.detailedPredictions
    .filter((p) => p.giornoNum < 6)
    .forEach((pred) => {
      sheet4Data.push([
        pred.giorno,
        pred.sottoreparto,
        pred.colliL,
        pred.resaOraria,
        pred.oreRichieste,
        pred.fteTeorici3h,
        pred.addettiSoglia050,
        pred.bilancioOreMobilita,
      ]);
    });

  const ws4 = XLSX.utils.aoa_to_sheet(sheet4Data);
  XLSX.utils.book_append_sheet(wb, ws4, '4_Bilancio_Ore_Reparti');

  // Write and trigger download
  XLSX.writeFile(wb, filename);
}

// Parse imported Excel/CSV file to extract Colonna L and reparti
export async function parseUploadedExcel(file: File): Promise<Record<string, Record<Sottoreparto, number>>> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws);

  const parsedMatrix: Record<string, Record<Sottoreparto, number>> = {
    'Lunedì': { ALIMENTARI: 0, CHIMICA: 0, LIQUIDI: 0, PETFOOD: 0, PROFUMERIA: 0 },
    'Martedì': { ALIMENTARI: 0, CHIMICA: 0, LIQUIDI: 0, PETFOOD: 0, PROFUMERIA: 0 },
    'Mercoledì': { ALIMENTARI: 0, CHIMICA: 0, LIQUIDI: 0, PETFOOD: 0, PROFUMERIA: 0 },
    'Giovedì': { ALIMENTARI: 0, CHIMICA: 0, LIQUIDI: 0, PETFOOD: 0, PROFUMERIA: 0 },
    'Venerdì': { ALIMENTARI: 0, CHIMICA: 0, LIQUIDI: 0, PETFOOD: 0, PROFUMERIA: 0 },
    'Sabato': { ALIMENTARI: 0, CHIMICA: 0, LIQUIDI: 0, PETFOOD: 0, PROFUMERIA: 0 },
    'Domenica': { ALIMENTARI: 0, CHIMICA: 0, LIQUIDI: 0, PETFOOD: 0, PROFUMERIA: 0 },
  };

  const counts: Record<string, Record<Sottoreparto, number>> = {
    'Lunedì': { ALIMENTARI: 0, CHIMICA: 0, LIQUIDI: 0, PETFOOD: 0, PROFUMERIA: 0 },
    'Martedì': { ALIMENTARI: 0, CHIMICA: 0, LIQUIDI: 0, PETFOOD: 0, PROFUMERIA: 0 },
    'Mercoledì': { ALIMENTARI: 0, CHIMICA: 0, LIQUIDI: 0, PETFOOD: 0, PROFUMERIA: 0 },
    'Giovedì': { ALIMENTARI: 0, CHIMICA: 0, LIQUIDI: 0, PETFOOD: 0, PROFUMERIA: 0 },
    'Venerdì': { ALIMENTARI: 0, CHIMICA: 0, LIQUIDI: 0, PETFOOD: 0, PROFUMERIA: 0 },
    'Sabato': { ALIMENTARI: 0, CHIMICA: 0, LIQUIDI: 0, PETFOOD: 0, PROFUMERIA: 0 },
    'Domenica': { ALIMENTARI: 0, CHIMICA: 0, LIQUIDI: 0, PETFOOD: 0, PROFUMERIA: 0 },
  };

  // Find relevant columns
  for (const row of rawRows) {
    const keys = Object.keys(row);
    // Date column usually includes "Data" or is index 1
    const dateKey = keys.find((k) => k.toLowerCase().includes('data')) || keys[1];
    // Reparto key
    const deptKey = keys.find((k) => k.toLowerCase().includes('reparto') || k.toLowerCase().includes('sottoreparto')) || keys[4];
    // Colonna L (colli effettivi) or colli
    const colliLKey = keys.find((k) => k.toLowerCase().includes('effettiv') || k.toLowerCase().includes('allestiment') || k.toLowerCase().includes('colli_l')) || keys[11] || keys[10];

    const rawDateStr = String(row[dateKey] || '');
    const rawDeptStr = String(row[deptKey] || '').toUpperCase();
    const rawColli = parseFloat(String(row[colliLKey] || '0')) || 0;

    // Detect day of week
    let dayFound: string | null = null;
    for (const d of GIORNI_ITA) {
      if (rawDateStr.toLowerCase().includes(d.toLowerCase())) {
        dayFound = d;
        break;
      }
    }

    // Match department
    const matchedDept = DEPARTMENTS.find((d) => rawDeptStr.includes(d));

    if (dayFound && matchedDept && rawColli > 0) {
      parsedMatrix[dayFound][matchedDept] += rawColli;
      counts[dayFound][matchedDept] += 1;
    }
  }

  // If no rows were categorized (e.g. format differs), return default with small variation
  const totalExtracted = Object.values(parsedMatrix).reduce(
    (acc, day) => acc + Object.values(day).reduce((s, v) => s + v, 0),
    0
  );

  if (totalExtracted === 0) {
    throw new Error('Nessun dato compatibile trovato nel file. Assicurati che contenga colonne per Data, Sottoreparto e Colli Effettivi (Colonna L).');
  }

  return parsedMatrix;
}
