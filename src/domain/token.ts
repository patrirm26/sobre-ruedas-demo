/**
 * KRT-STD: libre uso (pagar, transferir, convertir a Bs).
 * KRT-REW: cashback, solo sirve para pagar — no transferible ni convertible a Bs.
 * KRT-CRD: destino de desembolsos de crédito en tokens.
 * KRT-COL: colateral bloqueado como garantía — no transferible mientras esté bloqueado.
 */
export type KrtSubBalance = 'STD' | 'REW' | 'CRD' | 'COL';

export type KrtLedgerEntryType = 'mint' | 'burn' | 'transfer' | 'lock' | 'unlock';

export interface KrtBalances {
  STD: number;
  REW: number;
  CRD: number;
  COL: number;
}

export interface KrtLedgerMove {
  accountId: string;
  subBalance: KrtSubBalance;
  deltaCents: number; // puede ser negativo
  resultingBalanceCents: number;
}

/**
 * Movimiento de doble entrada: mint/burn solo afectan `to`/`from` respectivamente
 * (la otra punta es la reserva, no una cuenta); transfer/lock/unlock afectan ambas.
 */
export interface KrtLedgerEntry {
  id: string;
  at: string;
  type: KrtLedgerEntryType;
  from: KrtLedgerMove | null;
  to: KrtLedgerMove | null;
  relatedEntityId?: string; // ej. installmentPlanId en lock/unlock de colateral
  reason: string;
}

export interface ReserveProof {
  totalMintedCents: number;
  totalBackingCents: number;
  ratioPct: number;
  asOf: string;
}
