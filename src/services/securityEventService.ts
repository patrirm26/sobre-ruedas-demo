import type { SecurityEvent } from '../domain/securityEvent';
import { isRealBackendEnabled } from './env';
import { mockSecurityEventService } from './mocks/securityEventService.mock';
import { realSecurityEventService } from './real/securityEventService.real';

export interface SecurityEventService {
  /** Lista los últimos eventos de seguridad (401/403/429/500 no manejados
   * de las Edge Functions) del propio tenant, más reciente primero. Solo
   * accesible con rol 'admin'. */
  list(): Promise<SecurityEvent[]>;
}

export const securityEventService: SecurityEventService = isRealBackendEnabled() ? realSecurityEventService : mockSecurityEventService;
