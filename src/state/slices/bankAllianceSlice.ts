import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { AllyBank, LinkedBankAccount } from '../../domain/bankAlliance';
import { SEED_ALLY_BANKS } from '../../data/seedAllyBanks';

export interface BankAllianceSlice {
  allyBanks: AllyBank[];
  linkedBankAccounts: LinkedBankAccount[];
  addLinkedBankAccount: (account: LinkedBankAccount) => void;
}

export const createBankAllianceSlice: StateCreator<StoreState, [], [], BankAllianceSlice> = (set) => ({
  allyBanks: SEED_ALLY_BANKS,
  linkedBankAccounts: [],

  addLinkedBankAccount: (account) => set((state) => ({ linkedBankAccounts: [...state.linkedBankAccounts, account] })),
});
