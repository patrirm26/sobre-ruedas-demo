import type { Invoice, AdvanceRequest } from '../domain/factoring';
import { isRealBackendEnabled } from './env';
import { mockFactoringService } from './mocks/factoringService.mock';
import { realFactoringService } from './real/factoringService.real';

export interface SubmitInvoiceInput {
  merchantId: string;
  debtorName: string;
  amountCents: number;
  daysToDue: number;
}

export interface FactoringService {
  submitInvoice(input: SubmitInvoiceInput): Promise<Invoice>;
  requestAdvance(invoiceId: string): Promise<AdvanceRequest>;
  /** Liquida (marca 'cobrada' + acredita el remanente) toda factura
   * 'anticipada' cuyo dueDate ya pasó contra el reloj simulado — se llama
   * desde SimulationPanel igual que bnplService.recalculateStatuses(). */
  recalculateCollections(): Promise<void>;
}

export const factoringService: FactoringService = isRealBackendEnabled() ? realFactoringService : mockFactoringService;
