import type { CopilotService, CopilotChatMessage, CopilotContext, CopilotReply, PendingAgentAction } from '../copilotService';
import { invokeEdgeFunction } from '../../lib/invokeEdgeFunction';

export const realCopilotService: CopilotService = {
  sendMessage(
    history: CopilotChatMessage[],
    userMessage: string,
    context: CopilotContext,
    pendingAction?: PendingAgentAction
  ): Promise<CopilotReply> {
    return invokeEdgeFunction<CopilotReply>('copilot-chat', { history, userMessage, context, pendingAction });
  },
};
