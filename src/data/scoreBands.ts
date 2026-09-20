import type { ScoreBand } from '../domain/score';

export interface ScoreBandInfo {
  band: ScoreBand;
  min: number;
  max: number;
  colorVar: string;
  description: string;
}

export const SCORE_BANDS: ScoreBandInfo[] = [
  { band: 'BAJO', min: 0, max: 39, colorVar: '--red', description: 'Riesgo alto, acceso muy limitado a crédito.' },
  { band: 'MEDIO', min: 40, max: 59, colorVar: '--amber', description: 'Acceso a productos básicos con cupos reducidos.' },
  { band: 'BUENO', min: 60, max: 74, colorVar: '--accent2', description: 'Buen historial, acceso a la mayoría de los productos.' },
  { band: 'MUY_BUENO', min: 75, max: 89, colorVar: '--green', description: 'Historial sólido, cupos ampliados y mejores tasas.' },
  { band: 'EXCELENTE', min: 90, max: 100, colorVar: '--green', description: 'Historial excelente, acceso a todos los productos y tasas preferenciales.' },
];

export function getScoreBand(value: number): ScoreBand {
  const found = SCORE_BANDS.find((b) => value >= b.min && value <= b.max);
  return found ? found.band : 'BAJO';
}
