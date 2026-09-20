import type { GovObligation } from '../../../domain/govtech';

/** No existe integración real con el SENIAT todavía. Antes esta función
 * devolvía una deuda fabricada como si fuera real — corregido: con backend
 * real activado, un usuario tiene que ver un error claro, no una obligación
 * al Estado que no existe. Reemplazar por la consulta real cuando haya
 * proveedor/convenio — el resto del sistema (govtechService, UI) no
 * necesita cambiar, solo este archivo. */
export async function consultarDeudas(): Promise<GovObligation[]> {
  throw new Error('Not implemented: la integración real con el SENIAT no existe todavía — ver PRODUCTION_CHECKLIST.md.');
}
