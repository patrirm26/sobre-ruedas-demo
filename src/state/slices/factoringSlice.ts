import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { Invoice, InvoiceStatus, AdvanceRequest } from '../../domain/factoring';
import { SEED_INVOICES } from '../../data/seedFactoring';
import { SEED_MERCHANTS } from '../../data/seedMerchants';

export interface FactoringSlice {
  invoices: Invoice[];
  advanceRequests: AdvanceRequest[];
  /** Tesorería propia por comercio — no es Account, no toca saldo de ningún usuario. */
  merchantWalletBalances: Record<string, number>;
  addInvoice: (invoice: Invoice) => void;
  updateInvoiceStatus: (invoiceId: string, status: InvoiceStatus, advanceRequestId?: string) => void;
  addAdvanceRequest: (request: AdvanceRequest) => void;
  adjustMerchantWallet: (merchantId: string, deltaCents: number) => void;
}

export const createFactoringSlice: StateCreator<StoreState, [], [], FactoringSlice> = (set) => ({
  invoices: SEED_INVOICES,
  advanceRequests: [],
  merchantWalletBalances: Object.fromEntries(SEED_MERCHANTS.map((m) => [m.id, 0])),

  addInvoice: (invoice) => set((state) => ({ invoices: [invoice, ...state.invoices] })),

  updateInvoiceStatus: (invoiceId, status, advanceRequestId) =>
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === invoiceId ? { ...inv, status, advanceRequestId: advanceRequestId ?? inv.advanceRequestId } : inv
      ),
    })),

  addAdvanceRequest: (request) => set((state) => ({ advanceRequests: [request, ...state.advanceRequests] })),

  adjustMerchantWallet: (merchantId, deltaCents) =>
    set((state) => ({
      merchantWalletBalances: {
        ...state.merchantWalletBalances,
        [merchantId]: (state.merchantWalletBalances[merchantId] ?? 0) + deltaCents,
      },
    })),
});
