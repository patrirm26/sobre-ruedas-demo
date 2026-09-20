import { useKoraStore } from '../../state/store';
import { generateId } from '../../lib/ids';
import type { Invoice, AdvanceRequest } from '../../domain/factoring';
import type { FactoringService, SubmitInvoiceInput } from '../factoringService';
import { simulateLatency } from '../delay';
import { evaluateInvoice, getDiscountFeePct, ADVANCE_RATE_PCT } from '../factoringRules';

export const mockFactoringService: FactoringService = {
  async submitInvoice({ merchantId, debtorName, amountCents, daysToDue }: SubmitInvoiceInput): Promise<Invoice> {
    await simulateLatency();
    const state = useKoraStore.getState();
    if (amountCents <= 0) throw new Error('El monto de la factura debe ser mayor a cero.');
    if (daysToDue <= 0) throw new Error('El plazo de vencimiento debe ser al menos 1 día.');

    const invoice: Invoice = {
      id: generateId('invoice'),
      merchantId,
      debtorName,
      amountCents,
      issuedAt: state.simulatedNowIso,
      dueDate: new Date(new Date(state.simulatedNowIso).getTime() + daysToDue * 86_400_000).toISOString(),
      status: 'pendiente',
    };
    state.addInvoice(invoice);
    return invoice;
  },

  async requestAdvance(invoiceId: string): Promise<AdvanceRequest> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const invoice = state.invoices.find((i) => i.id === invoiceId);
    if (!invoice) throw new Error('Factura no encontrada.');
    if (invoice.status !== 'pendiente') throw new Error('Esta factura ya fue procesada.');

    const daysToDue = Math.round((new Date(invoice.dueDate).getTime() - new Date(state.simulatedNowIso).getTime()) / 86_400_000);
    const { approved, reasonCodes } = evaluateInvoice(invoice.amountCents, daysToDue);
    const discountFeePct = getDiscountFeePct(daysToDue);

    let advancedNowCents = 0;
    let feeCents = 0;
    if (approved) {
      const advancedGrossCents = Math.round(invoice.amountCents * (ADVANCE_RATE_PCT / 100));
      feeCents = Math.round(invoice.amountCents * (discountFeePct / 100));
      advancedNowCents = advancedGrossCents - feeCents;
      state.adjustMerchantWallet(invoice.merchantId, advancedNowCents);
    }

    const request: AdvanceRequest = {
      id: generateId('advance'),
      invoiceId,
      merchantId: invoice.merchantId,
      at: state.simulatedNowIso,
      approved,
      reasonCodes,
      advanceRatePct: ADVANCE_RATE_PCT,
      discountFeePct,
      advancedNowCents,
      feeCents,
    };
    state.addAdvanceRequest(request);
    state.updateInvoiceStatus(invoiceId, approved ? 'anticipada' : 'rechazada', request.id);

    return request;
  },

  async recalculateCollections(): Promise<void> {
    const state = useKoraStore.getState();
    const nowMs = new Date(state.simulatedNowIso).getTime();

    for (const invoice of state.invoices) {
      if (invoice.status !== 'anticipada') continue;
      if (new Date(invoice.dueDate).getTime() > nowMs) continue;

      const request = state.advanceRequests.find((r) => r.id === invoice.advanceRequestId);
      if (!request) continue;

      const advancedGrossCents = request.advancedNowCents + request.feeCents;
      const remainderCents = invoice.amountCents - advancedGrossCents;
      if (remainderCents > 0) {
        state.adjustMerchantWallet(invoice.merchantId, remainderCents);
      }
      state.updateInvoiceStatus(invoice.id, 'cobrada');
    }
  },
};
