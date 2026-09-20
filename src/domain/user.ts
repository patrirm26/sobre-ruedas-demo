export type AccountType = 'persona' | 'empresa' | 'operador';
export type KycLevel = 0 | 1 | 2 | 3;

export interface BusinessProfile {
  razonSocial: string;
  rif: string;
  representanteLegal: string;
}

export interface User {
  id: string;
  createdAt: string;
  name: string;
  accountType: AccountType;
  kycLevel: KycLevel;
  /** Cuenta principal de este usuario en el sandbox (1:1 por ahora).
   * Ausente para `accountType: 'operador'` — un operador de Back Office
   * no tiene billetera personal. */
  primaryAccountId?: string;
  /** Solo poblado para `accountType: 'empresa'` — datos de KYB capturados
   * en el registro (Sprint 4 — gate empresarial). */
  businessProfile?: BusinessProfile;
}

export interface Account {
  id: string;
  userId: string;
  /** Etiqueta corta para UI, ej. "Cuenta personal", "Comercial El Ávila C.A." */
  label: string;
  balanceVesCents: number;
  balanceUsdCents: number;
  /** Cupo total y usado de crédito/BNPL — dinámico: se descuenta al usar, se libera al pagar. */
  creditLimitTotalCents: number;
  creditLimitUsedCents: number;
}
