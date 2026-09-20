import type { CondoService } from '../condoService';

const NOT_IMPLEMENTED =
  'Not implemented: condoService requiere integración con el sistema de cobranza del condominio — ver PRODUCTION_CHECKLIST.md.';

export const realCondoService: CondoService = {
  async loadMonthlyFees() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async markUnitPaid() {
    throw new Error(NOT_IMPLEMENTED);
  },
};
