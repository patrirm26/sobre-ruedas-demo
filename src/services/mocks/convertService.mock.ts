import { useKoraStore } from '../../state/store';
import { generateId } from '../../lib/ids';
import type { ConvertService, ConvertInput, ConvertResult, ConvertCurrency } from '../convertService';
import { simulateLatency } from '../delay';
import { tokenService } from '../tokenService';

/** Tramo VES↔USD directo — sin comisión, tasa BCV pura. Registra dos
 * transacciones (out/in) con el mismo relatedEntityId, mismo criterio que
 * la Edge Function real, para que Historial las pueda agrupar. */
function convertFiatDirect(accountId: string, from: 'VES' | 'USD', to: 'VES' | 'USD', amountCents: number): ConvertResult {
  const state = useKoraStore.getState();
  const bcvRate = state.bcvRateVesPerUsd;
  const toAmountCents = from === 'VES' ? Math.round(amountCents / bcvRate) : Math.round(amountCents * bcvRate);
  if (toAmountCents <= 0) throw new Error('El monto convertido queda en cero — sube el monto de origen.');

  state.adjustBalance(accountId, from, -amountCents);
  state.adjustBalance(accountId, to, toAmountCents);

  const relatedEntityId = generateId('convert');
  const subtitle = `Tasa BCV ${bcvRate.toFixed(2)} Bs/$`;
  state.pushTransaction({
    id: generateId('tx'),
    accountId,
    at: state.simulatedNowIso,
    title: `Convertir ${from} → ${to}`,
    subtitle,
    amountCents,
    currency: from,
    direction: 'out',
    category: 'convert',
    relatedEntityId,
  });
  state.pushTransaction({
    id: generateId('tx'),
    accountId,
    at: state.simulatedNowIso,
    title: `Convertir ${from} → ${to}`,
    subtitle,
    amountCents: toAmountCents,
    currency: to,
    direction: 'in',
    category: 'convert',
    relatedEntityId,
  });

  return { toAmountCents };
}

function requireFiat(c: ConvertCurrency): 'VES' | 'USD' {
  if (c === 'KRT') throw new Error('Moneda inesperada.');
  return c;
}

export const mockConvertService: ConvertService = {
  async convert({ accountId, from, to, amountCents }: ConvertInput): Promise<ConvertResult> {
    await simulateLatency();
    if (amountCents <= 0) throw new Error('El monto debe ser mayor a cero.');
    if (from === to) throw new Error('El origen y el destino no pueden ser la misma moneda.');

    if (from !== 'KRT' && to !== 'KRT') {
      return convertFiatDirect(accountId, requireFiat(from), requireFiat(to), amountCents);
    }

    if (from === 'KRT') {
      // KRT -> VES (burn, ya cobra su comisión) -> opcionalmente VES -> USD.
      const vesBefore = useKoraStore.getState().accounts[accountId]?.balanceVesCents ?? 0;
      await tokenService.burn({ accountId, krtAmountCents: amountCents });
      const vesAfter = useKoraStore.getState().accounts[accountId]?.balanceVesCents ?? 0;
      const vesOutCents = vesAfter - vesBefore;
      if (to === 'VES') return { toAmountCents: vesOutCents };
      return convertFiatDirect(accountId, 'VES', 'USD', vesOutCents);
    }

    // to === 'KRT': opcionalmente USD -> VES (sin comisión) -> VES -> KRT (mint, ya cobra su comisión).
    const vesInCents = from === 'USD' ? convertFiatDirect(accountId, 'USD', 'VES', amountCents).toAmountCents : amountCents;
    const krtBefore = useKoraStore.getState().krtBalances[accountId]?.STD ?? 0;
    await tokenService.mint({ accountId, vesAmountCents: vesInCents });
    const krtAfter = useKoraStore.getState().krtBalances[accountId]?.STD ?? 0;
    return { toAmountCents: krtAfter - krtBefore };
  },
};
