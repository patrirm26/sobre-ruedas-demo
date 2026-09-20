import { useKoraStore } from '../../state/store';
import { generateId } from '../../lib/ids';
import { formatUSD } from '../../lib/format';
import type { FundPosition } from '../../domain/investmentFund';
import type { InvestmentFundService, InvestFundInput, WithdrawFundInput } from '../investmentFundService';
import { simulateLatency } from '../delay';
import { computeAccrual, withdrawFromPosition, MIN_KYC_LEVEL_TO_INVEST } from '../investmentFundRules';

export const mockInvestmentFundService: InvestmentFundService = {
  async invest({ accountId, fundId, amountCents }: InvestFundInput): Promise<FundPosition> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const account = state.accounts[accountId];
    const fund = state.funds.find((f) => f.id === fundId);
    if (!account || !fund) throw new Error('Cuenta o fondo no encontrado.');
    if (amountCents <= 0) throw new Error('El monto debe ser mayor a cero.');
    if (amountCents < fund.minInvestmentCents) {
      throw new Error(`El monto mínimo para invertir en ${fund.name} es ${formatUSD(fund.minInvestmentCents)}.`);
    }
    if (account.balanceUsdCents < amountCents) throw new Error('Saldo en USD insuficiente.');

    const owner = Object.values(state.users).find((u) => u.primaryAccountId === accountId);
    if (!owner) throw new Error('Cuenta no encontrada.');
    if (owner.kycLevel < MIN_KYC_LEVEL_TO_INVEST) {
      throw new Error(`Necesitas al menos verificación Nivel ${MIN_KYC_LEVEL_TO_INVEST} para invertir en fondos.`);
    }

    const existing = state.fundPositions.find((p) => p.accountId === accountId && p.fundId === fundId);
    let position: FundPosition;
    if (existing) {
      const accrual = computeAccrual(existing, fund, state.simulatedNowIso);
      position = {
        ...existing,
        principalCents: existing.principalCents + amountCents,
        accruedYieldCents: accrual.accruedYieldCents,
        lastAccrualAt: accrual.lastAccrualAt,
      };
      state.updateFundPosition(existing.id, position);
    } else {
      position = {
        id: generateId('fund-position'),
        accountId,
        fundId,
        principalCents: amountCents,
        accruedYieldCents: 0,
        openedAt: state.simulatedNowIso,
        lastAccrualAt: state.simulatedNowIso,
      };
      state.addFundPosition(position);
    }

    state.adjustBalance(accountId, 'USD', -amountCents);
    state.pushTransaction({
      id: generateId('tx'),
      accountId,
      at: state.simulatedNowIso,
      title: `Aporte a ${fund.name}`,
      subtitle: 'Fondos de Inversión',
      amountCents,
      currency: 'USD',
      direction: 'out',
      category: 'fondo',
      relatedEntityId: fundId,
    });

    return position;
  },

  async withdraw({ accountId, fundId, amountCents }: WithdrawFundInput): Promise<FundPosition> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const fund = state.funds.find((f) => f.id === fundId);
    const existing = state.fundPositions.find((p) => p.accountId === accountId && p.fundId === fundId);
    if (!fund || !existing) throw new Error('Posición no encontrada.');
    if (amountCents <= 0) throw new Error('El monto debe ser mayor a cero.');

    const accrual = computeAccrual(existing, fund, state.simulatedNowIso);
    const upToDate: FundPosition = { ...existing, accruedYieldCents: accrual.accruedYieldCents, lastAccrualAt: accrual.lastAccrualAt };
    const totalValueCents = upToDate.principalCents + upToDate.accruedYieldCents;
    if (amountCents > totalValueCents) throw new Error(`No puedes rescatar más de tu posición (${formatUSD(totalValueCents)}).`);

    const yieldRealizedCents = Math.min(amountCents, upToDate.accruedYieldCents);
    const { principalCents, accruedYieldCents } = withdrawFromPosition(upToDate, amountCents);
    const position: FundPosition = { ...upToDate, principalCents, accruedYieldCents };
    state.updateFundPosition(existing.id, position);

    state.adjustBalance(accountId, 'USD', amountCents);
    state.pushTransaction({
      id: generateId('tx'),
      accountId,
      at: state.simulatedNowIso,
      title: `Rescate de ${fund.name}`,
      subtitle: yieldRealizedCents > 0 ? `Fondos de Inversión · incluye ${formatUSD(yieldRealizedCents)} de rendimiento` : 'Fondos de Inversión',
      amountCents,
      currency: 'USD',
      direction: 'in',
      category: 'fondo',
      relatedEntityId: fundId,
    });

    return position;
  },

  async recalculateYields(): Promise<void> {
    const state = useKoraStore.getState();
    for (const position of state.fundPositions) {
      if (position.principalCents <= 0 && position.accruedYieldCents <= 0) continue;
      const fund = state.funds.find((f) => f.id === position.fundId);
      if (!fund) continue;
      const accrual = computeAccrual(position, fund, state.simulatedNowIso);
      if (accrual.lastAccrualAt === position.lastAccrualAt) continue;
      state.updateFundPosition(position.id, accrual);
    }
  },
};
