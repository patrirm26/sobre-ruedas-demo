import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { KrtBalances, KrtLedgerEntry, KrtSubBalance } from '../../domain/token';
import { SEED_KRT_BALANCES } from '../../data/seedUsers';

const EMPTY_BALANCES: KrtBalances = { STD: 0, REW: 0, CRD: 0, COL: 0 };

export interface TokenSlice {
  /** Sub-saldos KRT (STD/REW/CRD/COL), indexados por accountId. */
  krtBalances: Record<string, KrtBalances>;
  krtLedger: KrtLedgerEntry[];
  setKrtBalances: (accountId: string, balances: KrtBalances) => void;
  /** Suma (o resta, con delta negativo) a un solo sub-saldo — usado por tokenService. */
  adjustKrtBalance: (accountId: string, subBalance: KrtSubBalance, deltaCents: number) => void;
  appendLedgerEntry: (entry: KrtLedgerEntry) => void;
  /** Reemplaza el ledger entero por el del backend real (Sprint 10 —
   * hidratación) — a diferencia de `appendLedgerEntry`, no mergea. El
   * saldo hidratado usa `setKrtBalances`, que ya existe. */
  hydrateKrtLedger: (entries: KrtLedgerEntry[]) => void;
}

export const createTokenSlice: StateCreator<StoreState, [], [], TokenSlice> = (set) => ({
  krtBalances: SEED_KRT_BALANCES,
  krtLedger: [],

  setKrtBalances: (accountId, balances) =>
    set((state) => ({ krtBalances: { ...state.krtBalances, [accountId]: balances } })),

  adjustKrtBalance: (accountId, subBalance, deltaCents) =>
    set((state) => {
      const balances = state.krtBalances[accountId] ?? EMPTY_BALANCES;
      return {
        krtBalances: {
          ...state.krtBalances,
          [accountId]: { ...balances, [subBalance]: balances[subBalance] + deltaCents },
        },
      };
    }),

  appendLedgerEntry: (entry) => set((state) => ({ krtLedger: [entry, ...state.krtLedger] })),

  hydrateKrtLedger: (entries) => set({ krtLedger: entries }),
});
