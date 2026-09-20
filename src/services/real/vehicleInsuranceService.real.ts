import type { VehicleInsuranceService } from '../vehicleInsuranceService';

const NOT_IMPLEMENTED =
  'Not implemented: vehicleInsuranceService requiere una aseguradora aliada real (emisión de póliza, cobro de prima) — ver PRODUCTION_CHECKLIST.md.';

export const realVehicleInsuranceService: VehicleInsuranceService = {
  async issueTermPolicy() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async togglePayPerUse() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async cancelPolicy() {
    throw new Error(NOT_IMPLEMENTED);
  },
};
