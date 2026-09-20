import type { BankAllianceService } from '../bankAllianceService';
import type { LinkedBankAccount } from '../../domain/bankAlliance';
import { invokeEdgeFunction } from '../../lib/invokeEdgeFunction';
import { generateId } from '../../lib/ids';
import { useKoraStore } from '../../state/store';

/** A diferencia de bnpl/token/marketplace (passthroughs de una línea), acá
 * cada método también refleja el resultado en el store local — necesario
 * porque `AlianzasBancariasView.tsx`/`BankOperationModal.tsx` no actualizan
 * el store ellas mismas: hoy dependen 100% de que el servicio (antes solo el
 * mock) lo haga. Ver plan de "Integración bancaria real (lado KORA)". */
export const realBankAllianceService: BankAllianceService = {
  async linkBankAccount(input) {
    const linked = await invokeEdgeFunction<LinkedBankAccount>('bank-link-account', input);
    useKoraStore.getState().addLinkedBankAccount(linked);
    return linked;
  },

  async depositViaMobilePayment({ linkedAccountId, amountCents, currency }) {
    const result = await invokeEdgeFunction<{ referenceCode: string }>('bank-deposit-mobile-payment', {
      linkedAccountId,
      amountCents,
      currency,
    });

    const state = useKoraStore.getState();
    const linked = state.linkedBankAccounts.find((l) => l.id === linkedAccountId);
    if (linked) {
      const bank = state.allyBanks.find((b) => b.id === linked.bankId);
      state.adjustBalance(linked.accountId, currency, amountCents);
      state.pushTransaction({
        id: generateId('tx'),
        accountId: linked.accountId,
        at: state.simulatedNowIso,
        title: 'Pago Móvil recibido',
        subtitle: `${bank?.name ?? 'Banco aliado'} · Ref. ${result.referenceCode}`,
        amountCents,
        currency,
        direction: 'in',
        category: 'banco',
        relatedEntityId: linked.id,
      });
    }

    return result;
  },

  async withdrawViaBankTransfer({ linkedAccountId, amountCents, currency }) {
    await invokeEdgeFunction<Record<string, never>>('bank-withdraw-transfer', { linkedAccountId, amountCents, currency });

    const state = useKoraStore.getState();
    const linked = state.linkedBankAccounts.find((l) => l.id === linkedAccountId);
    if (linked) {
      const bank = state.allyBanks.find((b) => b.id === linked.bankId);
      state.adjustBalance(linked.accountId, currency, -amountCents);
      state.pushTransaction({
        id: generateId('tx'),
        accountId: linked.accountId,
        at: state.simulatedNowIso,
        title: `Transferencia a ${bank?.name ?? 'banco aliado'}`,
        subtitle: `Cuenta •••• ${linked.accountNumber.slice(-4)}`,
        amountCents,
        currency,
        direction: 'out',
        category: 'banco',
        relatedEntityId: linked.id,
      });
    }
  },
};
