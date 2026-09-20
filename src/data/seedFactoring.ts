import type { Invoice } from '../domain/factoring';

const offsetDaysIso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

/** Facturas ilustrativas `[AJUSTAR]` sobre comercios ya semilla — cross-
 * referencias con Marketplace y Consorcio para que la demo se sienta
 * conectada. Una queda deliberadamente fuera de política (monto > $50.000)
 * para poder mostrar el rechazo sin que el usuario tenga que armarlo a mano. */
export const SEED_INVOICES: Invoice[] = [
  {
    id: 'invoice-tecnoplaza-1',
    merchantId: 'merchant-tecnoplaza',
    debtorName: 'Distribuidora Andina',
    amountCents: 320_000,
    issuedAt: offsetDaysIso(-5),
    dueDate: offsetDaysIso(25),
    status: 'pendiente',
  },
  {
    id: 'invoice-construexpress-1',
    merchantId: 'merchant-construexpress',
    debtorName: 'Condominio Res. Altamira',
    amountCents: 90_000,
    issuedAt: offsetDaysIso(-2),
    dueDate: offsetDaysIso(40),
    status: 'pendiente',
  },
  {
    id: 'invoice-hogarfacil-1',
    merchantId: 'merchant-hogarfacil',
    debtorName: 'Distribuidora del Centro',
    amountCents: 6_000_000,
    issuedAt: offsetDaysIso(-1),
    dueDate: offsetDaysIso(20),
    status: 'pendiente',
  },
  {
    id: 'invoice-elavila-1',
    merchantId: 'merchant-elavila',
    debtorName: 'Suministros del Ávila C.A.',
    amountCents: 180_000,
    issuedAt: offsetDaysIso(-4),
    dueDate: offsetDaysIso(30),
    status: 'pendiente',
  },
];
