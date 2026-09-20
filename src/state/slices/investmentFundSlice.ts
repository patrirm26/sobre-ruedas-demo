import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { InvestmentFund, FundPosition } from '../../domain/investmentFund';
import { SEED_INVESTMENT_FUNDS, SEED_FUND_POSITIONS } from '../../data/seedInvestmentFunds';

export interface InvestmentFundSlice {
  funds: InvestmentFund[];
  fundPositions: FundPosition[];
  addFundPosition: (position: FundPosition) => void;
  updateFundPosition: (id: string, patch: Partial<FundPosition>) => void;
}

export const createInvestmentFundSlice: StateCreator<StoreState, [], [], InvestmentFundSlice> = (set) => ({
  funds: SEED_INVESTMENT_FUNDS,
  fundPositions: SEED_FUND_POSITIONS,

  addFundPosition: (position) => set((state) => ({ fundPositions: [...state.fundPositions, position] })),

  updateFundPosition: (id, patch) =>
    set((state) => ({
      fundPositions: state.fundPositions.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),
});
