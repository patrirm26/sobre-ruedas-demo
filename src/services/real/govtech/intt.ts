import type { GovObligation } from '../../../domain/govtech';

/** No existe integración real con el INTTT todavía — misma corrección que
 * seniat.ts: antes devolvía una deuda fabricada como si fuera real. */
export async function consultarDeudas(): Promise<GovObligation[]> {
  throw new Error('Not implemented: la integración real con el INTTT no existe todavía — ver PRODUCTION_CHECKLIST.md.');
}
