import { useEffect, useState, type ReactNode } from 'react';
import { isRealBackendEnabled } from '../services/env';
import { getSupabaseClient } from '../lib/supabaseClient';
import { useKoraStore } from './store';
import { selectActiveUser } from './selectors';
import { StaffRoleContext } from './staffRole';
import type { BackofficeRole } from '../domain/staff';

/** Resuelve el rol de staff del operador activo — clonado del patrón de
 * TenantContext.tsx: en sandbox resuelve local sin red, en producción
 * consulta `staff_members` (protegido por la RLS "lee su propia fila",
 * ver migración de staff_roles). */
export function StaffProvider({ children }: { children: ReactNode }) {
  const loggedIn = useKoraStore((s) => s.loggedIn);
  const activeUser = useKoraStore(selectActiveUser);
  const staffMembers = useKoraStore((s) => s.staffMembers);
  const [role, setRole] = useState<BackofficeRole | null>(null);

  useEffect(() => {
    if (!loggedIn || activeUser?.accountType !== 'operador') {
      setRole(null);
      return;
    }

    if (!isRealBackendEnabled()) {
      setRole(staffMembers.find((m) => m.id === activeUser.id)?.role ?? null);
      return;
    }

    let cancelled = false;
    getSupabaseClient()
      .from('staff_members')
      .select('role')
      .eq('id', activeUser.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setRole(data.role as BackofficeRole);
      });

    return () => {
      cancelled = true;
    };
  }, [loggedIn, activeUser, staffMembers]);

  return <StaffRoleContext.Provider value={role}>{children}</StaffRoleContext.Provider>;
}
