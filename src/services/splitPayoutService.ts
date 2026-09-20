import type { SplitPayout, SplitRule, SplitBeneficiary, SplitSource } from '../domain/splitPayout';
import { isRealBackendEnabled } from './env';
import { mockSplitPayoutService } from './mocks/splitPayoutService.mock';
import { realSplitPayoutService } from './real/splitPayoutService.real';

export interface RecordSplitInput {
  source: SplitSource;
  sourceLabel: string;
  relatedEntityId: string;
  totalCents: number;
  /** Solo la necesita el modo real (resolver tenant/autorización) — el
   * registro real de Marketplace hoy pasa inline por
   * marketplaceEngine.ts, no por este método (ver splitPayoutService.real.ts). */
  accountId?: string;
}

export interface SplitPayoutService {
  /** Calcula y registra el reparto de una transacción según la regla activa
   * para `source` — no mueve saldo, es un ledger paralelo puramente
   * informativo (el dinero ya se movió antes, vía marketplaceService). */
  recordSplit(input: RecordSplitInput): Promise<SplitPayout>;
  /** Reglas de reparto del propio tenant (Decisioning). */
  listRules(): Promise<SplitRule[]>;
  /** La vista valida que `beneficiaries` sume 100 antes de llamar esto —
   * el real además lo re-valida server-side. */
  updateRule(ruleId: string, beneficiaries: SplitBeneficiary[]): Promise<SplitRule>;
  /** Historial de repartos ya registrados del propio tenant. */
  listPayouts(): Promise<SplitPayout[]>;
}

export const splitPayoutService: SplitPayoutService = isRealBackendEnabled() ? realSplitPayoutService : mockSplitPayoutService;
