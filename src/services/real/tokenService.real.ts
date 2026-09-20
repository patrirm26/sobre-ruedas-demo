import type { TokenService } from '../tokenService';
import { invokeEdgeFunction } from '../../lib/invokeEdgeFunction';

export const realTokenService: TokenService = {
  mint: (input) => invokeEdgeFunction('token-mint', input),

  burn: (input) => invokeEdgeFunction('token-burn', input),

  transfer: (input) => invokeEdgeFunction('token-transfer', input),

  // lockCollateral/releaseCollateral son parte de la interfaz por
  // completitud (el mock las expone porque bnplService.mock.ts las llama
  // directo), pero en producción SIEMPRE son un efecto interno de
  // bnpl-create-plan/bnpl-pay-installment (ver
  // supabase/functions/_shared/tokenEngine.ts) — nunca una acción que un
  // usuario dispare por sí sola desde la UI. No existe una Edge Function
  // HTTP para ellas a propósito: exponerlas dejaría bloquear/liberar
  // garantía sin pasar por el underwriting real de un plan de crédito.
  async lockCollateral() {
    throw new Error('lockCollateral no se invoca directo en producción — es parte de bnplService.createPlan.');
  },
  async releaseCollateral() {
    throw new Error('releaseCollateral no se invoca directo en producción — es parte de bnplService.payInstallment.');
  },

  getReserveProof: () => invokeEdgeFunction('token-reserve-proof', {}),
};
