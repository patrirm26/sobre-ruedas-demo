/** Catálogo de reglas visibles del underwriting — nunca una aprobación/rechazo
 * ciego. Cada código explica qué pesó en la decisión. */
export const REASON_CODE_LABELS: Record<string, string> = {
  score_suficiente: 'Tu score cumple el mínimo requerido para este monto.',
  cupo_ok: 'Tienes cupo disponible suficiente.',
  score_bajo: 'Tu score está por debajo del mínimo requerido (35).',
  cupo_insuficiente: 'No tienes cupo disponible suficiente para este monto.',
  monto_parcial: 'Se aprobó un monto menor al solicitado, según tu score y tu cupo disponible.',
  score_limita_monto: 'Tu score permite un monto menor al solicitado.',
  cupo_limita_monto: 'Tu cupo disponible permite un monto menor al solicitado.',
  mora_activa: 'Tienes una cuota en mora — ponte al día para solicitar crédito nuevo.',
  factura_dentro_de_politica: 'El monto y el plazo de la factura están dentro de la política de riesgo.',
  monto_excede_maximo: 'El monto de la factura excede el máximo financiable por operación.',
  plazo_excede_maximo: 'El plazo hasta el vencimiento excede el máximo aceptado (90 días).',
  factura_vencida: 'La factura ya está vencida — no se puede anticipar.',
  revision_manual: 'Tu solicitud quedó en revisión manual — el banco te responde pronto.',
};

export function describeReasonCode(code: string): string {
  return REASON_CODE_LABELS[code] ?? code;
}
