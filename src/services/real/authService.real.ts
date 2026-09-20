import type { AuthService } from '../authService';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { invokeEdgeFunction } from '../../lib/invokeEdgeFunction';

const DEFAULT_TENANT_ID = import.meta.env.VITE_DEFAULT_TENANT_ID as string | undefined;

export const realAuthService: AuthService = {
  async signUp({ name, email, password, accountType, businessProfile }) {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { name, tenant_id: DEFAULT_TENANT_ID } },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('No se pudo crear la cuenta.');

    // El trigger handle_new_auth_user ya creó la fila mínima de `users` en
    // el mismo insert a auth.users — recién ahora hay JWT para invocar la
    // Edge Function que completa el alta financiera (accounts + score).
    // businessProfile viaja directo en el body (no en metadata de Auth) —
    // auth-complete-signup ya recibe payload propio, sin depender de que
    // los claims del JWT se hayan propagado.
    await invokeEdgeFunction('auth-complete-signup', { accountType, businessProfile });
    return { userId: data.user.id };
  },

  async signIn({ email, password }) {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return { userId: data.user.id };
  },

  async signOut() {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) throw new Error(error.message);
  },

  async getSession() {
    const { data, error } = await getSupabaseClient().auth.getSession();
    if (error) throw new Error(error.message);
    return data.session ? { userId: data.session.user.id } : null;
  },
};
