/** [AJUSTAR] Nivel mínimo de verificación para emitir una tarjeta KORA —
 * mismo criterio que MIN_KYC_LEVEL_TO_LINK/MIN_KYC_LEVEL_TO_INVEST. */
export const MIN_KYC_LEVEL_TO_ISSUE_CARD = 1;

export function generateLast4(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function generateCvv(): string {
  return String(Math.floor(100 + Math.random() * 900));
}
