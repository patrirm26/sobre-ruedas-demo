import type { InvestmentFundService } from '../investmentFundService';

const NOT_IMPLEMENTED =
  'Not implemented: investmentFundService requiere un aliado financiero licenciado para la administración regulada de los fondos — ver PRODUCTION_CHECKLIST.md.';

export const realInvestmentFundService: InvestmentFundService = {
  async invest() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async withdraw() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async recalculateYields() {
    throw new Error(NOT_IMPLEMENTED);
  },
};
