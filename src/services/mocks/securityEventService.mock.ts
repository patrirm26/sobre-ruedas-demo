import type { SecurityEvent } from '../../domain/securityEvent';
import type { SecurityEventService } from '../securityEventService';
import { simulateLatency } from '../delay';

// Eventos ilustrativos — en sandbox no hay auth/rate limiting real que los
// genere (todo corre en el cliente, ver env.ts), así que se muestran unos
// pocos representativos para que el Back Office no se vea vacío. En
// producción (`isRealBackendEnabled()`), `security-events-list` devuelve
// los eventos reales de `security_events`.
const MOCK_EVENTS: SecurityEvent[] = [
  {
    id: 'sec-1',
    functionName: 'copilot-chat',
    eventType: 'rate_limited',
    detail: 'Demasiadas solicitudes en poco tiempo — esperá un momento y volvé a intentar.',
    at: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
  },
  {
    id: 'sec-2',
    functionName: 'public-api-accounts',
    eventType: 'auth_failed',
    detail: 'API key inválida o revocada.',
    at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'sec-3',
    userId: 'demo-diego',
    functionName: 'bnpl-evaluate',
    eventType: 'forbidden',
    detail: 'Esta cuenta no pertenece al usuario autenticado.',
    at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
];

export const mockSecurityEventService: SecurityEventService = {
  async list(): Promise<SecurityEvent[]> {
    await simulateLatency();
    return MOCK_EVENTS;
  },
};
