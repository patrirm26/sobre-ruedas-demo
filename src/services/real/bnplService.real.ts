import type { BnplService } from '../bnplService';
import { invokeEdgeFunction } from '../../lib/invokeEdgeFunction';

export const realBnplService: BnplService = {
  evaluate: (input) => invokeEdgeFunction('bnpl-evaluate', input),

  simulateInstallments: (input) => invokeEdgeFunction('bnpl-simulate', input),

  createPlan: (input) => invokeEdgeFunction('bnpl-create-plan', input),

  payInstallment: (planId, installmentId) => invokeEdgeFunction('bnpl-pay-installment', { planId, installmentId }),

  // Nunca recalcula el sistema completo desde el cliente — la Edge Function
  // acota siempre a la cuenta del usuario autenticado (ver
  // supabase/functions/bnpl-recalculate-statuses). El barrido global de
  // todas las cuentas corre en un cron aparte (ver supabase/README.md).
  async recalculateStatuses() {
    // No hay un solo "accountId activo" a este nivel de la interfaz — se
    // resuelve del lado de la Edge Function a partir del JWT si no se manda
    // ninguno explícito no sería seguro; en la práctica el único caller hoy
    // (sandbox/SimulationPanel) no existe en producción, así que esta
    // implementación solo documenta la superficie: llamarla requiere pasar
    // accountId explícito vía un wrapper de más alto nivel si algún día se
    // necesita desde la UI de producción.
    throw new Error('recalculateStatuses no se invoca desde la UI en producción — el estado de mora se recalcula por cron. Ver supabase/README.md.');
  },

  // Revisión manual de Créditos (Sprint 11) — construido y verificado solo
  // en el sandbox para la demo; falta la Edge Function real con
  // autorización de staff (mismo criterio que el resto de acciones de
  // Back Office que hoy son sandbox-only, ver PRODUCTION_CHECKLIST.md).
  async resolveManualRequest() {
    throw new Error('Not implemented: resolveManualRequest requiere una Edge Function con autorización de staff — ver PRODUCTION_CHECKLIST.md.');
  },
};
