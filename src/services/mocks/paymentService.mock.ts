import { useKoraStore } from '../../state/store';
import { generateId } from '../../lib/ids';
import type { Transaction } from '../../domain/transaction';
import type {
  PaymentService,
  SendPaymentInput,
  ReceivePaymentInput,
  SendRemesaInput,
  PayObligationInput,
  PayObligationWithBnplInput,
} from '../paymentService';
import { simulateLatency } from '../delay';
import { formatVES } from '../../lib/format';

const CHANNEL_LABEL: Record<ReceivePaymentInput['channel'], string> = {
  qr: 'Código QR',
  movil: 'Pago Móvil',
  link: 'Link de cobro',
};

/** Cashback KRT-REW — mismo patrón mint + ledger + transacción que
 * `checkoutWithBalance` en marketplaceService.mock.ts. `amountUsdEquivalentCents`
 * ya viene convertido a USD para que el cálculo de KRT sea consistente entre monedas.
 * Exportada para que otros mocks (ej. bnplService.mock.ts) la reutilicen en vez de
 * duplicar el patrón — las tasas por canal viven en `state.loyaltyRates` (Loyalty). */
export function creditCashback(accountId: string, amountUsdEquivalentCents: number, pct: number, reason: string, relatedEntityId: string) {
  const state = useKoraStore.getState();
  const cashbackKrtCents = Math.round(amountUsdEquivalentCents * state.bcvRateVesPerUsd * (pct / 100));
  if (cashbackKrtCents <= 0) return;

  state.adjustKrtBalance(accountId, 'REW', cashbackKrtCents);
  const resultingRew = useKoraStore.getState().krtBalances[accountId].REW;
  state.appendLedgerEntry({
    id: generateId('krt-ledger'),
    at: state.simulatedNowIso,
    type: 'mint',
    from: null,
    to: { accountId, subBalance: 'REW', deltaCents: cashbackKrtCents, resultingBalanceCents: resultingRew },
    relatedEntityId,
    reason,
  });
  state.pushTransaction({
    id: generateId('tx'),
    accountId,
    at: state.simulatedNowIso,
    title: 'Cashback recibido',
    subtitle: reason,
    amountCents: 0,
    currency: 'KRT',
    direction: 'in',
    category: 'token',
    krtDeltaCents: cashbackKrtCents,
    relatedEntityId,
  });
}

