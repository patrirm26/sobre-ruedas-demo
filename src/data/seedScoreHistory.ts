/** Evolución del score en los últimos 6 meses, para el gráfico de
 * "Score Crediticio" — no existe un historial real de snapshots (el store
 * solo guarda el snapshot ACTUAL por cuenta, ver `userSlice.scoreSnapshots`),
 * así que esta serie es data de demo fija, [AJUSTAR] con el mismo criterio
 * que el resto de valores ilustrativos del proyecto. El último punto de
 * cada serie coincide con `SEED_SCORE_SNAPSHOTS[accountId].value`
 * (seedUsers.ts) para que el gráfico y el gauge cuenten la misma historia. */
export interface ScoreHistoryPoint {
  label: string;
  value: number;
}

const LABELS = ['Hace 5 meses', 'Hace 4 meses', 'Hace 3 meses', 'Hace 2 meses', 'Hace 1 mes', 'Actual'];

function series(values: number[]): ScoreHistoryPoint[] {
  return values.map((value, i) => ({ label: LABELS[i], value }));
}

export const SEED_SCORE_HISTORY: Record<string, ScoreHistoryPoint[]> = {
  'account-maria': series([42, 46, 50, 52, 56, 60]),
  'account-diego': series([38, 35, 33, 31, 30, 29]),
  'account-carlos': series([40, 43, 45, 47, 49, 50]),
  'account-elavila': series([48, 52, 55, 58, 60, 62]),
};
