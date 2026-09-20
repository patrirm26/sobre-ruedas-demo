import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { ComplianceAlert, VerificationRequest } from '../../domain/compliance';
import { SEED_COMPLIANCE_ALERTS, SEED_VERIFICATION_REQUESTS } from '../../data/seedCompliance';

export interface ComplianceSlice {
  alerts: ComplianceAlert[];
  verificationRequests: VerificationRequest[];
  addAlert: (alert: ComplianceAlert) => void;
  updateAlert: (id: string, patch: Partial<ComplianceAlert>) => void;
  addVerificationRequest: (request: VerificationRequest) => void;
  updateVerificationRequest: (id: string, patch: Partial<VerificationRequest>) => void;
}

export const createComplianceSlice: StateCreator<StoreState, [], [], ComplianceSlice> = (set) => ({
  alerts: SEED_COMPLIANCE_ALERTS,
  verificationRequests: SEED_VERIFICATION_REQUESTS,

  addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),

  updateAlert: (id, patch) =>
    set((state) => ({ alerts: state.alerts.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),

  addVerificationRequest: (request) => set((state) => ({ verificationRequests: [request, ...state.verificationRequests] })),

  updateVerificationRequest: (id, patch) =>
    set((state) => ({
      verificationRequests: state.verificationRequests.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),
});
