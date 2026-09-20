import { useKoraStore } from '../../state/store';
import { generateId } from '../../lib/ids';
import type { KrtLedgerEntry } from '../../domain/token';
import type { TokenService, MintInput, BurnInput, TransferInput } from '../tokenService';
import { simulateLatency } from '../delay';
import { checkMintThreshold } from '../kycLimits';

const CONVERSION_FEE_PCT = 0.01; // [AJUSTAR] comisión de conversión mint/burn
const COLLATERAL_RATIO_PCT = 120; // [AJUSTAR] garantía KRT-STD requerida sobre el monto financiado

function sumRecentMintsUsdCents(
  ledger: KrtLedgerEntry[],
  accountId: string,
  nowIso: string,
  bcvRate: number,
  windowDays = 30
): number {
  const cutoff = new Date(nowIso).getTime() - windowDays * 86_400_000;
  const totalKrtCents = ledger
    .filter((e) => e.type === 'mint' && e.to?.accountId === accountId && new Date(e.at).getTime() >= cutoff)
    .reduce((sum, e) => sum + (e.to?.deltaCents ?? 0), 0);
  return Math.round(totalKrtCents / bcvRate);
}

export const mockTokenService: TokenService = {
  async mint({ accountId, vesAmountCents }: MintInput): Promise<KrtLedgerEntry> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const account = state.accounts[accountId];
    const user = Object.values(state.users).find((u) => u.primaryAccountId === accountId);
    if (!account || !user) throw new Error('Cuenta no encontrada.');
    if (vesAmountCents <= 0) throw new Error('El monto debe ser mayor a cero.');
    if (account.balanceVesCents < vesAmountCents) throw new Error('Saldo en Bs insuficiente.');

    const krtOutCents = Math.round(vesAmountCents * (1 - CONVERSION_FEE_PCT));
    const additionalUsdCents = Math.round(krtOutCents / state.bcvRateVesPerUsd);
    const usedUsdCents = sumRecentMintsUsdCents(state.krtLedger, accountId, state.simulatedNowIso, state.bcvRateVesPerUsd);
    const kycCheck = checkMintThreshold(user.kycLevel, usedUsdCents, additionalUsdCents);

    if (kycCheck.requiresVerification) {
      state.addAlert({
        id: generateId('compliance-alert'),
        at: state.simulatedNowIso,
        userId: user.id,
        message: `Intento de compra de KRT por $${(additionalUsdCents / 100).toFixed(2)} — supera el límite mensual de Nivel ${kycCheck.currentLevel} ($${(kycCheck.limitUsdCents / 100).toFixed(2)}).`,
        status: 'abierta',
      });
      throw new Error(
        `KYC_REQUIRED: Este monto supera tu límite mensual de compra de KRT ($${(kycCheck.limitUsdCents / 100).toFixed(2)} · Nivel ${kycCheck.currentLevel}). Se requiere verificación adicional para continuar.`
      );
    }

    state.adjustBalance(accountId, 'VES', -vesAmountCents);
    state.adjustKrtBalance(accountId, 'STD', krtOutCents);
    const resultingStd = useKoraStore.getState().krtBalances[accountId].STD;

    const entry: KrtLedgerEntry = {
      id: generateId('krt-ledger'),
      at: state.simulatedNowIso,
      type: 'mint',
      from: null,
      to: { accountId, subBalance: 'STD', deltaCents: krtOutCents, resultingBalanceCents: resultingStd },
      reason: 'Compra de KRT · Bs → KRT-STD',
    };
    state.appendLedgerEntry(entry);
    state.pushTransaction({
      id: generateId('tx'),
      accountId,
      at: state.simulatedNowIso,
      title: 'Compra de KRT',
      subtitle: 'Mint · Bs → KRT-STD',
      amountCents: vesAmountCents,
      currency: 'VES',
      direction: 'out',
      category: 'token',
      krtDeltaCents: krtOutCents,
    });

    return entry;
  },

  async burn({ accountId, krtAmountCents }: BurnInput): Promise<KrtLedgerEntry> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const balances = state.krtBalances[accountId];
    if (!balances) throw new Error('Cuenta no encontrada.');
    if (krtAmountCents <= 0) throw new Error('El monto debe ser mayor a cero.');
    if (balances.STD < krtAmountCents) throw new Error('Saldo KRT-STD insuficiente.');

    const vesOutCents = Math.round(krtAmountCents * (1 - CONVERSION_FEE_PCT));

    state.adjustKrtBalance(accountId, 'STD', -krtAmountCents);
    state.adjustBalance(accountId, 'VES', vesOutCents);
    const resultingStd = useKoraStore.getState().krtBalances[accountId].STD;

    const entry: KrtLedgerEntry = {
      id: generateId('krt-ledger'),
      at: state.simulatedNowIso,
      type: 'burn',
      from: { accountId, subBalance: 'STD', deltaCents: -krtAmountCents, resultingBalanceCents: resultingStd },
      to: null,
      reason: 'Conversión de KRT-STD a bolívares',
    };
    state.appendLedgerEntry(entry);
    state.pushTransaction({
      id: generateId('tx'),
      accountId,
      at: state.simulatedNowIso,
      title: 'Conversión a bolívares',
      subtitle: 'Burn · KRT-STD → Bs',
      amountCents: vesOutCents,
      currency: 'VES',
      direction: 'in',
      category: 'token',
      krtDeltaCents: -krtAmountCents,
    });

    return entry;
  },

  async transfer({ fromAccountId, toAccountId, krtAmountCents }: TransferInput): Promise<KrtLedgerEntry> {
    await simulateLatency();
    if (fromAccountId === toAccountId) throw new Error('No puedes transferirte KRT a ti mismo.');
    const state = useKoraStore.getState();
    const fromBalances = state.krtBalances[fromAccountId];
    const toAccount = state.accounts[toAccountId];
    if (!fromBalances || !toAccount) throw new Error('Cuenta no encontrada.');
    if (krtAmountCents <= 0) throw new Error('El monto debe ser mayor a cero.');
    if (fromBalances.STD < krtAmountCents) throw new Error('Saldo KRT-STD insuficiente. Solo el KRT-STD se puede transferir.');

    state.adjustKrtBalance(fromAccountId, 'STD', -krtAmountCents);
    state.adjustKrtBalance(toAccountId, 'STD', krtAmountCents);
    const after = useKoraStore.getState().krtBalances;

    const entry: KrtLedgerEntry = {
      id: generateId('krt-ledger'),
      at: state.simulatedNowIso,
      type: 'transfer',
      from: { accountId: fromAccountId, subBalance: 'STD', deltaCents: -krtAmountCents, resultingBalanceCents: after[fromAccountId].STD },
      to: { accountId: toAccountId, subBalance: 'STD', deltaCents: krtAmountCents, resultingBalanceCents: after[toAccountId].STD },
      reason: 'Transferencia entre usuarios KORA',
    };
    state.appendLedgerEntry(entry);
    state.pushTransaction({
      id: generateId('tx'),
      accountId: fromAccountId,
      at: state.simulatedNowIso,
      title: 'Transferencia de KRT enviada',
      subtitle: 'KRT-STD · entre usuarios KORA',
      amountCents: 0,
      currency: 'KRT',
      direction: 'out',
      category: 'token',
      krtDeltaCents: -krtAmountCents,
    });
    state.pushTransaction({
      id: generateId('tx'),
      accountId: toAccountId,
      at: state.simulatedNowIso,
      title: 'Transferencia de KRT recibida',
      subtitle: 'KRT-STD · entre usuarios KORA',
      amountCents: 0,
      currency: 'KRT',
      direction: 'in',
      category: 'token',
      krtDeltaCents: krtAmountCents,
    });

    return entry;
  },

  async lockCollateral(accountId: string, installmentPlanId: string, principalUsdCents: number): Promise<KrtLedgerEntry> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const balances = state.krtBalances[accountId];
    if (!balances) throw new Error('Cuenta no encontrada.');

    const lockedKrtCents = Math.round(principalUsdCents * (COLLATERAL_RATIO_PCT / 100) * state.bcvRateVesPerUsd);
    if (balances.STD < lockedKrtCents) {
      throw new Error(`Saldo KRT-STD insuficiente para cubrir la garantía del ${COLLATERAL_RATIO_PCT}%.`);
    }

    state.adjustKrtBalance(accountId, 'STD', -lockedKrtCents);
    state.adjustKrtBalance(accountId, 'COL', lockedKrtCents);
    const after = useKoraStore.getState().krtBalances[accountId];

    const entry: KrtLedgerEntry = {
      id: generateId('krt-ledger'),
      at: state.simulatedNowIso,
      type: 'lock',
      from: { accountId, subBalance: 'STD', deltaCents: -lockedKrtCents, resultingBalanceCents: after.STD },
      to: { accountId, subBalance: 'COL', deltaCents: lockedKrtCents, resultingBalanceCents: after.COL },
      relatedEntityId: installmentPlanId,
      reason: `Garantía bloqueada (${COLLATERAL_RATIO_PCT}%) para el plan de crédito`,
    };
    state.appendLedgerEntry(entry);

    return entry;
  },

  async releaseCollateral(accountId: string, installmentPlanId: string, amountCents: number): Promise<KrtLedgerEntry> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const balances = state.krtBalances[accountId];
    if (!balances) throw new Error('Cuenta no encontrada.');
    const releaseCents = Math.min(amountCents, balances.COL);

    state.adjustKrtBalance(accountId, 'COL', -releaseCents);
    state.adjustKrtBalance(accountId, 'STD', releaseCents);
    const after = useKoraStore.getState().krtBalances[accountId];

    const entry: KrtLedgerEntry = {
      id: generateId('krt-ledger'),
      at: state.simulatedNowIso,
      type: 'unlock',
      from: { accountId, subBalance: 'COL', deltaCents: -releaseCents, resultingBalanceCents: after.COL },
      to: { accountId, subBalance: 'STD', deltaCents: releaseCents, resultingBalanceCents: after.STD },
      relatedEntityId: installmentPlanId,
      reason: 'Liberación de garantía por pago de cuota',
    };
    state.appendLedgerEntry(entry);

    return entry;
  },

  async getReserveProof() {
    await simulateLatency(150, 400);
    const state = useKoraStore.getState();
    const totalMintedCents = Object.values(state.krtBalances).reduce(
      (sum, b) => sum + b.STD + b.REW + b.CRD + b.COL,
      0
    );
    const ratioPct = 102; // [AJUSTAR] margen ilustrativo de sobre-colateralización
    const totalBackingCents = Math.round(totalMintedCents * (ratioPct / 100));

    return {
      totalMintedCents,
      totalBackingCents,
      ratioPct,
      asOf: state.simulatedNowIso,
    };
  },
};
