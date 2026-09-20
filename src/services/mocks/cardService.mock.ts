import { useKoraStore } from '../../state/store';
import { generateId } from '../../lib/ids';
import { recordAudit } from '../../state/slices/auditSlice';
import { KYC_LIMITS } from '../kycLimits';
import { MIN_KYC_LEVEL_TO_ISSUE_CARD, generateLast4, generateCvv } from '../cardRules';
import { creditCashback } from './paymentService.mock';
import type { Card } from '../../domain/card';
import type { Transaction } from '../../domain/transaction';
import type {
  CardService,
  IssueCardInput,
  SetDailyLimitInput,
  SetFrozenInput,
  CancelCardInput,
  CardPurchaseInput,
} from '../cardService';
import { simulateLatency } from '../delay';

const CARD_LIFESPAN_YEARS = 4;

export const mockCardService: CardService = {
  async issueCard({ accountId }: IssueCardInput): Promise<Card> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const account = state.accounts[accountId];
    const owner = Object.values(state.users).find((u) => u.primaryAccountId === accountId);
    if (!account || !owner) throw new Error('Cuenta no encontrada.');
    if (owner.kycLevel < MIN_KYC_LEVEL_TO_ISSUE_CARD) {
      throw new Error(`Necesitas al menos verificación Nivel ${MIN_KYC_LEVEL_TO_ISSUE_CARD} para emitir una tarjeta KORA.`);
    }
    const hasLiveCard = state.cards.some((c) => c.accountId === accountId && c.status !== 'cancelada');
    if (hasLiveCard) throw new Error('Ya tienes una tarjeta KORA activa o congelada.');

    const issuedAt = state.simulatedNowIso;
    const issuedDate = new Date(issuedAt);
    const card: Card = {
      id: generateId('card'),
      accountId,
      last4: generateLast4(),
      expiryMonth: issuedDate.getMonth() + 1,
      expiryYear: issuedDate.getFullYear() + CARD_LIFESPAN_YEARS,
      status: 'activa',
      dailyLimitCents: KYC_LIMITS[owner.kycLevel].daily,
      issuedAt,
      cvv: generateCvv(),
    };
    state.addCard(card);
    return card;
  },

  async setDailyLimit({ cardId, dailyLimitCents }: SetDailyLimitInput): Promise<Card> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) throw new Error('Tarjeta no encontrada.');
    const owner = Object.values(state.users).find((u) => u.primaryAccountId === card.accountId);
    const maxDailyCents = KYC_LIMITS[owner?.kycLevel ?? 0].daily;
    if (dailyLimitCents <= 0 || dailyLimitCents > maxDailyCents) {
      throw new Error(`El límite diario debe estar entre $0.01 y ${(maxDailyCents / 100).toFixed(2)} (tu límite KYC).`);
    }
    state.updateCard(cardId, { dailyLimitCents });
    return { ...card, dailyLimitCents };
  },

  async setFrozen({ cardId, frozen }: SetFrozenInput): Promise<Card> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) throw new Error('Tarjeta no encontrada.');
    if (card.status === 'cancelada') throw new Error('Esta tarjeta está cancelada.');
    const status = frozen ? ('congelada' as const) : ('activa' as const);
    state.updateCard(cardId, { status });
    recordAudit({
      action: 'cards.set_frozen',
      targetType: 'card',
      targetId: cardId,
      detail: `${frozen ? 'Congeló' : 'Descongeló'} la tarjeta •••• ${card.last4}`,
    });
    return { ...card, status };
  },

  async cancelCard({ cardId }: CancelCardInput): Promise<Card> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) throw new Error('Tarjeta no encontrada.');
    if (card.status === 'cancelada') throw new Error('Esta tarjeta ya está cancelada.');
    state.updateCard(cardId, { status: 'cancelada' });
    recordAudit({
      action: 'cards.cancel',
      targetType: 'card',
      targetId: cardId,
      detail: `Canceló la tarjeta •••• ${card.last4}`,
    });
    return { ...card, status: 'cancelada' };
  },

  async purchase({ cardId, amountCents, merchantName }: CardPurchaseInput): Promise<Transaction> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) throw new Error('Tarjeta no encontrada.');
    if (card.status === 'congelada') throw new Error('Tu tarjeta está congelada — descongélala para poder comprar.');
    if (card.status === 'cancelada') throw new Error('Esta tarjeta está cancelada.');
    if (amountCents <= 0) throw new Error('El monto debe ser mayor a cero.');
    if (amountCents > card.dailyLimitCents) {
      throw new Error(`El monto supera tu límite diario de la tarjeta (${(card.dailyLimitCents / 100).toFixed(2)} USD).`);
    }
    const account = state.accounts[card.accountId];
    if (!account || account.balanceUsdCents < amountCents) throw new Error('Saldo en USD insuficiente.');

    state.adjustBalance(card.accountId, 'USD', -amountCents);

    const tx: Transaction = {
      id: generateId('tx'),
      accountId: card.accountId,
      at: state.simulatedNowIso,
      title: `Compra en ${merchantName}`,
      subtitle: `Tarjeta KORA •••• ${card.last4}`,
      amountCents,
      currency: 'USD',
      direction: 'out',
      category: 'tarjeta',
      relatedEntityId: card.id,
    };
    state.pushTransaction(tx);

    const cashbackPct = state.loyaltyRates.find((r) => r.channel === 'tarjeta')?.cashbackPct ?? 0;
    creditCashback(card.accountId, amountCents, cashbackPct, `Compra con tarjeta — ${merchantName}`, tx.id);

    return tx;
  },
};
