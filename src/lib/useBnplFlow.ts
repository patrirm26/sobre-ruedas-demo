import { useState } from 'react';
import { useKoraStore } from '../state/store';
import { bnplService } from '../services/bnplService';
import type { BnplRequest, InstallmentFrequency } from '../domain/credit';

export interface ManualReviewOptions {
  manualReview: true;
  installmentsCount: number;
  frequency?: InstallmentFrequency;
  useCollateral?: boolean;
}

/** Encapsula el flujo evaluar → confirmar (crear plan) → pagar cuota, con
 * loading y toasts, para no repetir esta orquestación en cada vista. */
export function useBnplFlow() {
  const showToast = useKoraStore((s) => s.showToast);
  const [evaluation, setEvaluation] = useState<BnplRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const requestEvaluation = async (
    accountId: string,
    amountCents: number,
    merchantId: string | null = null,
    originLabel?: string,
    manual?: ManualReviewOptions
  ) => {
    setSubmitting(true);
    try {
      const req = await bnplService.evaluate({
        accountId,
        amountCents,
        merchantId,
        originLabel,
        manualReview: manual?.manualReview,
        installmentsCount: manual?.installmentsCount,
        frequency: manual?.frequency,
        useCollateral: manual?.useCollateral,
      });
      setEvaluation(req);
      return req;
    } finally {
      setSubmitting(false);
    }
  };

  const confirmPlan = async (installmentsCount: number, frequency: InstallmentFrequency = 'mensual', useCollateral = false) => {
    if (!evaluation) return undefined;
    setSubmitting(true);
    try {
      const plan = await bnplService.createPlan({ bnplRequestId: evaluation.id, installmentsCount, frequency, useCollateral });
      setEvaluation(null);
      showToast(useCollateral ? '✅ Plan creado, desembolsado y garantía KRT bloqueada' : '✅ Plan creado y desembolsado');
      return plan;
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
      return undefined;
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = () => setEvaluation(null);

  const payInstallment = async (planId: string, installmentId: string) => {
    setSubmitting(true);
    try {
      await bnplService.payInstallment(planId, installmentId);
      showToast('✅ Cuota pagada');
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return { evaluation, submitting, requestEvaluation, confirmPlan, cancel, payInstallment };
}
