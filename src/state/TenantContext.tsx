import { useEffect, useState, type ReactNode } from 'react';
import { isRealBackendEnabled } from '../services/env';
import { getSupabaseClient } from '../lib/supabaseClient';
import { useKoraStore } from './store';
import { TenantContext as TenantReactContext, SANDBOX_TENANT, applyTenantTheme, type Tenant } from './tenant';

export function TenantProvider({ children }: { children: ReactNode }) {
  const loggedIn = useKoraStore((s) => s.loggedIn);
  const [tenant, setTenant] = useState<Tenant>(SANDBOX_TENANT);

  useEffect(() => {
    if (!isRealBackendEnabled()) {
      applyTenantTheme(SANDBOX_TENANT.marcaJson);
      return;
    }
    if (!loggedIn) return;

    // Sin filtro explícito por tenant_id a propósito: la policy RLS
    // "usuario lee su propio tenant" (migración de tenancy) ya acota el
    // resultado a la única fila visible para el JWT de la sesión activa —
    // así el tenant literalmente se resuelve del JWT, como pide el plan.
    let cancelled = false;
    getSupabaseClient()
      .from('tenants')
      .select('id, nombre, marca_json, estado')
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const resolved: Tenant = { id: data.id, nombre: data.nombre, marcaJson: data.marca_json ?? {}, estado: data.estado };
        setTenant(resolved);
        applyTenantTheme(resolved.marcaJson);
      });

    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  return <TenantReactContext.Provider value={tenant}>{children}</TenantReactContext.Provider>;
}
