import type { KrtLedgerEntry, ReserveProof } from '../domain/token';
import { isRealBackendEnabled } from './env';
import { mockTokenService } from './mocks/tokenService.mock';
import { realTokenService } from './real/tokenService.real';

export interface MintInput {
  accountId: string;
  vesAmountCents: number;
}

export interface BurnInput {
  accountId: string;
  krtAmountCents: number;
}

export interface TransferInput {
  fromAccountId: string;
  toAccountId: string;
  krtAmountCents: number;
}

export interface TokenService {
  /** Compra KRT-STD con Bs — 1:1 al BCV menos comisión de conversión (1%).
   * Dispara verificación KYC si el monto excede el límite mensual del nivel. */
  mint(input: MintInput): Promise<KrtLedgerEntry>;
  /** Convierte KRT-STD de vuelta a Bs — único sub-saldo convertible. */
  burn(input: BurnInput): Promise<KrtLedgerEntry>;
  /** Transferencia KRT-STD entre cuentas KORA — el único sub-saldo transferible. */
  transfer(input: TransferInput): Promise<KrtLedgerEntry>;
  /** Bloquea KRT-STD como garantía (STD → COL) al 120% del monto financiado en USD. */
  lockCollateral(accountId: string, installmentPlanId: string, principalUsdCents: number): Promise<KrtLedgerEntry>;
  /** Libera una porción (o el total) del colateral bloqueado (COL → STD). */
  releaseCollateral(accountId: string, installmentPlanId: string, amountCents: number): Promise<KrtLedgerEntry>;
  /** Proof-of-reserve ilustrativo: cuánto KRT circula vs. cuánto respaldo hay detrás. */
  getReserveProof(): Promise<ReserveProof>;
}

export const tokenService: TokenService = isRealBackendEnabled() ? realTokenService : mockTokenService;
