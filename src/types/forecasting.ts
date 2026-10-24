export type Sottoreparto = 'ALIMENTARI' | 'CHIMICA' | 'LIQUIDI' | 'PETFOOD' | 'PROFUMERIA';

export interface ReseOrarie {
  ALIMENTARI: number;
  CHIMICA: number;
  LIQUIDI: number;
  PETFOOD: number;
  PROFUMERIA: number;
}

export interface DepartmentDayPrediction {
  giornoNum: number;
  giorno: string;
  sottoreparto: Sottoreparto;
  colliL: number;
  resaOraria: number;
  oreRichieste: number;
  fteTeorici3h: number;
  addettiSoglia050: number;
  bilancioOreMobilita: number; // positive = deficit (hours uncovered), negative = surplus (spare hours)
}

export interface DaySummary {
  giornoNum: number;
  giorno: string;
  reparti: Record<Sottoreparto, {
    colliL: number;
    oreRichieste: number;
    fteTeorici: number;
    addetti050: number;
    bilancioOre: number;
  }>;
  totaleColliL: number;
  sommaAddetti050: number;
  turniTeoriciFTE: number;
  oreTotaliRichieste: number;
  oreCoperte050: number;
  oreNetteScoperte: number;
  squadraOttimaleReale: number;
  addettiJollyMobilita: number;
  jollyTaskAssignments: Array<{
    jollyId: number;
    supporta: Sottoreparto;
    ore: number;
    motivo: string;
  }>;
}

export interface OrizzonteSummary {
  sottoreparto: string;
  dotazioneGiornaliera: string;
  settimana: {
    colli: number;
    turniTeorici: number;
    turniReali: number;
  };
  mese: {
    colli: number;
    turniTeorici: number;
    turniReali: number;
  };
  trimestre: {
    colli: number;
    turniTeorici: number;
    turniReali: number;
  };
}

export interface CategoryRiskStat {
  categoria: string;
  sottoreparto: Sottoreparto;
  tassoTaglio: number; // e.g. 0.18 = 18%
  colliOrdinatiMedio: number;
  rischioLivello: 'BASSO' | 'MEDIO' | 'ELEVATO';
  causeTipiche: string;
}

export interface SimulationParams {
  reseOrarie: ReseOrarie;
  oreTurno: number;
  sogliaArrotondamento: number; // default 0.50
  deltaPercentualeVolumi: number; // e.g. +10% promo
  squadraMaxLunGio: number; // default 12
  squadraMaxVenSab: number; // default 11
}
