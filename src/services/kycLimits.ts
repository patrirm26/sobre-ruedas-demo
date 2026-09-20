/** [AJUSTAR] Límites ilustrativos por nivel de verificación (KYC) — no son
 * límites regulatorios reales. `krtMonthly` es lo que puede convertirse a
 * KRT-STD (mint) por mes, en USD equivalente. */
export const KYC_LIMITS: Record<number, { daily: number; monthly: number; krtMonthly: number }> = {
  0: { daily: 0, monthly: 0, krtMonthly: 0 },
  1: { daily: 50_00, monthly: 300_00, krtMonthly: 100_00 },
  2: { daily: 300_00, monthly: 1500_00, krtMonthly: 500_00 },
  3: { daily: 1000_00, monthly: 5000_00, krtMonthly: 5000_00 },
};

export interface KycThresholdResult {
  requiresVerification: boolean;
  currentLevel: number;
  limitUsdCents: number;
  usedUsdCents: number;
  remainingUsdCents: number;
}

/** Umbral de KYC/AML simulado: compara lo ya emitido (mint) en la ventana
 * móvil de 30 días + lo que se está pidiendo ahora, contra el límite mensual
 * del nivel de verificación del usuario. Simula la pantalla de "verificación
 * adicional requerida" que dispararía un monto sospechoso en un producto real. */
export function checkMintThreshold(
  kycLevel: number,
  usedThisWindowUsdCents: number,
  additionalUsdCents: number
): KycThresholdResult {
  const limitUsdCents = KYC_LIMITS[kycLevel]?.krtMonthly ?? 0;
  const usedUsdCents = usedThisWindowUsdCents;
  const wouldUse = usedUsdCents + additionalUsdCents;
  return {
    requiresVerification: wouldUse > limitUsdCents,
    currentLevel: kycLevel,
    limitUsdCents,
    usedUsdCents,
    remainingUsdCents: Math.max(limitUsdCents - usedUsdCents, 0),
  };
}
