export type Env = 'sandbox' | 'production';

/** Bandera única que decide qué implementación de cada servicio se usa
 * (mock vs. real). Hoy siempre 'sandbox' — cambiar a 'production' es el
 * único paso técnico para apuntar a proveedores reales, una vez existan. */
export const ENV: Env = (import.meta.env.VITE_APP_ENV as Env) ?? 'sandbox';

/** Criterio de selección aparte de `ENV`, solo para copilotService: no
 * depende de si el resto de la app está en sandbox o production, sino de
 * si hay un backend Supabase real configurado para hablarle a la IA. Así
 * el Copilot puede ser real hoy mismo aunque el resto del sandbox (BNPL,
 * Marketplace, etc.) siga 100% simulado en el cliente. */
export function isSupabaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

/** Criterio de selección aparte, solo para bankAllianceService — mismo
 * motivo que `isSupabaseConfigured()` para el Copilot: no puede depender de
 * `ENV` (rompería el resto del sandbox) ni de `isSupabaseConfigured()` (ya
 * está en `true` hoy porque Supabase está configurado para el Copilot, así
 * que reusarla prendería Alianzas Bancarias real sin que nadie lo haya
 * decidido). Bandera propia, explícita, apagada por defecto — se prende a
 * mano recién cuando la migración/Edge Functions ya estén probadas. */
export function isBankGatewayEnabled(): boolean {
  return import.meta.env.VITE_BANK_GATEWAY_ENABLED === 'true';
}

/** Bandera propia para activar los 9 servicios que ya son reales de verdad
 * (auth, bnpl, token, marketplace, score, audit, convert, staff — copilot
 * ya tiene la suya) más los 7 stubs honestos y el login/sesión/tenant/staff
 * reales — sin tocar `ENV` (que sigue en 'sandbox' en producción). El `&&
 * isSupabaseConfigured()` es una red de seguridad: sin credenciales de
 * Supabase, esto nunca se activa a medias con un error confuso. */
export function isRealBackendEnabled(): boolean {
  return import.meta.env.VITE_REAL_BACKEND_ENABLED === 'true' && isSupabaseConfigured();
}
