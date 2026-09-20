import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { AuditEntry, AuditAction } from '../../domain/audit';
import { generateId } from '../../lib/ids';
import { SANDBOX_TENANT } from '../tenant';
import { useKoraStore } from '../store';

export interface AuditSlice {
  auditEntries: AuditEntry[];
  addAuditEntry: (entry: AuditEntry) => void;
}

export const createAuditSlice: StateCreator<StoreState, [], [], AuditSlice> = (set) => ({
  auditEntries: [],
  addAuditEntry: (entry) => set((state) => ({ auditEntries: [entry, ...state.auditEntries] })),
});

/** Registra una acción de staff en la auditoría del sandbox — arma el actor
 * (quién) leyendo el store activo, para no repetir esa lookup en cada uno
 * de los puntos de mutación que la llaman. Nunca lanza: si el actor no se
 * puede resolver, se omite el registro en vez de romper la acción que sí
 * tuvo éxito. */
export function recordAudit(patch: { action: AuditAction; targetType: string; targetId: string; detail: string }) {
  const state = useKoraStore.getState();
  const actor = state.users[state.activeUserId];
  const staffMember = state.staffMembers.find((m) => m.id === state.activeUserId);
  if (!actor || !staffMember) return;

  state.addAuditEntry({
    id: generateId('audit'),
    tenantId: SANDBOX_TENANT.id,
    staffId: actor.id,
    staffName: actor.name,
    role: staffMember.role,
    at: state.simulatedNowIso,
    ...patch,
  });
}
