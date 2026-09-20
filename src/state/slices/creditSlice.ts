import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { BnplRequest, InstallmentPlan } from '../../domain/credit';
import { SEED_BNPL_REQUESTS, SEED_INSTALLMENT_PLANS } from '../../data/seedUsers';
import { keyBy } from '../../lib/collections';

export interface CreditSlice {
  bnplRequests: Record<string, BnplRequest>;
  installmentPlans: Record<string, InstallmentPlan>;
  addBnplRequest: (req: BnplRequest) => void;
  updateBnplRequest: (id: string, updater: (req: BnplRequest) => BnplRequest) => void;
  addInstallmentPlan: (plan: InstallmentPlan) => void;
  updateInstallmentPlan: (planId: string, updater: (plan: InstallmentPlan) => InstallmentPlan) => void;
  /** Reemplaza los planes de cuotas por los del backend real (Sprint 10 —
   * hidratación) — no toca `bnplRequests`, que hoy no se lee de vuelta. */
  hydrateInstallmentPlans: (plans: InstallmentPlan[]) => void;
}

export const createCreditSlice: StateCreator<StoreState, [], [], CreditSlice> = (set) => ({
  bnplRequests: keyBy(SEED_BNPL_REQUESTS),
  installmentPlans: keyBy(SEED_INSTALLMENT_PLANS),

  addBnplRequest: (req) => set((state) => ({ bnplRequests: { ...state.bnplRequests, [req.id]: req } })),

  updateBnplRequest: (id, updater) =>
    set((state) => {
      const req = state.bnplRequests[id];
      if (!req) return state;
      return { bnplRequests: { ...state.bnplRequests, [id]: updater(req) } };
    }),

  addInstallmentPlan: (plan) =>
    set((state) => ({ installmentPlans: { ...state.installmentPlans, [plan.id]: plan } })),

  updateInstallmentPlan: (planId, updater) =>
    set((state) => {
      const plan = state.installmentPlans[planId];
      if (!plan) return state;
      return { installmentPlans: { ...state.installmentPlans, [planId]: updater(plan) } };
    }),

  hydrateInstallmentPlans: (plans) => set({ installmentPlans: keyBy(plans) }),
});
