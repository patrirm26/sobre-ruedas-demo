import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { selectActiveAccount, selectActiveUser, selectActiveScoreSnapshot, selectKrtTotalCents, selectCreditAvailableCents, selectAccountTransactions } from '../../state/selectors';
import { IconCopilot, IconMic, IconMicOff, IconVolume, IconVolumeOff } from '../../components/icons';
import { useComingSoon } from '../../lib/comingSoon';
import { useSpeechRecognition } from '../../lib/useSpeechRecognition';
import { useSpeechSynthesis } from '../../lib/useSpeechSynthesis';
import { copilotService } from '../../services/copilotService';
import { paymentService } from '../../services/paymentService';
import { bnplService } from '../../services/bnplService';
import { convertService } from '../../services/convertService';
import { formatUSD, formatVES } from '../../lib/format';
import type { CopilotChatMessage, CopilotContext, PendingAgentAction } from '../../services/copilotService';

const SUGGESTIONS = ['¿Qué me vence pronto?', '¿Cuánto tengo?', 'Simula un crédito de $200 a 4 cuotas', '¿Cuánto es en bolívares $100?'];

/** Ejecuta la acción real correspondiente cuando el usuario confirma — cada
 * rama llama al mismo servicio que ya usan Pagar/Cuotas/GovTech/Tokens, así
 * que el resultado (saldo, transacción, cuota) es siempre el real, no uno
 * inventado por el agente. */
async function runPendingAction(accountId: string, action: PendingAgentAction): Promise<string> {
  switch (action.kind) {
    case 'transfer': {
      const tx = await paymentService.sendPayment({ accountId, to: action.to, amountCents: action.amountCents, currency: action.currency, concept: 'Vía Copilot' });
      return `✅ Transferí ${action.currency === 'USD' ? formatUSD(tx.amountCents) : formatVES(tx.amountCents)} a ${action.to}.`;
    }
    case 'pay_installment': {
      const plan = await bnplService.payInstallment(action.planId, action.installmentId);
      const remaining = plan.installments.filter((i) => i.status !== 'pagado').length;
      return `✅ Cuota pagada. Te quedan ${remaining} cuota${remaining === 1 ? '' : 's'} en este plan.`;
    }
    case 'pay_gov_obligation': {
      const tx = await paymentService.payObligation({ accountId, obligationId: action.obligationId });
      return `✅ Pagué "${tx.title}" — ${formatVES(tx.amountCents)}.`;
    }
    case 'convert_currency': {
      const result = await convertService.convert({ accountId, from: action.from, to: action.to, amountCents: action.amountCents });
      return `✅ Convertí a ${action.to === 'VES' ? formatVES(result.toAmountCents) : formatUSD(result.toAmountCents)}.`;
    }
    case 'create_bnpl_request': {
      const request = await bnplService.evaluate({
        accountId,
        amountCents: action.amountCents,
        merchantId: null,
        originLabel: action.purpose,
        manualReview: true,
        installmentsCount: action.installmentsCount,
        frequency: action.frequency,
      });
      const bcvRate = useKoraStore.getState().bcvRateVesPerUsd;
      return `✅ Envié tu solicitud de ${formatVES(Math.round(request.requestedAmountCents * bcvRate))} (≈ ${formatUSD(request.requestedAmountCents)}) — quedó en revisión manual, el banco te responde pronto.`;
    }
  }
}