export const mockPaymentService: PaymentService = {
  async sendPayment({ accountId, to, amountCents, currency, concept }: SendPaymentInput): Promise<Transaction> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const account = state.accounts[accountId];
    if (!account) throw new Error('Cuenta no encontrada.');

    if (currency === 'USD') {
      if (account.balanceUsdCents < amountCents) throw new Error('Saldo en USD insuficiente.');
      state.adjustBalance(accountId, 'USD', -amountCents);
    } else if (currency === 'VES') {
      if (account.balanceVesCents < amountCents) throw new Error('Saldo en bolívares insuficiente.');
      state.adjustBalance(accountId, 'VES', -amountCents);
    } else {
      const balances = state.krtBalances[accountId];
      if (!balances || balances.STD < amountCents) throw new Error('Saldo KRT-STD insuficiente.');
      state.adjustKrtBalance(accountId, 'STD', -amountCents);
    }

    const tx: Transaction = {
      id: generateId('tx'),
      accountId,
      at: state.simulatedNowIso,
      title: `Pago a ${to}`,
      subtitle: concept,
      amountCents,
      currency,
      direction: 'out',
      category: 'pago',
    };
    state.pushTransaction(tx);
    return tx;
  },

  async receivePayment({ accountId, amountCents, currency, concept, channel, cashbackPct }: ReceivePaymentInput): Promise<Transaction> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const account = state.accounts[accountId];
    if (!account) throw new Error('Cuenta no encontrada.');

    state.adjustBalance(accountId, currency, amountCents);

    const tx: Transaction = {
      id: generateId('tx'),
      accountId,
      at: state.simulatedNowIso,
      title: 'Pago recibido',
      subtitle: `${CHANNEL_LABEL[channel]} · ${concept}`,
      amountCents,
      currency,
      direction: 'in',
      category: 'cobro',
    };
    state.pushTransaction(tx);

    if (cashbackPct) {
      const amountUsdEquivalentCents = currency === 'USD' ? amountCents : Math.round(amountCents / state.bcvRateVesPerUsd);
      creditCashback(accountId, amountUsdEquivalentCents, cashbackPct, `Cobro por ${CHANNEL_LABEL[channel]}`, tx.id);
    }

    return tx;
  },

  async sendRemesa({ accountId, amountUsdCents, feePct, rate, destCurrency, country, recipientName }: SendRemesaInput): Promise<Transaction> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const account = state.accounts[accountId];
    if (!account) throw new Error('Cuenta no encontrada.');
    if (account.balanceUsdCents < amountUsdCents) throw new Error('Saldo en USD insuficiente.');

    state.adjustBalance(accountId, 'USD', -amountUsdCents);

    const receivesAmount = Math.round((amountUsdCents / 100) * (1 - feePct / 100) * rate);
    const tx: Transaction = {
      id: generateId('tx'),
      accountId,
      at: state.simulatedNowIso,
      title: `Remesa a ${country}`,
      subtitle: `${recipientName || 'Destinatario'} recibe ${receivesAmount.toLocaleString('es-VE')} ${destCurrency}`,
      amountCents: amountUsdCents,
      currency: 'USD',
      direction: 'out',
      category: 'remesa',
    };
    state.pushTransaction(tx);

    const remesaCashbackPct = state.loyaltyRates.find((r) => r.channel === 'remesa')?.cashbackPct ?? 0;
    creditCashback(accountId, amountUsdCents, remesaCashbackPct, `Remesa enviada a ${country}`, tx.id);

    return tx;
  },

  async payObligation({ accountId, obligationId }: PayObligationInput): Promise<Transaction> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const account = state.accounts[accountId];
    const obligation = state.obligations.find((o) => o.id === obligationId);
    if (!account || !obligation) throw new Error('Obligación no encontrada.');
    if (obligation.paid) throw new Error('Esta obligación ya está pagada.');
    if (account.balanceVesCents < obligation.amountCents) throw new Error('Saldo en bolívares insuficiente.');

    const entityName = state.govEntities.find((e) => e.id === obligation.entityId)?.name ?? obligation.entityId;

    state.adjustBalance(accountId, 'VES', -obligation.amountCents);
    state.markObligationPaid(obligationId);

    const tx: Transaction = {
      id: generateId('tx'),
      accountId,
      at: state.simulatedNowIso,
      title: obligation.name,
      subtitle: `${entityName} · Pago al Estado`,
      amountCents: obligation.amountCents,
      currency: 'VES',
      direction: 'out',
      category: 'gobierno',
      relatedEntityId: obligation.id,
    };
    state.pushTransaction(tx);

    const govtechCashbackPct = state.loyaltyRates.find((r) => r.channel === 'govtech')?.cashbackPct ?? 0;
    const amountUsdEquivalentCents = Math.round(obligation.amountCents / state.bcvRateVesPerUsd);
    creditCashback(accountId, amountUsdEquivalentCents, govtechCashbackPct, `Pago al Estado — ${entityName}`, tx.id);

    return tx;
  },

  async payObligationWithBnplDisbursement({ accountId, obligationId, installmentPlanId }: PayObligationWithBnplInput): Promise<Transaction> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const account = state.accounts[accountId];
    const obligation = state.obligations.find((o) => o.id === obligationId);
    const plan = state.installmentPlans[installmentPlanId];
    if (!account || !obligation) throw new Error('Obligación no encontrada.');
    if (obligation.paid) throw new Error('Esta obligación ya está pagada.');
    if (!plan) throw new Error('Plan de KORA Cuotas no encontrado.');

    // El plan ya desembolsó su principal en USD al saldo (bnplService.createPlan,
    // camino merchantId: null) — acá se "gasta" ese desembolso para liquidar la
    // obligación. Se liquida en el equivalente USD evaluado al pedir el plan, sin
    // modelar un movimiento literal de Bs — mismo criterio [AJUSTAR] que el resto
    // de conversiones bcvRate del proyecto.
    if (account.balanceUsdCents < plan.principalCents) throw new Error('El desembolso del plan no alcanza para cubrir la obligación.');

    const entityName = state.govEntities.find((e) => e.id === obligation.entityId)?.name ?? obligation.entityId;

    state.adjustBalance(accountId, 'USD', -plan.principalCents);
    state.markObligationPaid(obligationId);

    const tx: Transaction = {
      id: generateId('tx'),
      accountId,
      at: state.simulatedNowIso,
      title: obligation.name,
      subtitle: `${entityName} · Diferido con KORA Cuotas · equivalente a ${formatVES(obligation.amountCents)}`,
      amountCents: plan.principalCents,
      currency: 'USD',
      direction: 'out',
      category: 'gobierno',
      relatedEntityId: obligation.id,
    };
    state.pushTransaction(tx);

    const govtechCashbackPct = state.loyaltyRates.find((r) => r.channel === 'govtech')?.cashbackPct ?? 0;
    creditCashback(accountId, plan.principalCents, govtechCashbackPct, `Pago al Estado — ${entityName}`, tx.id);

    return tx;
  },
};
