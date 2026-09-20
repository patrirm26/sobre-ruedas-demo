import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { VehicleInsurancePlan, VehiclePolicy } from '../../domain/vehicleInsurance';
import { SEED_VEHICLE_INSURANCE_PLANS, SEED_VEHICLE_POLICIES } from '../../data/seedVehicleInsurance';

export interface VehicleInsuranceSlice {
  vehicleInsurancePlans: VehicleInsurancePlan[];
  vehiclePolicies: VehiclePolicy[];
  addVehiclePolicy: (policy: VehiclePolicy) => void;
  updateVehiclePolicy: (id: string, patch: Partial<VehiclePolicy>) => void;
}

export const createVehicleInsuranceSlice: StateCreator<StoreState, [], [], VehicleInsuranceSlice> = (set) => ({
  vehicleInsurancePlans: SEED_VEHICLE_INSURANCE_PLANS,
  vehiclePolicies: SEED_VEHICLE_POLICIES,

  addVehiclePolicy: (policy) => set((state) => ({ vehiclePolicies: [...state.vehiclePolicies, policy] })),

  updateVehiclePolicy: (id, patch) =>
    set((state) => ({
      vehiclePolicies: state.vehiclePolicies.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),
});
