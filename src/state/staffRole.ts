import { createContext, useContext } from 'react';
import type { BackofficeRole } from '../domain/staff';

/** Rol de staff del operador activo — `null` mientras resuelve o si el
 * usuario activo no es staff. Ver StaffContext.tsx (StaffProvider) para
 * cómo se resuelve, y ROLE_SECTIONS en backofficeSlice.ts para qué
 * secciones del Back Office desbloquea cada rol. */
export const StaffRoleContext = createContext<BackofficeRole | null>(null);

export function useStaffRole(): BackofficeRole | null {
  return useContext(StaffRoleContext);
}
