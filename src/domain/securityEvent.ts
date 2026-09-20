export type SecurityEventType = 'auth_failed' | 'forbidden' | 'rate_limited' | 'unhandled_error';

export interface SecurityEvent {
  id: string;
  userId?: string;
  tenantId?: string;
  functionName: string;
  eventType: SecurityEventType;
  detail: string;
  at: string;
}
