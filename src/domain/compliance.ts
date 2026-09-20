import type { KycLevel } from './user';

export type ComplianceAlertStatus = 'abierta' | 'resuelta';

export interface ComplianceAlert {
  id: string;
  at: string;
  userId: string;
  message: string;
  status: ComplianceAlertStatus;
  resolvedAt?: string;
  resolution?: string;
}

export type VerificationRequestStatus = 'pendiente' | 'aprobada' | 'rechazada';

export interface VerificationRequest {
  id: string;
  at: string;
  userId: string;
  currentLevel: KycLevel;
  requestedLevel: KycLevel;
  status: VerificationRequestStatus;
  resolvedAt?: string;
}
