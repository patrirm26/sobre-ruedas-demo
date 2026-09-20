import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { LoyaltyChannel, LoyaltyRate } from '../../domain/loyalty';
import { SEED_LOYALTY_RATES } from '../../data/seedLoyaltyRates';

export interface LoyaltySlice {
  loyaltyRates: LoyaltyRate[];
  updateLoyaltyRate: (channel: LoyaltyChannel, cashbackPct: number) => void;
}

export const createLoyaltySlice: StateCreator<StoreState, [], [], LoyaltySlice> = (set) => ({
  loyaltyRates: SEED_LOYALTY_RATES,

  updateLoyaltyRate: (channel, cashbackPct) =>
    set((state) => ({
      loyaltyRates: state.loyaltyRates.map((r) => (r.channel === channel ? { ...r, cashbackPct } : r)),
    })),
});
