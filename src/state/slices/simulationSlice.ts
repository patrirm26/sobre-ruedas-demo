import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';

export type SandboxEnv = 'sandbox' | 'production';
export type BcvRateSource = 'live' | 'manual' | 'fallback';
export type ForcedBnplDecision = 'auto' | 'approved' | 'rejected';

export interface SimulationSlice {
  /** Espeja services/env.ts para que la UI (banner, panel) pueda leerlo sin importar la capa de servicios. */
  env: SandboxEnv;
  /** Reloj simulado del sandbox — el panel de control lo adelanta para vencer cuotas sin esperar días reales. */
  simulatedNowIso: string;
  /** Tasa BCV: se sincroniza con la fuente oficial una vez por día real (ver
   * lib/useSyncBcvRate.ts). Este valor es solo el fallback antes de la
   * primera sincronización o si no hay conexión. */
  bcvRateVesPerUsd: number;
  bcvRateSource: BcvRateSource;
  /** Fecha que reporta la fuente oficial para esta tasa (no el reloj simulado). */
  bcvRateAsOf: string | null;
  /** Último intento de sincronización en tiempo real — para no reconsultar más de una vez por día real. */
  bcvRateFetchedAt: string | null;
  /** Override de underwriting para demos dirigidas: fuerza el resultado del
   * próximo `bnplService.evaluate()` sin tocar el score ni el cupo reales.
   * 'auto' = motor normal (Fase 3). Solo tiene efecto en el mock. */
  forcedBnplDecision: ForcedBnplDecision;
  advanceTimeDays: (days: number) => void;
  /** Override manual — panel de simulación. */
  setBcvRate: (rate: number) => void;
  setLiveBcvRate: (rate: number, asOf: string) => void;
  markBcvRateFallback: () => void;
  setForcedBnplDecision: (decision: ForcedBnplDecision) => void;
}

export const createSimulationSlice: StateCreator<StoreState, [], [], SimulationSlice> = (set) => ({
  env: 'sandbox',
  simulatedNowIso: new Date().toISOString(),
  bcvRateVesPerUsd: 585.3,
  bcvRateSource: 'fallback',
  bcvRateAsOf: null,
  bcvRateFetchedAt: null,
  forcedBnplDecision: 'auto',

  advanceTimeDays: (days) =>
    set((state) => ({
      simulatedNowIso: new Date(new Date(state.simulatedNowIso).getTime() + days * 86_400_000).toISOString(),
    })),

  setBcvRate: (rate) => set({ bcvRateVesPerUsd: rate, bcvRateSource: 'manual' }),

  setLiveBcvRate: (rate, asOf) =>
    set({
      bcvRateVesPerUsd: rate,
      bcvRateSource: 'live',
      bcvRateAsOf: asOf,
      bcvRateFetchedAt: new Date().toISOString(),
    }),

  markBcvRateFallback: () => set({ bcvRateSource: 'fallback' }),

  setForcedBnplDecision: (decision) => set({ forcedBnplDecision: decision }),
});
