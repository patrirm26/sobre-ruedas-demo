import { useKoraStore } from '../../state/store';
import { generateId } from '../../lib/ids';
import { recordAudit } from '../../state/slices/auditSlice';
import { isValidIdDoc } from '../bankAllianceRules';
import type { MerchantOnboardingRequest } from '../../domain/onboarding';
import type { Merchant } from '../../domain/marketplace';
import type { OnboardingService, SubmitMerchantRequestInput, ResolveMerchantRequestInput } from '../onboardingService';
import { simulateLatency } from '../delay';

const MAX_BNPL_FEE_PCT = 15;

export const mockOnboardingService: OnboardingService = {
  async submitMerchantRequest({ name, category, taxId, proposedBnplFeePct }: SubmitMerchantRequestInput): Promise<MerchantOnboardingRequest> {
    await simulateLatency();
    const state = useKoraStore.getState();
    if (!name.trim()) throw new Error('Falta el nombre del comercio.');
    if (!category.trim()) throw new Error('Falta la categoría del comercio.');
    if (!isValidIdDoc(taxId)) throw new Error('RIF o cédula inválido — formato esperado V-12.345.678 o J-50123456-0.');
    if (proposedBnplFeePct < 0 || proposedBnplFeePct > MAX_BNPL_FEE_PCT) {
      throw new Error(`La comisión BNPL propuesta debe estar entre 0% y ${MAX_BNPL_FEE_PCT}%.`);
    }

    const request: MerchantOnboardingRequest = {
      id: generateId('merchant-req'),
      at: state.simulatedNowIso,
      name: name.trim(),
      category: category.trim(),
      taxId: taxId.trim(),
      proposedBnplFeePct,
      status: 'pendiente',
    };
    state.addMerchantRequest(request);
    return request;
  },

  async resolveMerchantRequest({ requestId, approve }: ResolveMerchantRequestInput): Promise<MerchantOnboardingRequest> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const request = state.merchantRequests.find((r) => r.id === requestId);
    if (!request) throw new Error('Solicitud no encontrada.');
    if (request.status !== 'pendiente') throw new Error('Esta solicitud ya fue resuelta.');

    let merchantId: string | undefined;
    if (approve) {
      const merchant: Merchant = {
        id: generateId('merchant'),
        name: request.name,
        category: request.category,
        bnplMerchantFeePct: request.proposedBnplFeePct,
        taxId: request.taxId,
      };
      state.addMerchant(merchant);
      // Inicializa la tesorería de Factoring explícitamente en vez de depender
      // del fallback `?? 0` de adjustMerchantWallet en la primera lectura.
      state.adjustMerchantWallet(merchant.id, 0);
      merchantId = merchant.id;
    }

    const patch = { status: approve ? ('aprobado' as const) : ('rechazado' as const), resolvedAt: state.simulatedNowIso, merchantId };
    state.updateMerchantRequest(requestId, patch);
    recordAudit({
      action: 'onboarding.resolve_merchant',
      targetType: 'merchant_request',
      targetId: requestId,
      detail: `${approve ? 'Aprobó' : 'Rechazó'} el alta de ${request.name}`,
    });
    return { ...request, ...patch };
  },
};
