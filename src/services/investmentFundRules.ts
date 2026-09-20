import type { FundPosition, InvestmentFund } from '../domain/investmentFund';

/** [AJUSTAR] Nivel mínimo de verificación para invertir en un fondo. */
export const MIN_KYC_LEVEL_TO_INVEST = 1;

const DAY_MS = 86_400_000;

/**
 * Acumula rendimiento por interés simple diario desde `position.lastAccrualAt`
 * hasta `nowIso`. Pura — no toca el store; tanto `invest`/`withdraw` (para
 * poner al día la posición antes de mutarla) como el barrido
 * `recalculateYields()` la reutilizan.
 */
export function computeAccrual(
  position: FundPosition,
  fund: InvestmentFund,
  nowIso: string
): { accruedYieldCents: number; lastAccrualAt: string } {
  const daysElapsed = (new Date(nowIso).getTime() - new Date(position.lastAccrualAt).getTime()) / DAY_MS;
  if (daysElapsed <= 0) return { accruedYieldCents: position.accruedYieldCents, lastAccrualAt: position.lastAccrualAt };

  const dailyRate = fund.annualYieldPct / 100 / 365;
  const newYieldCents = Math.round(position.principalCents * dailyRate * daysElapsed);
  return { accruedYieldCents: position.accruedYieldCents + newYieldCents, lastAccrualAt: nowIso };
}

/**
 * Descuenta un rescate primero del rendimiento acumulado y luego del
 * principal — regla determinística simple (no hay "orden de llegada" de
 * aportes que priorizar).
 */
export function withdrawFromPosition(
  position: FundPosition,
  amountCents: number
): { principalCents: number; accruedYieldCents: number } {
  const fromYield = Math.min(amountCents, position.accruedYieldCents);
  const fromPrincipal = amountCents - fromYield;
  return {
    accruedYieldCents: position.accruedYieldCents - fromYield,
    principalCents: position.principalCents - fromPrincipal,
  };
}
