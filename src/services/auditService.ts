import type { AuditEntry } from '../domain/audit';
import { isRealBackendEnabled } from './env';
import { mockAuditService } from './mocks/auditService.mock';
import { realAuditService } from './real/auditService.real';

export interface AuditService {
  /** Lista la auditoría del propio tenant, más reciente primero. Solo
   * accesible con rol 'admin'. */
  list(): Promise<AuditEntry[]>;
}

export const auditService: AuditService = isRealBackendEnabled() ? realAuditService : mockAuditService;
