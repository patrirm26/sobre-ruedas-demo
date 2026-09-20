import { getSupabaseClient } from './supabaseClient';

/** Invoca una Supabase Edge Function pasando automáticamente el JWT de la
 * sesión activa (lo hace el SDK solo). Si la función respondió con un error
 * (ver _shared/cors.ts errorResponse en supabase/functions), intenta leer
 * el `{ error: string }` real del body en vez del mensaje genérico que da
 * supabase-js por defecto ("Edge Function returned a non-2xx status code"). */
export async function invokeEdgeFunction<T>(name: string, body: object): Promise<T> {
  const { data, error } = await getSupabaseClient().functions.invoke(name, { body: body as Record<string, unknown> });
  if (error) {
    const context = (error as { context?: Response }).context;
    let serverMessage: string | undefined;
    if (context) {
      try {
        const payload = await context.clone().json();
        serverMessage = payload?.error;
      } catch {
        // el body no era JSON parseable — se usa el mensaje genérico de abajo.
      }
    }
    throw new Error(serverMessage ?? error.message ?? 'Error al conectar con el servidor.');
  }
  return data as T;
}
