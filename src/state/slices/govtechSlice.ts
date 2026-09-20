import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { GovEntity, GovObligation } from '../../domain/govtech';
import { SEED_GOV_ENTITIES, SEED_OBLIGATIONS } from '../../data/seedGovtech';

export interface GovtechSlice {
  /** Catálogo de entes — síncrono, mismo criterio que `merchants`/`products`
   * (no requiere servicio para listar, solo la acción "consultar deudas"
   * vía govtechService, Sprint 5). */
  govEntities: GovEntity[];
  obligations: GovObligation[];
  markObligationPaid: (obligationId: string) => void;
  /** Mezcla el resultado de `govtechService.consultarDeudas` al store —
   * evita duplicados si ya existía una obligación con ese id. */
  addObligations: (obligations: GovObligation[]) => void;
}

export const createGovtechSlice: StateCreator<StoreState, [], [], GovtechSlice> = (set) => ({
  govEntities: SEED_GOV_ENTITIES,
  obligations: SEED_OBLIGATIONS,

  markObligationPaid: (obligationId) =>
    set((state) => ({
      obligations: state.obligations.map((o) => (o.id === obligationId ? { ...o, paid: true } : o)),
    })),

  addObligations: (newObligations) =>
    set((state) => {
      const existingIds = new Set(state.obligations.map((o) => o.id));
      return { obligations: [...state.obligations, ...newObligations.filter((o) => !existingIds.has(o.id))] };
    }),
});
