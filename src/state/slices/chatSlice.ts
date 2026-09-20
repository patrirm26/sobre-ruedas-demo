import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { PendingAgentAction } from '../../services/copilotService';

export interface CopilotChatMsg {
  from: 'bot' | 'user';
  text: string;
}

const GREETING: CopilotChatMsg = {
  from: 'bot',
  text: 'Hola 👋 Soy tu Copilot KORA. Puedo explicarte tu score, recordarte vencimientos con el Estado, transferir, pagar cuotas u obligaciones, y convertir moneda — siempre te pido confirmación antes de mover tu dinero. ¿En qué te ayudo?',
};

/** Conversación del Copilot — antes vivía en `useState` local de
 * `CopilotView` y se perdía al cerrar el drawer. Es el equivalente cliente
 * de las tablas `conversations`/`messages` del agente real: persiste en el
 * store del sandbox (localStorage) hasta que haya un backend de verdad. */
export interface ChatSlice {
  copilotMessages: CopilotChatMsg[];
  /** Acción mutativa que el agente propuso y espera confirmación del
   * usuario en el turno siguiente (transferir, pagar, convertir...). */
  copilotPendingAction: PendingAgentAction | null;
  /** Chips de respuesta sugerida — reemplazan las sugerencias estáticas
   * cuando el agente propone algo puntual (ej. "Sí, confirmar"). */
  copilotUiHints: string[];
  appendCopilotMessage: (msg: CopilotChatMsg) => void;
  setCopilotPendingAction: (action: PendingAgentAction | null) => void;
  setCopilotUiHints: (hints: string[]) => void;
  resetCopilotChat: () => void;
}

export const createChatSlice: StateCreator<StoreState, [], [], ChatSlice> = (set) => ({
  copilotMessages: [GREETING],
  copilotPendingAction: null,
  copilotUiHints: [],

  appendCopilotMessage: (msg) => set((state) => ({ copilotMessages: [...state.copilotMessages, msg] })),
  setCopilotPendingAction: (action) => set({ copilotPendingAction: action }),
  setCopilotUiHints: (hints) => set({ copilotUiHints: hints }),
  resetCopilotChat: () => set({ copilotMessages: [GREETING], copilotPendingAction: null, copilotUiHints: [] }),
});
