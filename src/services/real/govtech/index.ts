import type { GovObligation } from '../../../domain/govtech';
import * as seniat from './seniat';
import * as intt from './intt';

/** Registro adapter_key → implementación (Sprint 5). Agregar un ente
 * nuevo con integración real es: (1) fila en `gov_entities` con su
 * `adapter_key`, (2) un archivo nuevo acá al lado de `seniat.ts`/`intt.ts`
 * registrado en este mapa. Nada más. */
export const GOVTECH_ADAPTERS: Record<string, (entityId: string) => Promise<GovObligation[]>> = {
  seniat: seniat.consultarDeudas,
  intt: intt.consultarDeudas,
};
