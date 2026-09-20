import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { MerchantOnboardingRequest } from '../../domain/onboarding';
import { SEED_MERCHANT_REQUESTS } from '../../data/seedOnboarding';

export interface OnboardingSlice {
  merchantRequests: MerchantOnboardingRequest[];
  addMerchantRequest: (request: MerchantOnboardingRequest) => void;
  updateMerchantRequest: (id: string, patch: Partial<MerchantOnboardingRequest>) => void;
}

export const createOnboardingSlice: StateCreator<StoreState, [], [], OnboardingSlice> = (set) => ({
  merchantRequests: SEED_MERCHANT_REQUESTS,

  addMerchantRequest: (request) => set((state) => ({ merchantRequests: [request, ...state.merchantRequests] })),

  updateMerchantRequest: (id, patch) =>
    set((state) => ({
      merchantRequests: state.merchantRequests.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),
});
