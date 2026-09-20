import type { CopilotService, CopilotContext, CopilotReply, PendingAgentAction } from '../copilotService';
import type { ConvertCurrency } from '../convertService';
import { bnplService } from '../bnplService';
import { simulateLatency } from '../delay';
import { formatUSD, formatVES, formatKRT, formatDate } from '../../lib/format';

const DEFAULT_CONFIRM_HINTS = ['Sí, confirmar', 'No, cancelar'];

// Todas las reglas de abajo corren sobre texto normalizado (minúsculas, sin
// tildes) — "págame" y "pagame" deben reconocerse igual. Solo la extracción
// de monto/nombre usa el texto original (necesita mayúsculas para adivinar
// el nombre del destinatario).
const AFFIRM_RE = /^(si(,)?\s|si$|dale|confirmo|confirmar|okay?|de acuerdo|hazlo|adelante|asi\s+es)/;
const NEGATE_RE = /^(no|cancela|cancelar|mejor no|olvidalo|dejalo)/;
const INJECTION_RE = /ignora|olvida\s+(todo|tus\s+instrucciones)|sin\s+confirmar|saltate\s+la\s+confirmacion|salta\s+la\s+confirmacion|nuevas\s+instrucciones|eres\s+libre\s+de/;
const MONEY_MENTION_RE = /\$|\bbs\b|transf|envia|manda|paga|credito|convert/;

