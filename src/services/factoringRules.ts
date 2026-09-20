/** Reglas de negocio puras del motor de Factoring — sin acceso al store,
 * mismo criterio que bnplRules.ts. Los umbrales están marcados [AJUSTAR]
 * donde el brief no especificó un valor exacto y se escogió uno
 * ilustrativo razonable. */

/** [AJUSTAR] Monto máximo financiable por factura. */
export const MAX_INVOICE_CENTS = 50_000_00;
/** [AJUSTAR] Plazo máximo aceptado entre hoy y el vencimiento. */
export const MAX_DAYS_TO_DUE = 90;
/** [AJUSTAR] % de la factura que se adelanta al aprobar. */
export const ADVANCE_RATE_PCT = 85;

/** [AJUSTAR] Comisión de descuento por tramo de plazo — a mayor plazo, mayor riesgo. */
export function getDiscountFeePct(daysToDue: number): number {
  if (daysToDue <= 30) return 2;
  if (daysToDue <= 60) return 3;
  return 4;
}

export interface InvoiceEvaluation {
  approved: boolean;
  reasonCodes: string[];
}

export function evaluateInvoice(amountCents: number, daysToDue: number): InvoiceEvaluation {
  const reasonCodes: string[] = [];
  if (daysToDue <= 0) reasonCodes.push('factura_vencida');
  if (daysToDue > MAX_DAYS_TO_DUE) reasonCodes.push('plazo_excede_maximo');
  if (amountCents > MAX_INVOICE_CENTS) reasonCodes.push('monto_excede_maximo');

  const approved = reasonCodes.length === 0;
  if (approved) reasonCodes.push('factura_dentro_de_politica');
  return { approved, reasonCodes };
}
