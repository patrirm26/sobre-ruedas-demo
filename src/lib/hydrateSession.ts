import { invokeEdgeFunction } from './invokeEdgeFunction';
import type { User, Account } from '../domain/user';
import type { ScoreSnapshot } from '../domain/score';

export interface WhoAmI {
  user: User;
  account: Account | null;
  scoreSnapshot: ScoreSnapshot | null;
}

/** Único punto donde el frontend lee su propio usuario/cuenta reales
 * (Sprint 2 — auth real). `account` es null si el signup empezó pero
 * auth-complete-signup todavía no corrió (no debería pasar en el flujo
 * normal: authService.signUp ya lo invoca antes de devolver). */
export function fetchWhoAmI(): Promise<WhoAmI> {
  return invokeEdgeFunction('auth-whoami', {});
}
