import type { KycLevel } from '../domain/user';
import type { ComplianceAlert, VerificationRequest } from '../domain/compliance';
import { isRealBackendEnabled } from './env';
import { mockComplianceService } from './mocks/complianceService.mock';
import { realComplianceService } from './real/complianceService.real';

export interface RequestVerificationInput {
  userId: string;
  requestedLevel: KycLevel;
}

export interface ResolveVerificationRequestInput {
  requestId: string;
  approve: boolean;
}

export interface ResolveAlertInput {
  alertId: string;
  resolution: string;
}

export interface ComplianceService {
  /** El usuario pide subir de nivel KYC — crea la solicitud, no cambia el nivel todavía. */
  requestVerification(input: RequestVerificationInput): Promise<VerificationRequest>;
  /** El operador aprueba o rechaza — si aprueba, sube el kycLevel real del usuario. */
  resolveVerificationRequest(input: ResolveVerificationRequestInput): Promise<VerificationRequest>;
  /** El operador cierra una alerta AML con una nota. */
  resolveAlert(input: ResolveAlertInput): Promise<ComplianceAlert>;
}

export const complianceService: ComplianceService = isRealBackendEnabled() ? realComplianceService : mockComplianceService;
