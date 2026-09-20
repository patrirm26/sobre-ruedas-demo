import type { FactoringService } from '../factoringService';

const NOT_IMPLEMENTED =
  'Not implemented: factoringService requiere un aliado financiero licenciado para el fondeo de las operaciones — ver PRODUCTION_CHECKLIST.md.';

export const realFactoringService: FactoringService = {
  async submitInvoice() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async requestAdvance() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async recalculateCollections() {
    throw new Error(NOT_IMPLEMENTED);
  },
};
