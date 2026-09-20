import type { OnboardingService } from '../onboardingService';

const NOT_IMPLEMENTED =
  'Not implemented: onboardingService requiere verificación real de negocio (RIF ante el SENIAT, due diligence comercial) — ver PRODUCTION_CHECKLIST.md.';

export const realOnboardingService: OnboardingService = {
  async submitMerchantRequest() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async resolveMerchantRequest() {
    throw new Error(NOT_IMPLEMENTED);
  },
};