const TRANSFER_RE = /\b(mandale|manda|enviale|envia|transfie?re?)\b/;
const PAY_INSTALLMENT_RE = /pag(?:a|ame|ar)?\s+(?:me\s+)?(?:la\s+)?cuota/;
const PAY_VERB_RE = /\bpag(?:a|ame|ar)?\b/;
const CONVERT_TRIGGER_RE = /convert|cambia|bolivar|dolar(?:es)?|\bbs\b|\busd\b/;
const CONVERT_EXECUTE_RE = /\bconvie?rt|cambia(?:me)?\s+(?:mi|mis|el)|quiero\s+cambiar/;
const SIMULATE_RE = /simul/;
const CREATE_CREDIT_RE = /(quiero|necesito|solicit|pide|pedi).*(credito|cuotas)/;
const BNPL_STATUS_RE = /(cuanto\s+debo\s+en\s+cuotas|mi(?:s)?\s+cuota|credito\s+activo|estado\s+de\s+mi\s+credito|nivel\s+bnpl)/;
const GOV_QUERY_RE = /(debo|pendient|vence|obligacion)/;
const TX_RE = /(movimient|transacci|historic|ultimo)/;
const BALANCE_RE = /(cuanto\s+tengo|mi\s+saldo|\bsaldo\b)/;
const RECOMMEND_RE = /(recomie|sugie|que\s+me\s+recomiendas)/;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function extractAmountCents(msg: string): number | null {
  const m = msg.match(/\$?\s*(\d+(?:[.,]\d{1,2})?)/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function extractRecipient(msg: string): string | null {
  const m = msg.match(/\ba\s+([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ]*(?:\s+[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ]*)?)/);
  return m ? m[1].trim() : null;
}

function extractInstallments(msg: string): number | null {
  const m = msg.match(/(\d{1,2})\s*cuotas/i);
  return m ? parseInt(m[1], 10) : null;
}

function findObligationMatch(normMsg: string, obligations: CopilotContext['unpaidObligations']) {
  return obligations.find((o) => {
    const name = normalize(o.name);
    const entity = normalize(o.entity);
    if (normMsg.includes(entity) || normMsg.includes(name)) return true;
    return entity.split(' ').some((w) => w.length >= 4 && normMsg.includes(w));
  });
}

function fmtByCurrency(currency: ConvertCurrency, cents: number): string {
  if (currency === 'VES') return formatVES(cents);
  if (currency === 'USD') return formatUSD(cents);
  return formatKRT(cents);
}

/** Texto legible de una acción pendiente — se usa tanto al proponerla como
 * al recordarla si el usuario no respondió sí/no. */
function describeAction(action: PendingAgentAction, context: CopilotContext): string {
  switch (action.kind) {
    case 'transfer':
      return `transferirle ${fmtByCurrency(action.currency, action.amountCents)} a ${action.to}`;
    case 'pay_installment':
      return 'pagar tu próxima cuota';
    case 'pay_gov_obligation': {
      const ob = context.unpaidObligations.find((o) => o.id === action.obligationId);
      return ob ? `pagar "${ob.name}" (${ob.entity}) por ${formatVES(ob.amountCents)}` : 'pagar esa obligación';
    }
    case 'convert_currency':
      return `convertir ${fmtByCurrency(action.from, action.amountCents)} a ${action.to}`;
    case 'create_bnpl_request':
      return `solicitar ${formatUSD(action.amountCents)} en ${action.installmentsCount} cuotas`;
  }
}

/** "Cerebro" simulado del Copilot: parser por palabra clave + regex sobre
 * cifras reales del `context`, no un modelo de lenguaje (mismo criterio ya
 * documentado en este archivo antes de esta ampliación). La versión real
 * (n8n + Gemini con function-calling) reemplaza esta función el día que
 * existan las credenciales — ver `services/real/copilotService.real.ts`. */
async function interpret(userMessage: string, context: CopilotContext, pendingAction?: PendingAgentAction): Promise<CopilotReply> {
  const msg = userMessage.trim();
  const norm = normalize(msg);

  // Defensa de prompt injection — regla no negociable, se revisa antes que
  // cualquier otra cosa, incluso si hay una acción pendiente distinta.
  if (INJECTION_RE.test(norm) && MONEY_MENTION_RE.test(norm)) {
    const reminder = pendingAction ? ` Sigo con esto pendiente: ${describeAction(pendingAction, context)}. ¿Confirmas o cancelo?` : '';
    return {
      text: `No puedo saltarme la confirmación de una acción con dinero, ni aunque me lo pidas así.${reminder}`,
      intent: 'injection_blocked',
      pendingAction,
      uiHints: pendingAction ? DEFAULT_CONFIRM_HINTS : undefined,
    };
  }

  // Resolución de una acción pendiente — prioridad absoluta sobre cualquier
  // intención nueva, así "sí" nunca se reinterpreta como otra cosa.
  if (pendingAction) {
    if (AFFIRM_RE.test(norm)) return { text: '', intent: 'confirm', pendingAction };
    if (NEGATE_RE.test(norm)) return { text: 'Listo, no hice ningún cambio. ¿En qué más te ayudo?', intent: 'cancel' };
    return {
      text: `Todavía tengo esto pendiente: ${describeAction(pendingAction, context)}. ¿Confirmas o cancelo?`,
      pendingAction,
      uiHints: DEFAULT_CONFIRM_HINTS,
    };
  }

  // Transferir a un contacto.
  if (TRANSFER_RE.test(norm)) {
    const amountCents = extractAmountCents(msg);
    const to = extractRecipient(msg);
    if (!amountCents || !to) {
      return { text: 'Decime el monto y a quién — por ejemplo "mándale $30 a Carlos".', intent: 'transfer' };
    }
    const currency: 'USD' | 'VES' = /bolivar|\bbs\b/.test(norm) ? 'VES' : 'USD';
    const available = currency === 'USD' ? context.balanceUsdCents : context.balanceVesCents;
    if (amountCents > available) {
      return { text: `No puedo proponer esa transferencia — tu saldo en ${currency} es ${fmtByCurrency(currency, available)}, menor a ${fmtByCurrency(currency, amountCents)}.` };
    }
    const action: PendingAgentAction = { kind: 'transfer', to, amountCents, currency };
    return {
      text: `Voy a transferirle ${fmtByCurrency(currency, amountCents)} a ${to}. ¿Confirmas?`,
      pendingAction: action,
      uiHints: DEFAULT_CONFIRM_HINTS,
    };
  }

  // Pagar la próxima cuota de KORA Cuotas.
  if (PAY_INSTALLMENT_RE.test(norm)) {
    const next = context.upcomingInstallments[0];
    if (!next) return { text: 'No tienes cuotas pendientes ahora mismo. 🎉' };
    if (context.balanceUsdCents < next.amountCents) {
      return { text: `Tu próxima cuota es de ${formatUSD(next.amountCents)} pero tu saldo en USD es ${formatUSD(context.balanceUsdCents)} — no alcanza todavía.` };
    }
    const action: PendingAgentAction = { kind: 'pay_installment', planId: next.planId, installmentId: next.id };
    return {
      text: `Tu próxima cuota es de ${formatUSD(next.amountCents)}, vence el ${formatDate(next.dueDate)}. ¿La pagamos ahora?`,
      pendingAction: action,
      uiHints: DEFAULT_CONFIRM_HINTS,
    };
  }

  // Pagar una obligación de GovTech puntual (identificada por nombre/ente).
  if (PAY_VERB_RE.test(norm)) {
    const match = findObligationMatch(norm, context.unpaidObligations);
    if (match) {
      if (context.balanceVesCents < match.amountCents) {
        return { text: `"${match.name}" (${match.entity}) cuesta ${formatVES(match.amountCents)} pero tu saldo en bolívares es ${formatVES(context.balanceVesCents)} — no alcanza todavía.` };
      }
      const action: PendingAgentAction = { kind: 'pay_gov_obligation', obligationId: match.id };
      return {
        text: `Voy a pagar "${match.name}" (${match.entity}) por ${formatVES(match.amountCents)}. ¿Confirmas?`,
        pendingAction: action,
        uiHints: DEFAULT_CONFIRM_HINTS,
      };
    }
  }

  // Conversión de moneda — pregunta de tasa (siempre directa) vs. pedido de
  // ejecutar el cambio de verdad (siempre con confirmación explícita, regla
  // no negociable #1 — sin la excepción de monto ≤$50 del documento
  // original, porque "nunca sin confirmación" pesa más que esa excepción).
  if (CONVERT_TRIGGER_RE.test(norm)) {
    const amountCents = extractAmountCents(msg);
    if (!amountCents) return { text: 'Decime el monto a convertir — por ejemplo "¿cuánto es en bolívares $100?".' };

    const toVes = !/dolar(?:es)?|\busd\b/.test(norm) || /bolivar|\bbs\b/.test(norm);
    const from: ConvertCurrency = toVes ? 'USD' : 'VES';
    const to: ConvertCurrency = toVes ? 'VES' : 'USD';
    const resultCents = from === 'VES' ? Math.round(amountCents / context.bcvRate) : Math.round(amountCents * context.bcvRate);
    const rateLine = `${fmtByCurrency(from, amountCents)} son ${fmtByCurrency(to, resultCents)} a la tasa BCV de hoy (${context.bcvRate.toFixed(2)} Bs/$).`;

    if (!CONVERT_EXECUTE_RE.test(norm)) return { text: rateLine };

    const available = from === 'VES' ? context.balanceVesCents : context.balanceUsdCents;
    if (amountCents > available) {
      return { text: `${rateLine} Pero tu saldo en ${from} es ${fmtByCurrency(from, available)} — no alcanza para convertir esa cantidad.` };
    }
    const action: PendingAgentAction = { kind: 'convert_currency', from, to, amountCents };
    return {
      text: `${rateLine} ¿Confirmas que convierta ${fmtByCurrency(from, amountCents)} a ${to}?`,
      pendingAction: action,
      uiHints: DEFAULT_CONFIRM_HINTS,
    };
  }

  // Simular crédito — de lectura, pero ya deja la solicitud propuesta y
  // lista para confirmar (evita un segundo mensaje redundante).
  if (SIMULATE_RE.test(norm) && /(credito|cuota)/.test(norm)) {
    const amountCents = extractAmountCents(msg);
    const installments = extractInstallments(msg) ?? 3;
    if (!amountCents) return { text: 'Decime el monto y a cuántas cuotas — por ejemplo "simula un crédito de $200 a 4 cuotas".' };
    const preview = await bnplService.simulateInstallments({ accountId: context.accountId, amountCents, installmentsCount: installments });
    const base = `Con ${formatUSD(amountCents)} a ${installments} cuotas, pagarías ${formatUSD(preview.installmentCents)} por cuota (tasa ${preview.periodicRatePct.toFixed(1)}% mensual), costo total del crédito ${formatUSD(preview.feeTotalCents)}.`;
    if (amountCents > context.creditAvailableCents) {
      return { text: `${base} Tu cupo disponible es ${formatUSD(context.creditAvailableCents)}, así que no puedo solicitarlo todavía.` };
    }
    const action: PendingAgentAction = { kind: 'create_bnpl_request', amountCents, installmentsCount: installments, frequency: 'mensual', purpose: 'Solicitud vía Copilot' };
    return {
      text: `${base} ¿Quieres que la solicite? Quedaría en revisión manual del banco, no se desembolsa al instante.`,
      pendingAction: action,
      uiHints: DEFAULT_CONFIRM_HINTS,
    };
  }

  // Solicitar crédito de libre disponibilidad directo — mismo camino de
  // revisión manual que CreditosView (ver plan): nunca desembolsa al instante.
  if (CREATE_CREDIT_RE.test(norm)) {
    const amountCents = extractAmountCents(msg);
    const installments = extractInstallments(msg) ?? 3;
    if (!amountCents) return { text: 'Decime cuánto necesitas — por ejemplo "quiero un crédito de $200 a 4 cuotas".' };
    if (amountCents > context.creditAvailableCents) {
      return { text: `Tu cupo disponible es ${formatUSD(context.creditAvailableCents)}, menor a ${formatUSD(amountCents)} — no puedo proponer esa solicitud todavía.` };
    }
    const action: PendingAgentAction = { kind: 'create_bnpl_request', amountCents, installmentsCount: installments, frequency: 'mensual', purpose: 'Solicitud vía Copilot' };
    return {
      text: `Voy a enviar tu solicitud de ${formatUSD(amountCents)} a ${installments} cuotas para que el banco la revise — no se desembolsa al instante. ¿Confirmas?`,
      pendingAction: action,
      uiHints: DEFAULT_CONFIRM_HINTS,
    };
  }

  // Estado de tu crédito/cuotas (lectura).
  if (BNPL_STATUS_RE.test(norm)) {
    const next = context.upcomingInstallments[0];
    const base = `Tu KORA Score es ${context.scoreValue} (banda ${context.scoreBand}), cupo disponible ${formatUSD(context.creditAvailableCents)}.`;
    if (!next) return { text: `${base} No tienes cuotas pendientes ahora mismo.` };
    return { text: `${base} Tu próxima cuota es de ${formatUSD(next.amountCents)}, vence el ${formatDate(next.dueDate)} (plan de ${next.installmentsCount} cuotas).` };
  }

  // Consultar obligaciones de GovTech pendientes (lectura).
  if (GOV_QUERY_RE.test(norm)) {
    if (context.unpaidObligations.length === 0) return { text: 'No tienes obligaciones pendientes con el Estado ahora mismo. 🎉' };
    const list = context.unpaidObligations
      .slice(0, 3)
      .map((o) => `• ${o.name} (${o.entity}) — ${formatVES(o.amountCents)}`)
      .join('\n');
    const first = context.unpaidObligations[0];
    // El chip incluye el nombre real de la obligación — así el clic manda un
    // mensaje que el propio `findObligationMatch` puede resolver, en vez de
    // un genérico "Págalo" que no apunta a ninguna obligación concreta.
    return { text: `Esto es lo que tienes pendiente:\n${list}`, uiHints: [`Paga "${first.name}"`, 'No, gracias'] };
  }

  // Últimos movimientos (lectura).
  if (TX_RE.test(norm)) {
    if (context.recentTransactions.length === 0) return { text: 'Todavía no tienes movimientos registrados.' };
    const list = context.recentTransactions
      .slice(0, 3)
      .map((t) => `• ${t.title} — ${t.direction === 'out' ? '-' : '+'}${fmtByCurrency(t.currency, t.amountCents)}`)
      .join('\n');
    return { text: `Tus últimos movimientos:\n${list}` };
  }

  // Saldo (lectura).
  if (BALANCE_RE.test(norm)) {
    return { text: `Hola ${context.userName.split(' ')[0]} — tienes ${formatUSD(context.balanceUsdCents)} y ${formatVES(context.balanceVesCents)}, más ${formatKRT(context.krtTotalCents)}.` };
  }

  // Recomendación de Marketplace (lectura, ligera a propósito).
  if (RECOMMEND_RE.test(norm)) {
    return { text: 'Puedo llevarte a la Tienda a ver lo mejor valorado y con cashback en puntos.', uiHints: ['Ver Tienda'] };
  }

  return {
    text: `Hola ${context.userName.split(' ')[0]} — puedo contarte tu saldo, tus cuotas, tus obligaciones con el Estado, convertir moneda, o hacer una transferencia o un pago si me dices el monto y a quién. ¿Qué necesitas?`,
  };
}

export const mockCopilotService: CopilotService = {
  async sendMessage(_history, userMessage, context, pendingAction): Promise<CopilotReply> {
    await simulateLatency(400, 900);
    return interpret(userMessage, context, pendingAction);
  },
};
