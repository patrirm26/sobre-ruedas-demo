import type { Card } from '../domain/card';

const offsetDaysIso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

/** Tarjeta ilustrativa `[AJUSTAR]` de María, para que la sección Cards del
 * Back Office tenga algo real que congelar/cancelar — antes arrancaba sin
 * ninguna tarjeta emitida en todo el sandbox. */
export const SEED_CARDS: Card[] = [
  {
    id: 'card-maria-1',
    accountId: 'account-maria',
    last4: '4821',
    expiryMonth: 11,
    expiryYear: 2029,
    status: 'activa',
    dailyLimitCents: 20_000,
    issuedAt: offsetDaysIso(-25),
    cvv: '742', // [AJUSTAR] ilustrativo, mismo criterio que last4
  },
];
