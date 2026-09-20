import type { Transaction, TransactionCurrency } from '../domain/transaction';
import { isRealBackendEnabled } from './env';
import { mockPaymentService } from './mocks/paymentService.mock';
import { realPaymentService } from './real/paymentService.real';

export interface SendPaymentInput {
  accountId: string;
  /** Teléfono o alias del contacto — no es una cuenta KORA real dentro del sandbox. */
  to: string;
  amountCents: number;
  currency: TransactionCurrency;
  concept: string;
}

export type ReceivePaymentChannel = 'qr' | 'movil' | 'link';

export interface ReceivePaymentInput {
  accountId: string;
  amountCents: number;
  currency: Extract<TransactionCurrency, 'USD' | 'VES'>;
  concept: string;
  channel: ReceivePaymentChannel;
  /** Cashback KRT-REW en % del monto — solo cuando la UI ya lo promete (ej. QR). */
  cashbackPct?: number;
}

export interface SendRemesaInput {
  accountId: string;
  amountUsdCents: number;
  feePct: number;
  /** Unidades de moneda destino por USD. */
  rate: number;
  destCurrency: string;
  country: string;
  recipientName: string;
}

export interface PayObligationInput {
  accountId: string;
  obligationId: string;
}

export interface PayObligationWithBnplInput {
  accountId: string;
  obligationId: string;
  /** Plan BNPL ya creado (merchantId: null) — su principal en USD ya fue
   * desembolsado a saldo por bnplService.createPlan; este método lo consume. */
  installmentPlanId: string;
}

export interface PaymentService {
  /** Pagar a un contacto — descuenta el saldo del emisor. No existe una
   * cuenta KORA receptora real en el sandbox, así que es un movimiento
   * unidireccional (igual que el "neto al comercio" de marketplaceService). */
  sendPayment(input: SendPaymentInput): Promise<Transaction>;
  /** Cobrar — simula un pago entrante (QR, Pago Móvil) acreditando saldo. */
  receivePayment(input: ReceivePaymentInput): Promise<Transaction>;
  /** Enviar una remesa — descuenta USD del emisor a la tasa/comisión del corredor elegido. */
  sendRemesa(input: SendRemesaInput): Promise<Transaction>;
  /** Pagar una obligación de GovTech — descuenta saldo VES y la marca como pagada. */
  payObligation(input: PayObligationInput): Promise<Transaction>;
  /** Diferir una obligación de GovTech con KORA Cuotas: consume el
   * desembolso USD de un plan BNPL ya creado en vez de descontar Bs. */
  payObligationWithBnplDisbursement(input: PayObligationWithBnplInput): Promise<Transaction>;
}

export const paymentService: PaymentService = isRealBackendEnabled() ? realPaymentService : mockPaymentService;
