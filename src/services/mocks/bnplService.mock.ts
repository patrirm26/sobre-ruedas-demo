import { useKoraStore } from '../../state/store';
import { generateId } from '../../lib/ids';
import { generateAmortizationSchedule, totalFeeCents } from '../../lib/finance';
import type { BnplRequest, BnplRequestStatus, Installment, InstallmentPlan } from '../../domain/credit';
import type { CreditInsurancePolicy } from '../../domain/insurance';
import type { BnplService, EvaluateInput, SimulateInstallmentsInput, CreatePlanInput } from '../bnplService';
import { getScoreCapCents, getRateForScore, computeInstallmentStatus, deriveWorstStatus, LATE_FEE_PCT, computeInsurancePremiumCents } from '../bnplRules';
import { simulateLatency } from '../delay';
import { scoreService } from '../scoreService';
import { tokenService } from '../tokenService';
import { creditCashback } from './paymentService.mock';

const offsetDaysIso = (baseIso: string, days: number) => new Date(new Date(baseIso).getTime() + days * 86_400_000).toISOString();

export const mockBnplService: BnplService = {
  async evaluate({
    accountId,
    amountCents,
    merchantId,
    originLabel,
    manualReview,
    installmentsCount,
    frequency,
    useCollateral,
  }: EvaluateInput): Promise<BnplRequest> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const account = state.accounts[accountId];
    const score = state.scoreSnapshots[accountId];
    if (!account || !score) throw new Error('Cuenta o score no encontrado');

    if (manualReview) {
      const request: BnplRequest = {
        id: generateId('bnpl-req'),
        at: state.simulatedNowIso,
        accountId,
        merchantId,
        requestedAmountCents: amountCents,
        status: 'pending',
        reasonCodes: ['revision_manual'],
        scoreAtEvaluation: score.value,
        originLabel,
        installmentsCount,
        frequency,
        useCollateral,
      };
      state.addBnplRequest(request);
      return request;
    }

    const reasonCodes: string[] = [];
    let status: BnplRequestStatus;
    let approvedAmountCents: number | undefined;

    const blockingPlan = Object.values(state.installmentPlans).find(
      (p) => p.accountId === accountId && (p.status === 'mora' || p.status === 'default')
    );

    if (state.forcedBnplDecision === 'approved') {
      status = 'approved';
      approvedAmountCents = amountCents;
      reasonCodes.push('forzado_por_sandbox');
    } else if (state.forcedBnplDecision === 'rejected') {
      status = 'rejected';
      reasonCodes.push('forzado_por_sandbox');
    } else if (blockingPlan) {
      status = 'rejected';
      reasonCodes.push('mora_activa');
    } else {
      const scoreCapCents = getScoreCapCents(score.value);
      const availableCents = account.creditLimitTotalCents - account.creditLimitUsedCents;

      if (scoreCapCents <= 0) {
        status = 'rejected';
        reasonCodes.push('score_bajo');
      } else if (availableCents <= 0) {
        status = 'rejected';
        reasonCodes.push('cupo_insuficiente');
      } else {
        const capped = Math.min(amountCents, scoreCapCents, availableCents);
        if (capped >= amountCents) {
          status = 'approved';
          approvedAmountCents = capped;
          reasonCodes.push('score_suficiente', 'cupo_ok');
        } else {
          status = 'partial';
          approvedAmountCents = capped;
          reasonCodes.push('monto_parcial', scoreCapCents <= availableCents ? 'score_limita_monto' : 'cupo_limita_monto');
        }
      }
    }

    const request: BnplRequest = {
      id: generateId('bnpl-req'),
      at: state.simulatedNowIso,
      accountId,
      merchantId,
      requestedAmountCents: amountCents,
      status,
      reasonCodes,
      approvedAmountCents,
      scoreAtEvaluation: score.value,
      originLabel,
    };

    state.addBnplRequest(request);
    return request;
  },

  async simulateInstallments({ accountId, amountCents, installmentsCount, downPaymentCents = 0 }: SimulateInstallmentsInput) {
    const state = useKoraStore.getState();
    const score = state.scoreSnapshots[accountId];
    const rate = getRateForScore(score?.value ?? 0);
    const financedCents = Math.max(amountCents - downPaymentCents, 0);
    const schedule = generateAmortizationSchedule(financedCents, rate, installmentsCount);
    const insurancePremiumCents = computeInsurancePremiumCents(financedCents);
    const feeTotalCents = totalFeeCents(financedCents, rate, installmentsCount) + insurancePremiumCents;
    return {
      financedCents,
      installmentCents: schedule[0]?.installmentCents ?? 0,
      feeTotalCents,
      effectiveRatePct: financedCents > 0 ? Math.round((feeTotalCents / financedCents) * 1000) / 10 : 0,
      periodicRatePct: rate * 100,
      schedule,
      insurancePremiumCents,
    };
  },

  async createPlan({ bnplRequestId, installmentsCount, frequency, downPaymentCents = 0, firstDueInDays = 30, useCollateral = false }: CreatePlanInput): Promise<InstallmentPlan> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const request = state.bnplRequests[bnplRequestId];
    if (!request) throw new Error('Solicitud no encontrada');
    if (request.status !== 'approved' && request.status !== 'partial') {
      throw new Error('Esta solicitud no fue aprobada — no se puede crear un plan.');
    }

    const approvedCents = request.approvedAmountCents ?? 0;
    const principalCents = approvedCents - downPaymentCents;
    if (principalCents <= 0) throw new Error('El monto financiado debe ser mayor a cero.');

    const score = state.scoreSnapshots[request.accountId];
    const rate = getRateForScore(score.value);
    const schedule = generateAmortizationSchedule(principalCents, rate, installmentsCount);
    const insurancePremiumCents = computeInsurancePremiumCents(principalCents);
    const feeTotalCents = totalFeeCents(principalCents, rate, installmentsCount) + insurancePremiumCents;
    const merchant = request.merchantId ? state.merchants[request.merchantId] : null;
    const merchantFeeCents = merchant ? Math.round((principalCents * merchant.bnplMerchantFeePct) / 100) : 0;

    const now = state.simulatedNowIso;
    const periodDays = frequency === 'quincenal' ? 15 : 30;
    const installments: Installment[] = schedule.map((row, i) => ({
      id: generateId('installment'),
      index: row.index,
      dueDate: offsetDaysIso(now, firstDueInDays + i * periodDays),
      amountCents: row.installmentCents,
      principalCents: row.principalCents,
      status: 'al_dia',
      lateFeeCents: 0,
    }));

    const planId = generateId('plan');

    let collateral: InstallmentPlan['collateral'];
    if (useCollateral) {
      const lockEntry = await tokenService.lockCollateral(request.accountId, planId, principalCents);
      collateral = { lockedKrtCents: lockEntry.to!.deltaCents, ratioPct: 120 };
    }

    const plan: InstallmentPlan = {
      id: planId,
      bnplRequestId,
      accountId: request.accountId,
      merchantId: request.merchantId,
      principalCents,
      feeTotalCents,
      effectiveRatePct: Math.round((feeTotalCents / principalCents) * 1000) / 10,
      installmentsCount,
      frequency,
      fixedInstallment: true,
      downPaymentCents,
      firstDueDate: installments[0].dueDate,
      merchantFeeCents,
      status: 'al_dia',
      installments,
      collateral,
      createdAt: now,
      originLabel: request.originLabel,
      insurancePremiumCents,
    };

    state.addInstallmentPlan(plan);
    state.adjustCreditLimitUsed(request.accountId, principalCents);

    const policy: CreditInsurancePolicy = {
      id: generateId('insurance'),
      installmentPlanId: planId,
      accountId: request.accountId,
      provider: 'Seguro Horizonte',
      premiumCents: insurancePremiumCents,
      coverageCents: principalCents,
      status: 'active',
      startedAt: now,
    };
    state.addInsurancePolicy(policy);

    // Sin comercio = crédito de libre disponibilidad: el dinero entra al saldo.
    // Con comercio = BNPL de una compra: el comercio se liquida (Fase 5), el
    // usuario no recibe saldo, solo queda con las cuotas por pagar.
    if (!request.merchantId) {
      state.adjustBalance(request.accountId, 'USD', principalCents);
    }

    state.pushTransaction({
      id: generateId('tx'),
      accountId: request.accountId,
      at: now,
      title: request.originLabel ?? (request.merchantId ? 'Compra con KORA Cuotas' : 'Crédito desembolsado'),
      subtitle: `${installmentsCount} cuotas ${frequency} · tasa ${(rate * 100).toFixed(1)}% mensual`,
      amountCents: principalCents,
      currency: 'USD',
      direction: request.merchantId ? 'out' : 'in',
      category: request.merchantId ? 'marketplace' : 'credito',
      relatedEntityId: plan.id,
    });

    await scoreService.recalculate(request.accountId, 'new_credit_opened');

    return plan;
  },

  async payInstallment(planId: string, installmentId: string): Promise<InstallmentPlan> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const plan = state.installmentPlans[planId];
    if (!plan) throw new Error('Plan no encontrado');
    const installment = plan.installments.find((i) => i.id === installmentId);
    if (!installment) throw new Error('Cuota no encontrada');
    if (installment.status === 'pagado') throw new Error('Esta cuota ya está pagada.');

    const account = state.accounts[plan.accountId];
    const totalDueCents = installment.amountCents + installment.lateFeeCents;
    if (account.balanceUsdCents < totalDueCents) throw new Error('Saldo en USD insuficiente para pagar esta cuota.');

    const wasLate = installment.status !== 'al_dia';
    const paidAt = state.simulatedNowIso;
    const updatedInstallments = plan.installments.map((i) =>
      i.id === installmentId ? { ...i, status: 'pagado' as const, paidAt } : i
    );
    const newStatus = deriveWorstStatus(updatedInstallments);

    // Garantía KRT: libera proporcional a la porción de capital que se acaba de pagar.
    let updatedCollateral = plan.collateral;
    if (plan.collateral && plan.collateral.lockedKrtCents > 0) {
      const releaseCents = Math.round(plan.collateral.lockedKrtCents * (installment.principalCents / plan.principalCents));
      if (releaseCents > 0) {
        await tokenService.releaseCollateral(plan.accountId, planId, releaseCents);
        updatedCollateral = { ...plan.collateral, lockedKrtCents: Math.max(plan.collateral.lockedKrtCents - releaseCents, 0) };
      }
    }

    state.updateInstallmentPlan(planId, (p) => ({
      ...p,
      installments: updatedInstallments,
      status: newStatus,
      collateral: updatedCollateral,
    }));
    state.adjustCreditLimitUsed(plan.accountId, -installment.principalCents);
    state.adjustBalance(plan.accountId, 'USD', -totalDueCents);
    state.pushTransaction({
      id: generateId('tx'),
      accountId: plan.accountId,
      at: paidAt,
      title: `Cuota ${installment.index}/${plan.installmentsCount} pagada`,
      subtitle: wasLate ? 'KORA Cuotas · con recargo por mora' : 'KORA Cuotas',
      amountCents: totalDueCents,
      currency: 'USD',
      direction: 'out',
      category: 'credito',
      relatedEntityId: planId,
    });

    await scoreService.recalculate(plan.accountId, wasLate ? 'payment_late' : 'payment_on_time');

    if (!wasLate) {
      const cuotasCashbackPct = state.loyaltyRates.find((r) => r.channel === 'cuotas')?.cashbackPct ?? 0;
      creditCashback(plan.accountId, installment.amountCents, cuotasCashbackPct, 'Cuota pagada a tiempo — KORA Cuotas', planId);
    }

    return useKoraStore.getState().installmentPlans[planId];
  },

  async recalculateStatuses(): Promise<void> {
    const state = useKoraStore.getState();
    const now = state.simulatedNowIso;

    for (const plan of Object.values(state.installmentPlans)) {
      let changed = false;
      let worstNewSeverity: 'mora' | 'default' | null = null;

      const updatedInstallments = plan.installments.map((installment) => {
        if (installment.status === 'pagado') return installment;
        const computed = computeInstallmentStatus(installment, now);
        if (computed === installment.status) return installment;
        changed = true;

        let lateFeeCents = installment.lateFeeCents;
        if (computed === 'mora' && installment.status !== 'mora' && installment.status !== 'default') {
          lateFeeCents = Math.round(installment.amountCents * LATE_FEE_PCT);
        }
        if (computed === 'default') worstNewSeverity = 'default';
        else if (computed === 'mora' && worstNewSeverity !== 'default') worstNewSeverity = 'mora';

        return { ...installment, status: computed, lateFeeCents };
      });

      if (!changed) continue;

      const newPlanStatus = deriveWorstStatus(updatedInstallments);
      useKoraStore
        .getState()
        .updateInstallmentPlan(plan.id, (p) => ({ ...p, installments: updatedInstallments, status: newPlanStatus }));

      if (worstNewSeverity) {
        await scoreService.recalculate(plan.accountId, worstNewSeverity === 'default' ? 'default' : 'payment_late');
      }
    }
  },

  async resolveManualRequest({ requestId, approve }): Promise<BnplRequest> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const request = state.bnplRequests[requestId];
    if (!request) throw new Error('Solicitud no encontrada');
    if (request.status !== 'pending') throw new Error('Esta solicitud ya fue resuelta.');

    if (!approve) {
      state.updateBnplRequest(requestId, (r) => ({ ...r, status: 'rejected' }));
      return useKoraStore.getState().bnplRequests[requestId];
    }

    state.updateBnplRequest(requestId, (r) => ({ ...r, status: 'approved', approvedAmountCents: r.requestedAmountCents }));
    await mockBnplService.createPlan({
      bnplRequestId: requestId,
      installmentsCount: request.installmentsCount ?? 1,
      frequency: request.frequency ?? 'mensual',
      useCollateral: request.useCollateral,
    });
    return useKoraStore.getState().bnplRequests[requestId];
  },
};
