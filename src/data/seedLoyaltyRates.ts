import type { LoyaltyRate } from '../domain/loyalty';

/** Valores iniciales = los que ya estaban hardcodeados en cada servicio antes
 * de centralizarlos acá — el comportamiento no cambia al arrancar, solo se
 * vuelve editable desde el Back Office (Loyalty). `[AJUSTAR]` ilustrativos,
 * mismo criterio que el resto de tasas del proyecto. */
export const SEED_LOYALTY_RATES: LoyaltyRate[] = [
  {
    channel: 'qr',
    label: 'Cobro por QR',
    description: 'Cashback al cobrar un pago por código QR.',
    cashbackPct: 0.5,
  },
  {
    channel: 'remesa',
    label: 'Remesa enviada',
    description: 'Cashback al enviar una remesa internacional.',
    cashbackPct: 0.3,
  },
  {
    channel: 'govtech',
    label: 'Pago al Estado',
    description: 'Cashback al pagar una obligación de GovTech, de contado o financiada con KORA Cuotas.',
    cashbackPct: 1,
  },
  {
    channel: 'cuotas',
    label: 'Cuota de KORA Cuotas pagada a tiempo',
    description: 'Cashback al pagar una cuota de un plan BNPL sin atraso.',
    cashbackPct: 0.2,
  },
  {
    channel: 'tarjeta',
    label: 'Compra con Tarjeta KORA',
    description: 'Cashback al comprar con la tarjeta KORA.',
    cashbackPct: 0.5,
  },
];
