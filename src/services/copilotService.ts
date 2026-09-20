import { ENV } from './env';
import { mockCopilotService } from './mocks/copilotService.mock';
import { realCopilotService } from './real/copilotService.real';
import type { ConvertCurrency } from './convertService';
import type { TransactionCurrency } from '../domain/transaction';
import type { InstallmentFrequency } from '../domain/credit';

export interface CopilotChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

/** Snapshot del estado ya calculado en el store — el Copilot responde sobre
 * esto en vez de que el backend consulte la base de datos por su cuenta (no
 * hay auth real de usuario en este sandbox, ver PRODUCTION_CHECKLIST.md).
 * Los IDs reales (obligationId, installmentId, planId) viajan acá porque el
 * agente no solo informa — también ejecuta acciones sobre esas entidades. */
export interface CopilotContext {
  accountId: string;
  userName: string;
  balanceUsdCents: number;
  balanceVesCents: number;
  krtTotalCents: number;
  bcvRate: number;
  scoreValue: number;
  scoreBand: string;
  creditAvailableCents: number;
  upcomingInstallments: { id: string; planId: string; installmentsCount: number; amountCents: number; dueDate: string }[];
  upcomingObligations: { name: string; entity: string; amountCents: number; dueLabel: string }[];
  /** Todas las obligaciones sin pagar (no solo las 3 próximas) — para resolver
   * "paga el SENIAT" contra el nombre real sin adivinar el id. */
  unpaidObligations: { id: string; name: string; entity: string; amountCents: number }[];
  /** Últimos movimientos, más reciente primero — soporta "¿cuáles fueron mis
   * últimos movimientos?" sin duplicar la lista completa de Actividad. */
  recentTransactions: { title: string; amountCents: number; currency: TransactionCurrency; direction: 'in' | 'out'; at: string }[];
}

/** Intención detectada en el turno actual — ver `interpret()` en
 * copilotService.mock.ts. `confirm`/`cancel` solo aparecen cuando había un
 * `pendingAction` del turno anterior; `injection_blocked` es la defensa no
 * negociable contra intentos de manipular al agente. */
export type AgentIntent =
  | 'balance'
  | 'transactions'
  | 'bnpl_status'
  | 'simulate_bnpl'
  | 'transfer'
  | 'pay_installment'
  | 'gov_obligations'
  | 'pay_gov_obligation'
  | 'convert_currency'
  | 'create_bnpl_request'
  | 'marketplace_recommend'
  | 'confirm'
  | 'cancel'
  | 'injection_blocked'
  | 'chitchat';

interface TransferActionParams {
  kind: 'transfer';
  to: string;
  amountCents: number;
  currency: Extract<TransactionCurrency, 'USD' | 'VES'>;
}
interface PayInstallmentActionParams {
  kind: 'pay_installment';
  planId: string;
  installmentId: string;
}
interface PayGovObligationActionParams {
  kind: 'pay_gov_obligation';
  obligationId: string;
}
interface ConvertCurrencyActionParams {
  kind: 'convert_currency';
  from: ConvertCurrency;
  to: ConvertCurrency;
  amountCents: number;
}
interface CreateBnplRequestActionParams {
  kind: 'create_bnpl_request';
  amountCents: number;
  installmentsCount: number;
  frequency: InstallmentFrequency;
  purpose: string;
}

/** Acción mutativa propuesta por el agente, pendiente de confirmación del
 * usuario en el turno siguiente — equivalente cliente del "Confirmation
 * Gate" del documento original, sin tabla de servidor porque no hay
 * servidor en el sandbox. */
export type PendingAgentAction =
  | TransferActionParams
  | PayInstallmentActionParams
  | PayGovObligationActionParams
  | ConvertCurrencyActionParams
  | CreateBnplRequestActionParams;

export interface CopilotReply {
  text: string;
  intent?: AgentIntent;
  /** Chips de respuesta sugerida para la fila de sugerencias del chat. */
  uiHints?: string[];
  /** Presente solo cuando el agente propone una acción mutativa nueva. */
  pendingAction?: PendingAgentAction;
}

export interface CopilotService {
  /** `pendingAction` es la acción que el agente propuso en su turno
   * anterior (si la hay) — permite detectar que "sí" es una confirmación y
   * no una pregunta nueva. */
  sendMessage(
    history: CopilotChatMessage[],
    userMessage: string,
    context: CopilotContext,
    pendingAction?: PendingAgentAction
  ): Promise<CopilotReply>;
}

// Gateado por ENV como el resto de los servicios (demo martes — ver
// Plan_5_Dias_Demo_Martes.md: Copilot está clasificado ahí como uno de los
// 13 flujos con backend simulado). Antes se decidía por `isSupabaseConfigured()`
// para poder mostrar la IA real aun en sandbox — se revierte por ahora porque
// la cuenta de la API real quedó sin crédito y tirar un error de facturación
// en vivo frente al comprador es peor que la respuesta simulada. Volver a
// `isSupabaseConfigured()` cuando haya crédito y se quiera mostrar la IA real.
export const copilotService: CopilotService = ENV === 'production' ? realCopilotService : mockCopilotService;
