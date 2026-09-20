import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { CreditInsurancePolicy } from '../../domain/insurance';
import { SEED_INSURANCE_POLICIES } from '../../data/seedInsurancePolicies';
import { keyBy } from '../../lib/collections';

export interface InsuranceSlice {
  insurancePolicies: Record<string, CreditInsurancePolicy>;
  addInsurancePolicy: (policy: CreditInsurancePolicy) => void;
  updateInsurancePolicy: (id: string, updater: (policy: CreditInsurancePolicy) => CreditInsurancePolicy) => void;
}

export const createInsuranceSlice: StateCreator<StoreState, [], [], InsuranceSlice> = (set) => ({
  insurancePolicies: keyBy(SEED_INSURANCE_POLICIES),

  addInsurancePolicy: (policy) => set((state) => ({ insurancePolicies: { ...state.insurancePolicies, [policy.id]: policy } })),

  updateInsurancePolicy: (id, updater) =>
    set((state) => {
      const policy = state.insurancePolicies[id];
      if (!policy) return state;
      return { insurancePolicies: { ...state.insurancePolicies, [id]: updater(policy) } };
    }),
});
