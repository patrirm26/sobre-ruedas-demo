import { useKoraStore } from '../../state/store';
import type { AuditEntry } from '../../domain/audit';
import type { AuditService } from '../auditService';
import { simulateLatency } from '../delay';

export const mockAuditService: AuditService = {
  async list(): Promise<AuditEntry[]> {
    await simulateLatency();
    // addAuditEntry ya inserta al principio del array (más nuevo primero).
    return useKoraStore.getState().auditEntries;
  },
};
