export type InsurancePolicyStatus = 'active' | 'claimed';

/** Seguro de desgravamen — cubre el saldo pendiente de un plan de cuotas
 * si el cliente fallece o cae en un caso de no pago calificado, para que
 * el banco no tenga que asumir esa deuda. Automático en todo crédito/cuota
 * (no es un producto que el cliente prenda o apague), su prima ya está
 * sumada a `InstallmentPlan.feeTotalCents` — acá queda desglosada para
 * mostrarla y para poder reclamarla desde el Back Office. */
export interface CreditInsurancePolicy {
  id: string;
  installmentPlanId: string;
  accountId: string;
  /** Aseguradora aliada — ilustrativo, [AJUSTAR] cuando haya un aliado real firmado. */
  provider: string;
  premiumCents: number;
  /** = principalCents del plan al momento de crearlo. */
  coverageCents: number;
  status: InsurancePolicyStatus;
  startedAt: string;
  claimedAt?: string;
}
