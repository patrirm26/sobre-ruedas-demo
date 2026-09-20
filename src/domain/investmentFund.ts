export type FundRiskLevel = 'bajo' | 'moderado' | 'alto';

export interface InvestmentFund {
  id: string;
  name: string;
  description: string;
  riskLevel: FundRiskLevel;
  /** Nominal anual, interés simple — `[AJUSTAR]` tasa ilustrativa. */
  annualYieldPct: number;
  minInvestmentCents: number;
  /** Siempre en USD — se evita VES/KRT para no complicar el cálculo de rendimiento. */
  currency: 'USD';
}

export interface FundPosition {
  id: string;
  accountId: string;
  fundId: string;
  principalCents: number;
  accruedYieldCents: number;
  openedAt: string;
  /** Checkpoint hasta dónde ya se acumuló rendimiento — no "última vez que el usuario miró". */
  lastAccrualAt: string;
}
