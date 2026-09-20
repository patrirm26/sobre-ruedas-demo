import type { ScoreService } from '../scoreService';

// A propósito NO hay una Edge Function HTTP para esto: el score solo puede
// cambiar como efecto server-side de una acción validada (pagar una cuota,
// abrir un crédito, caer en mora — ver supabase/functions/_shared/bnplEngine.ts,
// que llama a recalculateScore() directo, sin pasar por HTTP). Exponer
// `recalculate(accountId, event)` como endpoint invocable por el cliente
// dejaría que cualquier usuario se mande a sí mismo el evento
// 'payment_on_time' las veces que quiera y se infle el score sin haber
// pagado nada — se detectó y se corrigió este hueco durante la Fase A,
// antes de escribir la función (ver el commit de esta fase).
export const realScoreService: ScoreService = {
  async recalculate() {
    throw new Error('El score solo se recalcula como efecto de una acción real (pagar cuota, abrir crédito) — no es invocable directo.');
  },
};
