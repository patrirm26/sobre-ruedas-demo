import type { Transaction } from '../../domain/transaction';
import type { PaymentService } from '../paymentService';
import { invokeEdgeFunction } from '../../lib/invokeEdgeFunction';

const OBLIGATIONS_NOT_IMPLEMENTED =
  'Not implemented: pagar una obligación de GovTech requiere una tabla `obligations` real (hoy las deudas solo viven en el estado del cliente) — ver PRODUCTION_CHECKLIST.md.';

export const realPaymentService: PaymentService = {
  sendPayment(input): Promise<Transaction> {
    return invokeEdgeFunction<Transaction>('payment-send', input);
  },
  receivePayment(input): Promise<Transaction> {
    return invokeEdgeFunction<Transaction>('payment-receive', input);
  },
  sendRemesa(input): Promise<Transaction> {
    return invokeEdgeFunction<Transaction>('payment-send-remesa', input);
  },
  async payObligation() {
    throw new Error(OBLIGATIONS_NOT_IMPLEMENTED);
  },
  async payObligationWithBnplDisbursement() {
    throw new Error(OBLIGATIONS_NOT_IMPLEMENTED);
  },
};
