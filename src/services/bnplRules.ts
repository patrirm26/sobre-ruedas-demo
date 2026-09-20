import type { Installment, InstallmentStatus } from '../domain/credit';
import { computeLevelFromScore, getTierByLevel } from '../data/bnplTiers';

/** Reglas de negocio puras del motor de BNPL — sin acceso al store, fáciles
 * de razonar y de ajustar. Los umbrales están marcados [AJUSTAR] donde el
 * brief no especificó un valor exacto y se escogió uno ilustrativo razonable. */

/** Tope de monto aprobable según el nivel BNPL del usuario (Sprint 3 —
 * ver src/data/bnplTiers.ts). Mismo cupo que ve el usuario en su tarjeta
 * de nivel: nunca se aprueba más de lo que su nivel promete. */
export function getScoreCapCents(score: number): number {
  const level = computeLevelFromScore(score);
  if (level === 0) return 0;
  return getTierByLevel(level)?.capCents ?? 0;
}

/** [AJUSTAR] Tasa mensual por banda de score — mismos tramos que getScoreCapCents. */
export function getRateForScore(score: number): number {
  if (score < 50) return 0.05;
  if (score < 65) return 0.04;
  return 0.03;
}

/** [AJUSTAR] Días de gracia antes de considerar una cuota vencida como mora formal. */
export const GRACE_DAYS = 7;
/** [AJUSTAR] Días en mora antes de pasar a default (bloqueo total + mayor impacto en score). */
export const DEFAULT_DAYS = 90;
/** [AJUSTAR] Recargo aplicado una sola vez al entrar en mora. */
export const LATE_FEE_PCT = 0.02;

/** [AJUSTAR] Prima del seguro de desgravamen — % del monto financiado,
 * automático en todo crédito/cuota (ver domain/insurance.ts). Un solo punto
 * de cálculo para que la simulación y la creación del plan coincidan. */
export const INSURANCE_PREMIUM_PCT = 0.004;
export function computeInsurancePremiumCents(principalCents: number): number {
  return Math.round(principalCents * INSURANCE_PREMIUM_PCT);
}

const STATUS_SEVERITY: Record<InstallmentStatus, number> = {
  al_dia: 0,
  en_gracia: 1,
  mora: 2,
  default: 3,
  pagado: -1,
};

/** Estado vivo de una cuota dado el reloj simulado — puro, no depende de qué
 * había guardado antes (el store solo cachea el resultado de esta función). */
export function computeInstallmentStatus(installment: Installment, nowIso: string): InstallmentStatus {
  if (installment.status === 'pagado') return 'pagado';
  const daysLate = (new Date(nowIso).getTime() - new Date(installment.dueDate).getTime()) / 86_400_000;
  if (daysLate < 0) return 'al_dia';
  if (daysLate < GRACE_DAYS) return 'en_gracia';
  if (daysLate < DEFAULT_DAYS) return 'mora';
  return 'default';
}

/** Estado del plan completo = el peor estado entre sus cuotas no pagadas
 * (o 'pagado' si todas lo están). */
export function deriveWorstStatus(installments: Installment[]): InstallmentStatus {
  if (installments.every((i) => i.status === 'pagado')) return 'pagado';
  return installments
    .filter((i) => i.status !== 'pagado')
    .reduce<InstallmentStatus>(
      (worst, i) => (STATUS_SEVERITY[i.status] > STATUS_SEVERITY[worst] ? i.status : worst),
      'al_dia'
    );
}
