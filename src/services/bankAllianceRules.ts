/** Validaciones de negocio puras para Alianzas Bancarias — mismo criterio
 * `[AJUSTAR]` que bnplRules.ts/factoringRules.ts: los formatos son reales
 * (prefijos de operadora venezolanos, cédula/RIF, 20 dígitos de cuenta),
 * pero el nivel mínimo de KYC exigido es ilustrativo. */

/** [AJUSTAR] Prefijos reales de operadoras móviles venezolanas. */
export const VALID_PHONE_PREFIXES = ['0412', '0414', '0416', '0424', '0426'];
export const ACCOUNT_NUMBER_LENGTH = 20;
/** [AJUSTAR] Nivel mínimo de verificación para vincular un banco externo. */
export const MIN_KYC_LEVEL_TO_LINK = 1;

const ID_DOC_PATTERN = /^[VEJG]-\d{1,3}(\.\d{3})*(-\d)?$/;

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  const prefix = digits.slice(0, 4);
  return VALID_PHONE_PREFIXES.includes(prefix);
}

export function isValidIdDoc(idDoc: string): boolean {
  return ID_DOC_PATTERN.test(idDoc.trim());
}

export function isValidAccountNumber(accountNumber: string, bankCode: string): boolean {
  const digits = accountNumber.replace(/\D/g, '');
  if (digits.length !== ACCOUNT_NUMBER_LENGTH) return false;
  return digits.startsWith(bankCode);
}
