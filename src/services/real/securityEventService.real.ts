import type { SecurityEvent } from '../../domain/securityEvent';
import type { SecurityEventService } from '../securityEventService';
import { invokeEdgeFunction } from '../../lib/invokeEdgeFunction';

export const realSecurityEventService: SecurityEventService = {
  list(): Promise<SecurityEvent[]> {
    return invokeEdgeFunction<SecurityEvent[]>('security-events-list', {});
  },
};
