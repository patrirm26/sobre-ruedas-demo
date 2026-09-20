import type { AuditEntry } from '../../domain/audit';
import type { AuditService } from '../auditService';
import { invokeEdgeFunction } from '../../lib/invokeEdgeFunction';

export const realAuditService: AuditService = {
  list(): Promise<AuditEntry[]> {
    return invokeEdgeFunction<AuditEntry[]>('audit-list', {});
  },
};
