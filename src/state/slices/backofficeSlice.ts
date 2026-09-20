import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { BackofficeRole } from '../../domain/staff';

/** Vista activa dentro del shell del Back Office — separada de `ViewId`/
 * `activeView` (consumidor) a propósito: el Back Office no comparte espacio
 * de rutas con la billetera. */
export type BackofficeView =
  | 'reporting'
  | 'decisioning'
  | 'collections'
  | 'compliance'
  | 'onboarding'
  | 'loyalty'
  | 'cards'
  | 'creditRequests'
  | 'scoreCredito'
  | 'insurance'
  | 'staff'
  | 'audit'
  | 'security';

/** Qué secciones puede ver cada rol de staff (roles y permisos, ver
 * StaffView.tsx) — única fuente de verdad, usada tanto para filtrar el
 * sidebar como (server-side, misma lista replicada) para autorizar las
 * Edge Functions del Back Office. */
export const ROLE_SECTIONS: Record<BackofficeRole, BackofficeView[]> = {
  admin: ['reporting', 'decisioning', 'collections', 'compliance', 'onboarding', 'loyalty', 'cards', 'creditRequests', 'scoreCredito', 'insurance', 'staff', 'audit', 'security'],
  compliance: ['compliance', 'scoreCredito'],
  operaciones: ['decisioning', 'collections', 'onboarding', 'loyalty', 'cards', 'creditRequests', 'scoreCredito', 'insurance'],
  reporting: ['reporting'],
};

export interface BackofficeSlice {
  backofficeView: BackofficeView;
  setBackofficeView: (view: BackofficeView) => void;
}

export const createBackofficeSlice: StateCreator<StoreState, [], [], BackofficeSlice> = (set) => ({
  backofficeView: 'reporting',
  setBackofficeView: (view) => set({ backofficeView: view }),
});
