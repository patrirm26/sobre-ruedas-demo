import type { Merchant } from '../domain/marketplace';

/** IDs `merchant-tecnoplaza` y `merchant-hogarfacil` se mantienen (no
 * renombrados) a propósito: `seedUsers.ts` los resuelve por id con
 * `SEED_MERCHANTS.find(...)!` para el historial de compras semilla de
 * María y Carlos — cambiar el id rompería esa referencia. Solo se
 * repotencia `name`/`category` al rubro de Sobre Ruedas.
 * `merchant-elavila` y `merchant-construexpress` tampoco se tocan: los usa
 * Factoring (`seedFactoring.ts`), fuera de alcance de este rebrand. */
export const SEED_MERCHANTS: Merchant[] = [
  { id: 'merchant-tecnoplaza', name: 'AutoNuevo Caracas', category: 'Vehículos Nuevos', bnplMerchantFeePct: 3.5 },
  {
    id: 'merchant-hogarfacil',
    name: 'Usados Plaza',
    category: 'Vehículos Usados',
    bnplMerchantFeePct: 4.5,
    taxId: 'J-31022874-6',
  },
  { id: 'merchant-particular', name: 'Venta Particular', category: 'Vehículos Usados', bnplMerchantFeePct: 5 },
  { id: 'merchant-motoworld', name: 'MotoWorld', category: 'Motos', bnplMerchantFeePct: 4 },
  { id: 'merchant-bicicentro', name: 'BiciCentro', category: 'Bicicletas', bnplMerchantFeePct: 3 },
  { id: 'merchant-autorepuestosjc', name: 'Auto Repuestos JC', category: 'Repuestos', bnplMerchantFeePct: 4 },
  { id: 'merchant-construexpress', name: 'ConstruExpress', category: 'Servicios', bnplMerchantFeePct: 3.5 },
  {
    id: 'merchant-elavila',
    name: 'Comercial El Ávila C.A.',
    category: 'Servicios',
    bnplMerchantFeePct: 4,
    taxId: 'J-40312589-4',
    ownerUserId: 'user-elavila',
  },
];
