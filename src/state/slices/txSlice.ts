import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { Transaction } from '../../domain/transaction';
import { SEED_TRANSACTIONS } from '../../data/seedTransactions';
import { SEED_CREDIT_TRANSACTIONS } from '../../data/seedUsers';

export interface TxSlice {
  transactions: Transaction[];
  pushTransaction: (tx: Transaction) => void;
  /** Reemplaza el historial entero por el del backend real (Sprint 10 —
   * hidratación) — a diferencia de `pushTransaction`, no mergea. */
  hydrateTransactions: (transactions: Transaction[]) => void;
}

const seedTransactionsSorted = [...SEED_TRANSACTIONS, ...SEED_CREDIT_TRANSACTIONS].sort(
  (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
);

export const createTxSlice: StateCreator<StoreState, [], [], TxSlice> = (set) => ({
  transactions: seedTransactionsSorted,

  pushTransaction: (tx) => set((state) => ({ transactions: [tx, ...state.transactions] })),

  hydrateTransactions: (transactions) => set({ transactions }),
});
