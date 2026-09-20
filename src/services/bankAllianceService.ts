import type { LinkedBankAccount, BankAccountType } from '../domain/bankAlliance';
import { isBankGatewayEnabled } from './env';
import { mockBankAllianceService } from './mocks/bankAllianceService.mock';
import { realBankAllianceService } from './real/bankAllianceService.real';

export interface LinkBankAccountInput {
  accountId: string;
  bankId: string;
  accountType: BankAccountType;
  accountNumber: string;
  holderIdDoc: string;
  holderName: string;
  phone: string;
  /** Código y nombre del banco — el mock los ignora (ya los resuelve de
   * `allyBanks` localmente); el real los necesita porque no hay catálogo de
   * bancos del lado servidor (ver supabase/functions/_shared/bankAllianceEngine.ts). */
  bankCode?: string;
  bankName?: string;
}

export interface MobilePaymentInput {
  linkedAccountId: string;
  amountCents: number;
  currency: 'USD' | 'VES';
}

export interface BankTransferInput {
  linkedAccountId: string;
  amountCents: number;
  currency: 'USD' | 'VES';
}

export interface BankAllianceService {
  linkBankAccount(input: LinkBankAccountInput): Promise<LinkedBankAccount>;
  /** Fondea el saldo KORA simulando un Pago Móvil entrante desde el banco vinculado. */
  depositViaMobilePayment(input: MobilePaymentInput): Promise<{ referenceCode: string }>;
  /** Retira saldo KORA hacia la cuenta bancaria vinculada, vía transferencia. */
  withdrawViaBankTransfer(input: BankTransferInput): Promise<void>;
}

export const bankAllianceService: BankAllianceService = isBankGatewayEnabled() ? realBankAllianceService : mockBankAllianceService;
