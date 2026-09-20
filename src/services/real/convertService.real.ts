import type { ConvertService, ConvertInput, ConvertResult, ConvertCurrency } from '../convertService';
import { invokeEdgeFunction } from '../../lib/invokeEdgeFunction';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { tokenService } from '../tokenService';

async function readVesBalanceCents(accountId: string): Promise<number> {
  const { data, error } = await getSupabaseClient().from('accounts').select('balance_ves_cents').eq('id', accountId).single();
  if (error) throw new Error(error.message);
  return data.balance_ves_cents;
}

async function readKrtStdCents(accountId: string): Promise<number> {
  const { data, error } = await getSupabaseClient().from('krt_balances').select('std_cents').eq('account_id', accountId).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.std_cents ?? 0;
}

function requireFiat(c: ConvertCurrency): 'VES' | 'USD' {
  if (c === 'KRT') throw new Error('Moneda inesperada.');
  return c;
}

export const realConvertService: ConvertService = {
  async convert({ accountId, from, to, amountCents }: ConvertInput): Promise<ConvertResult> {
    if (amountCents <= 0) throw new Error('El monto debe ser mayor a cero.');
    if (from === to) throw new Error('El origen y el destino no pueden ser la misma moneda.');

    if (from !== 'KRT' && to !== 'KRT') {
      return invokeEdgeFunction<ConvertResult>('convert-fiat', { accountId, from: requireFiat(from), to: requireFiat(to), amountCents });
    }

    if (from === 'KRT') {
      const vesBefore = await readVesBalanceCents(accountId);
      await tokenService.burn({ accountId, krtAmountCents: amountCents });
      const vesAfter = await readVesBalanceCents(accountId);
      const vesOutCents = vesAfter - vesBefore;
      if (to === 'VES') return { toAmountCents: vesOutCents };
      return invokeEdgeFunction<ConvertResult>('convert-fiat', { accountId, from: 'VES', to: 'USD', amountCents: vesOutCents });
    }

    const vesInCents =
      from === 'USD'
        ? (await invokeEdgeFunction<ConvertResult>('convert-fiat', { accountId, from: 'USD', to: 'VES', amountCents })).toAmountCents
        : amountCents;
    const krtBefore = await readKrtStdCents(accountId);
    await tokenService.mint({ accountId, vesAmountCents: vesInCents });
    const krtAfter = await readKrtStdCents(accountId);
    return { toAmountCents: krtAfter - krtBefore };
  },
};
