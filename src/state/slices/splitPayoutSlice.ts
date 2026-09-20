import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { SplitRule, SplitBeneficiary, SplitPayout } from '../../domain/splitPayout';
import { SEED_SPLIT_RULES } from '../../data/seedSplitRules';

export interface SplitPayoutSlice {
  splitRules: SplitRule[];
  splitPayouts: SplitPayout[];
  /** La vista valida que `beneficiaries` sume 100 antes de llamar esto. */
  updateSplitRule: (ruleId: string, beneficiaries: SplitBeneficiary[]) => void;
  addSplitPayout: (payout: SplitPayout) => void;
}

export const createSplitPayoutSlice: StateCreator<StoreState, [], [], SplitPayoutSlice> = (set) => ({
  splitRules: SEED_SPLIT_RULES,
  splitPayouts: [],

  updateSplitRule: (ruleId, beneficiaries) =>
    set((state) => ({
      splitRules: state.splitRules.map((r) => (r.id === ruleId ? { ...r, beneficiaries } : r)),
    })),

  addSplitPayout: (payout) => set((state) => ({ splitPayouts: [payout, ...state.splitPayouts] })),
});
