export type SplitBeneficiaryRole = 'merchant' | 'platform' | 'ally';

/** Fuentes de transacción que hoy alimentan el motor de reparto — ver
 * decisión de alcance en el plan: solo checkout de Marketplace con
 * saldo/KRT, no BNPL (tiene su propio merchantFeeCents) ni Cobrar/Pagar/
 * Remesas (ahí el 100% del monto ya es del usuario, no hay comercio). */
export type SplitSource = 'marketplace';

export interface SplitBeneficiary {
  role: SplitBeneficiaryRole;
  label: string;
  /** Los beneficiarios de una misma regla deben sumar 100. */
  pct: number;
}

export interface SplitRule {
  id: string;
  name: string;
  appliesTo: SplitSource;
  description: string;
  beneficiaries: SplitBeneficiary[];
}

export interface SplitPayoutLeg {
  role: SplitBeneficiaryRole;
  label: string;
  pct: number;
  amountCents: number;
}

export interface SplitPayout {
  id: string;
  at: string;
  source: SplitSource;
  sourceLabel: string;
  relatedEntityId: string;
  totalCents: number;
  ruleId: string;
  ruleName: string;
  legs: SplitPayoutLeg[];
}
