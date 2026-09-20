import type { AllyBank } from '../domain/bankAlliance';

/** Bancos aliados ficticios `[AJUSTAR]` — códigos de 4 dígitos con el mismo
 * criterio realista que "Banco Andino · 0199" (ya usado en CobrarView.tsx
 * para Pago Móvil), sin nombres de proveedores reales (ver README).
 * "Banco Andino" hace de banco dueño del sandbox genérico (`isOwnBank`) —
 * cada sandbox de banco real (Banfanb, Banco Exterior...) reemplaza esa
 * marca por su propio nombre; los demás quedan como bancos externos
 * válidos para Pago Móvil (interbancario por diseño). */
export const SEED_ALLY_BANKS: AllyBank[] = [
  {
    id: 'bank-andino',
    name: 'Banco Andino',
    code: '0199',
    services: ['Pago Móvil', 'Transferencias', 'Custodia de saldo'],
    isOwnBank: true,
  },
  {
    id: 'bank-litoral',
    name: 'Banco Litoral',
    code: '0133',
    services: ['Pago Móvil', 'Transferencias'],
  },
  {
    id: 'bank-cordillera',
    name: 'Banco Cordillera',
    code: '0155',
    services: ['Transferencias', 'Custodia de saldo'],
  },
  {
    id: 'bank-caribe-digital',
    name: 'Banco Caribe Digital',
    code: '0188',
    services: ['Pago Móvil', 'Transferencias', 'Custodia de saldo'],
  },
];
