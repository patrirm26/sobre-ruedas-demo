import type { CreditInsurancePolicy } from '../domain/insurance';
import { computeInsurancePremiumCents } from '../services/bnplRules';

const offsetDaysIso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

/** Pólizas de los 2 planes semilla (seedUsers.ts) — creados antes de que
 * `insurancePremiumCents` existiera en InstallmentPlan, así que la prima
 * se calcula acá con el mismo principal en vez de leerla del plan. Carlos
 * (en mora) arranca con una póliza reclamable para poder demostrar el
 * flujo del Back Office sin pasos previos. */
export const SEED_INSURANCE_POLICIES: CreditInsurancePolicy[] = [
  {
    id: 'insurance-maria-1',
    installmentPlanId: 'plan-maria-1',
    accountId: 'account-maria',
    provider: 'Seguro Horizonte',
    premiumCents: computeInsurancePremiumCents(30_000),
    coverageCents: 30_000,
    status: 'active',
    startedAt: offsetDaysIso(-90),
  },
  {
    id: 'insurance-carlos-1',
    installmentPlanId: 'plan-carlos-1',
    accountId: 'account-carlos',
    provider: 'Seguro Horizonte',
    premiumCents: computeInsurancePremiumCents(25_000),
    coverageCents: 25_000,
    status: 'active',
    startedAt: offsetDaysIso(-75),
  },
];
