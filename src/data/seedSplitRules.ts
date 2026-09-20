import type { SplitRule } from '../domain/splitPayout';

/** [AJUSTAR] Porcentajes ilustrativos — mismo criterio que bnplRules.ts. */
export const SEED_SPLIT_RULES: SplitRule[] = [
  {
    id: 'rule-marketplace-standard',
    name: 'Reparto estándar Tienda',
    appliesTo: 'marketplace',
    description: 'Se aplica a toda compra pagada con saldo o puntos en la Tienda.',
    beneficiaries: [
      { role: 'merchant', label: 'Comercio', pct: 92 },
      { role: 'platform', label: 'KORA (plataforma)', pct: 5 },
      { role: 'ally', label: 'Aliado logístico', pct: 3 },
    ],
  },
];
