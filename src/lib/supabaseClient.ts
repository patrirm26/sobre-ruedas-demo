import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/** Lazy a propósito: services/real/*.real.ts se importan siempre (import
 * estático), incluso con ENV='sandbox' — si este cliente se construyera al
 * cargar el módulo, faltarían las env vars de Supabase y rompería el
 * sandbox aunque nunca se use la implementación real. Solo se construye (y
 * puede fallar) la primera vez que de verdad se invoca. */
export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — requeridas para ENV=production. Ver .env.example.');
  }

  client = createClient(url, anonKey);
  return client;
}
