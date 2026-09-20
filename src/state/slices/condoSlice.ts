import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { CondoUnit } from '../../domain/consorcio';
import { SEED_CONDO_UNITS } from '../../data/seedCondoUnits';

export interface CondoSlice {
  condoUnits: CondoUnit[];
  setCondoUnitsForNewPeriod: (accountId: string, feeCents: number) => void;
  markCondoUnitPaid: (unitId: string, paidAt: string, paymentMethod: string) => void;
}

export const createCondoSlice: StateCreator<StoreState, [], [], CondoSlice> = (set) => ({
  condoUnits: SEED_CONDO_UNITS,

  setCondoUnitsForNewPeriod: (accountId, feeCents) =>
    set((state) => ({
      condoUnits: state.condoUnits.map((u) =>
        u.accountId === accountId
          ? { ...u, feeCents, status: 'pendiente' as const, paidAt: undefined, paymentMethod: undefined }
          : u
      ),
    })),

  markCondoUnitPaid: (unitId, paidAt, paymentMethod) =>
    set((state) => ({
      condoUnits: state.condoUnits.map((u) => (u.id === unitId ? { ...u, status: 'pagado' as const, paidAt, paymentMethod } : u)),
    })),
});
