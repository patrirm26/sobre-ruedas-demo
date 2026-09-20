import { useKoraStore } from '../../state/store';
import { getScoreBand } from '../../data/scoreBands';
import { generateId } from '../../lib/ids';
import type { ScoreService, ScoreEvent } from '../scoreService';
import { simulateLatency } from '../delay';

/** Ajuste de valuePct por factor según el evento — determinístico, no aleatorio,
 * para que la demo sea explicable y reproducible. */
const FACTOR_DELTAS: Record<ScoreEvent, Partial<Record<string, number>>> = {
  payment_on_time: { historialPagos: 3, usoCupo: 2 },
  payment_late: { historialPagos: -8, usoCupo: -3 },
  default: { historialPagos: -20, diversificacion: -5 },
  new_credit_opened: { diversificacion: 5, usoCupo: -5 },
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export const mockScoreService: ScoreService = {
  async recalculate(accountId, event) {
    await simulateLatency(150, 400);
    const state = useKoraStore.getState();
    const current = state.scoreSnapshots[accountId];
    if (!current) throw new Error(`No hay snapshot de score para la cuenta ${accountId}`);

    const deltas = FACTOR_DELTAS[event];
    const factors = current.factors.map((f) =>
      deltas[f.key] !== undefined ? { ...f, valuePct: clamp(f.valuePct + deltas[f.key]!) } : f
    );
    const value = Math.round(factors.reduce((sum, f) => sum + f.weight * f.valuePct, 0));

    const snapshot = {
      id: generateId('score'),
      accountId,
      at: state.simulatedNowIso,
      value,
      band: getScoreBand(value),
      factors,
    };

    state.setScoreSnapshot(snapshot);
    return snapshot;
  },
};
