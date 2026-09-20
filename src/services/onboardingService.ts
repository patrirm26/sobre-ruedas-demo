import type { MerchantOnboardingRequest } from '../domain/onboarding';
import { isRealBackendEnabled } from './env';
import { mockOnboardingService } from './mocks/onboardingService.mock';
import { realOnboardingService } from './real/onboardingService.real';

export interface SubmitMerchantRequestInput {
  name: string;
  category: string;
  taxId: string;
  proposedBnplFeePct: number;
}

export interface ResolveMerchantRequestInput {
  requestId: string;
  approve: boolean;
}

export interface OnboardingService {
  /** Registra una solicitud de alta de comercio — no crea el Merchant todavía. */
  submitMerchantRequest(input: SubmitMerchantRequestInput): Promise<MerchantOnboardingRequest>;
  /** El operador aprueba o rechaza — si aprueba, crea el Merchant real. */
  resolveMerchantRequest(input: ResolveMerchantRequestInput): Promise<MerchantOnboardingRequest>;
}

export const onboardingService: OnboardingService = isRealBackendEnabled() ? realOnboardingService : mockOnboardingService;
