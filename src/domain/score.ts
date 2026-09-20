export type ScoreBand = 'BAJO' | 'MEDIO' | 'BUENO' | 'MUY_BUENO' | 'EXCELENTE';

export interface ScoreFactor {
  key: string;
  label: string;
  /** Peso declarado de este factor en el cálculo, 0–1. La suma de todos los factores de un snapshot debe ser 1. */
  weight: number;
  /** Qué tan bien está el usuario en este factor puntualmente, 0–100. */
  valuePct: number;
}

export interface ScoreSnapshot {
  id: string;
  accountId: string;
  at: string;
  value: number; // 0-100
  band: ScoreBand;
  factors: ScoreFactor[];
}
