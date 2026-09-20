import type { ComplianceService } from '../complianceService';

const NOT_IMPLEMENTED =
  'Not implemented: complianceService requiere un caso de compliance/AML licenciado y auditable — ver PRODUCTION_CHECKLIST.md.';

export const realComplianceService: ComplianceService = {
  async requestVerification() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async resolveVerificationRequest() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async resolveAlert() {
    throw new Error(NOT_IMPLEMENTED);
  },
};
