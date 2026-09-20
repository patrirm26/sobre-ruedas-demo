import { useKoraStore } from '../../state/store';
import { generateId } from '../../lib/ids';
import type { Order } from '../../domain/marketplace';
import type { MarketplaceService, CheckoutWithBalanceInput, RecordBnplOrderInput } from '../marketplaceService';
import { simulateLatency } from '../delay';
import { splitPayoutService } from '../splitPayoutService';

function describeItems(items: { productId: string; qty: number }[], productNames: Record<string, string>): string {
  return items.map((i) => `${productNames[i.productId] ?? 'Producto'}${i.qty > 1 ? ` x${i.qty}` : ''}`).join(', ');
}

export const mockMarketplaceService: MarketplaceService = {
  async checkoutWithBalance({ accountId, merchantId, items, totalCents, method, currency = 'USD' }: CheckoutWithBalanceInput): Promise<Order> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const account = state.accounts[accountId];
    const merchant = state.merchants[merchantId];
    if (!account || !merchant) throw new Error('Cuenta o comercio no encontrado.');

    const totalVesCents = Math.round(totalCents * state.bcvRateVesPerUsd);

    if (method === 'saldo' && currency === 'VES') {
      if (account.balanceVesCents < totalVesCents) throw new Error('Saldo en Bs insuficiente.');
      state.adjustBalance(accountId, 'VES', -totalVesCents);
    } else if (method === 'saldo') {
      if (account.balanceUsdCents < totalCents) throw new Error('Saldo en USD insuficiente.');
      state.adjustBalance(accountId, 'USD', -totalCents);
    } else {
      const krtCents = totalVesCents;
      const balances = state.krtBalances[accountId];
      if (!balances || balances.STD < krtCents) throw new Error('Saldo KRT-STD insuficiente.');
      state.adjustKrtBalance(accountId, 'STD', -krtCents);
    }

    const order: Order = {
      id: generateId('order'),
      accountId,
      merchantId,
      at: state.simulatedNowIso,
      items,
      totalCents,
      paymentMethod: method,
    };
    state.addOrder(order);

    const productNames = Object.fromEntries(Object.values(state.products).map((p) => [p.id, p.name]));
    const txAmountCents = method === 'saldo' ? (currency === 'VES' ? totalVesCents : totalCents) : totalVesCents;
    const txCurrency = method === 'saldo' ? currency : 'KRT';
    state.pushTransaction({
      id: generateId('tx'),
      accountId,
      at: state.simulatedNowIso,
      title: `Compra en ${merchant.name}`,
      subtitle: `Marketplace · Pago único · ${describeItems(items, productNames)}`,
      amountCents: txAmountCents,
      currency: txCurrency,
      direction: 'out',
      category: 'marketplace',
      relatedEntityId: order.id,
    });

    await splitPayoutService.recordSplit({
      accountId,
      source: 'marketplace',
      sourceLabel: `Compra en ${merchant.name}`,
      relatedEntityId: order.id,
      totalCents,
    });

    // Cashback por producto (KRT-REW), acreditado al confirmar la compra protegida.
    const cashbackKrtCents = items.reduce((sum, item) => {
      const product = state.products[item.productId];
      if (!product) return sum;
      const lineUsdCents = product.priceCents * item.qty;
      const cashbackUsdCents = Math.round(lineUsdCents * (product.cashbackPct / 100));
      return sum + Math.round(cashbackUsdCents * state.bcvRateVesPerUsd);
    }, 0);

    if (cashbackKrtCents > 0) {
      state.adjustKrtBalance(accountId, 'REW', cashbackKrtCents);
      const resultingRew = useKoraStore.getState().krtBalances[accountId].REW;
      state.appendLedgerEntry({
        id: generateId('krt-ledger'),
        at: state.simulatedNowIso,
        type: 'mint',
        from: null,
        to: { accountId, subBalance: 'REW', deltaCents: cashbackKrtCents, resultingBalanceCents: resultingRew },
        reason: `Cashback de compra en ${merchant.name}`,
      });
      state.pushTransaction({
        id: generateId('tx'),
        accountId,
        at: state.simulatedNowIso,
        title: 'Cashback de compra',
        subtitle: `Marketplace · ${merchant.name}`,
        amountCents: 0,
        currency: 'KRT',
        direction: 'in',
        category: 'token',
        krtDeltaCents: cashbackKrtCents,
        relatedEntityId: order.id,
      });
    }

    return order;
  },

  async recordBnplOrder({ accountId, merchantId, items, totalCents, installmentPlanId }: RecordBnplOrderInput): Promise<Order> {
    const state = useKoraStore.getState();
    const order: Order = {
      id: generateId('order'),
      accountId,
      merchantId,
      at: state.simulatedNowIso,
      items,
      totalCents,
      paymentMethod: 'bnpl',
      installmentPlanId,
    };
    state.addOrder(order);
    return order;
  },
};
