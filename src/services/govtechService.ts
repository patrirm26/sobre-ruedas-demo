import type { GovObligation } from '../domain/govtech';
import { isRealBackendEnabled } from './env';
import { mockGovtechService } from './mocks/govtechService.mock';
import { realGovtechService } from './real/govtechService.real';

export interface GovtechService {
  /** Consulta deudas pendientes contra un ente (Sprint 5 — catálogo
   * adaptativo). En sandbox se simula desde el catálogo ya sembrado; en
   * producción despacha al adapter de `services/real/govtech/*.ts` que
   * corresponda al `adapterKey` del ente. */
  consultarDeudas(entityId: string): Promise<GovObligation[]>;
}

export const govtechService: GovtechService = isRealBackendEnabled() ? realGovtechService : mockGovtechService;