export function CopilotView() {
  const account = useKoraStore(selectActiveAccount);
  const activeUser = useKoraStore(selectActiveUser);
  const score = useKoraStore(selectActiveScoreSnapshot);
  const krtTotalCents = useKoraStore(selectKrtTotalCents);
  const creditAvailableCents = useKoraStore(selectCreditAvailableCents);
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  const installmentPlans = useKoraStore((s) => s.installmentPlans);
  const govEntities = useKoraStore((s) => s.govEntities);
  const unpaidObligationsRaw = useKoraStore(useShallow((s) => s.obligations.filter((o) => !o.paid)));
  const accountTransactions = useKoraStore(useShallow(selectAccountTransactions));

  const messages = useKoraStore((s) => s.copilotMessages);
  const appendCopilotMessage = useKoraStore((s) => s.appendCopilotMessage);
  const copilotPendingAction = useKoraStore((s) => s.copilotPendingAction);
  const setCopilotPendingAction = useKoraStore((s) => s.setCopilotPendingAction);
  const copilotUiHints = useKoraStore((s) => s.copilotUiHints);
  const setCopilotUiHints = useKoraStore((s) => s.setCopilotUiHints);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(false);
  const comingSoon = useComingSoon();
  const { speak, supported: synthesisSupported } = useSpeechSynthesis();
  const {
    listening,
    start: startListening,
    stop: stopListening,
    supported: recognitionSupported,
  } = useSpeechRecognition((text) => {
    setInput(text);
    void send(text);
  });

  // Derivados con IDs reales para que el agente pueda ejecutar, no solo
  // informar — calculados en useMemo (no dentro de un selector Zustand) para
  // no romper la comparación shallow de las fuentes ya estables de arriba.
  const upcomingInstallments = useMemo(() => {
    if (!account) return [];
    return Object.values(installmentPlans)
      .filter((p) => p.accountId === account.id)
      .flatMap((p) =>
        p.installments
          .filter((i) => i.status !== 'pagado')
          .map((i) => ({ id: i.id, planId: p.id, installmentsCount: p.installmentsCount, amountCents: i.amountCents, dueDate: i.dueDate }))
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [installmentPlans, account]);

  const unpaidObligations = useMemo(
    () =>
      unpaidObligationsRaw.map((o) => ({
        id: o.id,
        name: o.name,
        entity: govEntities.find((e) => e.id === o.entityId)?.name ?? o.entityId,
        amountCents: o.amountCents,
      })),
    [unpaidObligationsRaw, govEntities]
  );

  const recentTransactions = useMemo(
    () =>
      [...accountTransactions]
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .slice(0, 5)
        .map((t) => ({ title: t.title, amountCents: t.amountCents, currency: t.currency, direction: t.direction, at: t.at })),
    [accountTransactions]
  );

  if (!account || !activeUser || !score) return null;

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const history: CopilotChatMessage[] = messages.map((m) => ({ role: m.from === 'bot' ? 'assistant' : 'user', text: m.text }));
    appendCopilotMessage({ from: 'user', text: trimmed });
    setInput('');
    setSending(true);

    const context: CopilotContext = {
      accountId: account.id,
      userName: activeUser.name,
      balanceUsdCents: account.balanceUsdCents,
      balanceVesCents: account.balanceVesCents,
      krtTotalCents,
      bcvRate,
      scoreValue: score.value,
      scoreBand: score.band,
      creditAvailableCents,
      upcomingInstallments,
      upcomingObligations: unpaidObligationsRaw.slice(0, 3).map((o) => ({
        name: o.name,
        entity: govEntities.find((e) => e.id === o.entityId)?.name ?? o.entityId,
        amountCents: o.amountCents,
        dueLabel: o.dueLabel,
      })),
      unpaidObligations,
      recentTransactions,
    };

    try {
      const reply = await copilotService.sendMessage(history, trimmed, context, copilotPendingAction ?? undefined);

      if (reply.intent === 'confirm' && copilotPendingAction) {
        const resultText = await runPendingAction(account.id, copilotPendingAction);
        appendCopilotMessage({ from: 'bot', text: resultText });
        if (voiceReplyEnabled) speak(resultText);
        setCopilotPendingAction(null);
        setCopilotUiHints([]);
      } else {
        if (reply.text) {
          appendCopilotMessage({ from: 'bot', text: reply.text });
          if (voiceReplyEnabled) speak(reply.text);
        }
        setCopilotPendingAction(reply.pendingAction ?? null);
        setCopilotUiHints(reply.uiHints ?? []);
      }
    } catch (e) {
      const errorText = `⚠️ ${(e as Error).message}`;
      appendCopilotMessage({ from: 'bot', text: errorText });
      if (voiceReplyEnabled) speak(errorText);
      setCopilotPendingAction(null);
      setCopilotUiHints([]);
    } finally {
      setSending(false);
    }
  };

  const hints = copilotUiHints.length ? copilotUiHints : SUGGESTIONS;

  return (
    <div className="cop-wrap">
      <div className="chat">
        <div className="chat-head">
          <div className="cop-avatar">
            <IconCopilot width={20} height={20} />
          </div>
          <div>
            <b>KORA Copilot</b>
            <span>● En línea · consulta tu cuenta y ejecuta acciones con tu confirmación</span>
          </div>
          <button
            className="tb-icon"
            style={{ marginLeft: 'auto' }}
            disabled={!synthesisSupported}
            onClick={() => setVoiceReplyEnabled((v) => !v)}
            title={
              !synthesisSupported
                ? 'Este navegador no puede leer respuestas en voz alta'
                : voiceReplyEnabled
                  ? 'Respuestas en voz alta: activado'
                  : 'Respuestas en voz alta: desactivado'
            }
            aria-label="Alternar respuestas en voz alta"
          >
            {voiceReplyEnabled ? <IconVolume width={18} height={18} /> : <IconVolumeOff width={18} height={18} />}
          </button>
          <span className="pill p-violet">PLAN BÁSICO</span>
        </div>
        <div className="chat-body">
          {messages.map((m, i) => (
            <div className={`msg ${m.from}`} key={i}>
              {m.text}
            </div>
          ))}
          {sending && (
            <div className="msg bot" style={{ opacity: 0.6 }}>
              Escribiendo…
            </div>
          )}
        </div>
        <div className="sugg">
          {hints.map((s) => (
            <button
              key={s}
              disabled={sending}
              onClick={() => (s === 'Ver Marketplace' ? comingSoon('Ir al Marketplace desde el Copilot') : send(s))}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="chat-in">
          <button
            className={`mic-btn ${listening ? 'active' : ''}`}
            disabled={sending}
            onClick={() => {
              if (!recognitionSupported) return comingSoon('Copilot por voz (no disponible en este navegador)');
              if (listening) stopListening();
              else startListening();
            }}
            title={!recognitionSupported ? 'No disponible en este navegador' : listening ? 'Escuchando… tocá para detener' : 'Hablar con el Copilot'}
            aria-label={listening ? 'Detener grabación de voz' : 'Hablar con el Copilot'}
          >
            {listening ? <IconMicOff width={18} height={18} /> : <IconMic width={18} height={18} />}
          </button>
          <input
            value={input}
            disabled={sending}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregúntale al Copilot..."
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
          />
          <button className="send-btn" disabled={sending} onClick={() => send(input)}>
            ➤
          </button>
        </div>
      </div>

      <div>
        <div className="cop-plan">
          <h4>
            Copilot Básico <span className="pill p-green">TU PLAN</span>
          </h4>
          <div className="cpp">Incluido gratis</div>
          <p>Recordatorios de vencimientos con el Estado, consulta de tu score, transferencias y pagos asistidos con tu confirmación.</p>
        </div>
        <div className="cop-plan hl">
          <h4>Copilot Avanzado</h4>
          <div className="cpp">
            $2,99/mes <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>· gratis con un plan de Cuotas activo</span>
          </div>
          <p>Todo lo básico + asistente tributario paso a paso, planificador de obligaciones y optimizador de crédito.</p>
          <button className="btn full" style={{ marginTop: 12, padding: 11 }} onClick={() => comingSoon('Copilot Avanzado')}>
            Activar Avanzado
          </button>
        </div>
        <div className="cop-plan">
          <h4>Copilot Empresarial</h4>
          <div className="cpp">$9,99/mes</div>
          <p>Para empresas: panel financiero, gestión de nómina y planificación de impuestos corporativos.</p>
          <button className="btn ghost full" style={{ marginTop: 12, padding: 11 }} onClick={() => comingSoon('Copilot Empresarial')}>
            Probar Empresarial
          </button>
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--faint)', lineHeight: 1.7, padding: '4px 6px' }}>
          🔒 <b style={{ color: 'var(--muted)' }}>Tu privacidad primero:</b> el Copilot solo ve lo necesario para
          responderte, y siempre te pide confirmar antes de mover tu dinero.
        </div>
      </div>
    </div>
  );
}
