import type { BnplTier } from '../domain/bnplTier';

/** [AJUSTAR] Niveles BNPL estilo Cashea (Fase 1 §6.1) — cada uno define cupo
 * máximo, % de inicial requerida y cuotas disponibles. El piso de score 35
 * es el mismo que ya usaba `getScoreCapCents` para "cupo 0" antes de este
 * sprint — no cambia quién queda afuera, solo agrega granularidad arriba de
 * ese piso en vez de los 3 tramos anteriores. */
export const BNPL_TIERS: BnplTier[] = [
  { level: 1, name: 'Nivel 1', minScore: 35, capCents: 100_00, initialPct: 30, installmentsAvailable: [2] },
  { level: 2, name: 'Nivel 2', minScore: 45, capCents: 250_00, initialPct: 25, installmentsAvailable: [3] },
  { level: 3, name: 'Nivel 3', minScore: 55, capCents: 500_00, initialPct: 20, installmentsAvailable: [3, 4] },
  { level: 4, name: 'Nivel 4', minScore: 65, capCents: 900_00, initialPct: 15, installmentsAvailable: [3, 4, 6] },
  { level: 5, name: 'Nivel 5', minScore: 75, capCents: 1_500_00, initialPct: 10, installmentsAvailable: [3, 4, 6, 9] },
  { level: 6, name: 'Nivel 6', minScore: 85, capCents: 2_500_00, initialPct: 0, installmentsAvailable: [3, 4, 6, 9, 12] },
];

/** 0 = todavía no elegible para KORA Cuotas (score < 35). */
export function computeLevelFromScore(score: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  const tier = [...BNPL_TIERS].reverse().find((t) => score >= t.minScore);
  return tier ? tier.level : 0;
}

export function getTierByLevel(level: number): BnplTier | undefined {
  return BNPL_TIERS.find((t) => t.level === level);
}

/** Nivel siguiente al actual, o undefined si ya está en el nivel máximo. */
export function getNextTier(level: number): BnplTier | undefined {
  return BNPL_TIERS.find((t) => t.level === level + 1);
}
