import { useKoraStore } from '../../state/store';
import { generateId } from '../../lib/ids';
import { formatUSD } from '../../lib/format';
import type { VehiclePolicy } from '../../domain/vehicleInsurance';
import type { VehicleInsuranceService, IssueTermPolicyInput, TogglePayPerUseInput } from '../vehicleInsuranceService';
import { simulateLatency } from '../delay';

const ONE_YEAR_MS = 365 * 86_400_000;

export const mockVehicleInsuranceService: VehicleInsuranceService = {
  async issueTermPolicy({ accountId, planId, vehiclePlate, vehicleLabel }: IssueTermPolicyInput): Promise<VehiclePolicy> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const account = state.accounts[accountId];
    const plan = state.vehicleInsurancePlans.find((p) => p.id === planId);
    if (!account || !plan) throw new Error('Cuenta o plan no encontrado.');
    if (plan.coverageType === 'payperuse') throw new Error('Este plan se activa con togglePayPerUse, no con emisión anual.');
    if (!vehiclePlate.trim()) throw new Error('Ingresa la placa del vehículo.');
    if (account.balanceUsdCents < plan.priceCents) throw new Error('Saldo en USD insuficiente para pagar la prima.');

    const already = state.vehiclePolicies.find(
      (p) => p.accountId === accountId && p.vehiclePlate.toUpperCase() === vehiclePlate.toUpperCase() && p.planId === planId && p.status === 'activa'
    );
    if (already) throw new Error(`Ya tienes ${plan.name} activo para ${vehiclePlate.toUpperCase()}.`);

    const policy: VehiclePolicy = {
      id: generateId('vpolicy'),
      accountId,
      planId,
      coverageType: plan.coverageType,
      vehiclePlate: vehiclePlate.toUpperCase(),
      vehicleLabel: vehicleLabel.trim() || vehiclePlate.toUpperCase(),
      status: 'activa',
      premiumCents: plan.priceCents,
      coverageCents: plan.coverageCents,
      startedAt: state.simulatedNowIso,
      expiresAt: new Date(new Date(state.simulatedNowIso).getTime() + ONE_YEAR_MS).toISOString(),
    };
    state.addVehiclePolicy(policy);
    state.adjustBalance(accountId, 'USD', -plan.priceCents);
    state.pushTransaction({
      id: generateId('tx'),
      accountId,
      at: state.simulatedNowIso,
      title: `${plan.name} — ${policy.vehiclePlate}`,
      subtitle: `Seguro vehicular · ${policy.vehicleLabel}`,
      amountCents: plan.priceCents,
      currency: 'USD',
      direction: 'out',
      category: 'seguro',
      relatedEntityId: policy.id,
    });
    return policy;
  },

  async togglePayPerUse({ accountId, planId, vehiclePlate, vehicleLabel, active }: TogglePayPerUseInput): Promise<VehiclePolicy> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const account = state.accounts[accountId];
    const plan = state.vehicleInsurancePlans.find((p) => p.id === planId);
    if (!account || !plan) throw new Error('Cuenta o plan no encontrado.');
    if (plan.coverageType !== 'payperuse') throw new Error('Este plan no es pay-per-use.');
    if (!vehiclePlate.trim()) throw new Error('Ingresa la placa del vehículo.');

    const plate = vehiclePlate.toUpperCase();
    let policy = state.vehiclePolicies.find((p) => p.accountId === accountId && p.vehiclePlate === plate && p.planId === planId);

    if (!active) {
      if (!policy) throw new Error('No hay un microseguro activo para esa placa.');
      const updated: VehiclePolicy = { ...policy, activeToday: false };
      state.updateVehiclePolicy(policy.id, updated);
      return updated;
    }

    if (policy?.activeToday) throw new Error(`El microseguro de ${plate} ya está activo hoy.`);
    if (account.balanceUsdCents < plan.priceCents) throw new Error('Saldo en USD insuficiente para activar el microseguro de hoy.');

    if (policy) {
      const updated: VehiclePolicy = {
        ...policy,
        status: 'activa',
        activeToday: true,
        daysActive: (policy.daysActive ?? 0) + 1,
        premiumCents: policy.premiumCents + plan.priceCents,
      };
      state.updateVehiclePolicy(policy.id, updated);
      policy = updated;
    } else {
      policy = {
        id: generateId('vpolicy'),
        accountId,
        planId,
        coverageType: 'payperuse',
        vehiclePlate: plate,
        vehicleLabel: vehicleLabel.trim() || plate,
        status: 'activa',
        premiumCents: plan.priceCents,
        coverageCents: plan.coverageCents,
        startedAt: state.simulatedNowIso,
        daysActive: 1,
        activeToday: true,
      };
      state.addVehiclePolicy(policy);
    }

    state.adjustBalance(accountId, 'USD', -plan.priceCents);
    state.pushTransaction({
      id: generateId('tx'),
      accountId,
      at: state.simulatedNowIso,
      title: `Microseguro del día — ${plate}`,
      subtitle: `Pay-per-use · ${formatUSD(plan.priceCents)}/día`,
      amountCents: plan.priceCents,
      currency: 'USD',
      direction: 'out',
      category: 'seguro',
      relatedEntityId: policy.id,
    });
    return policy;
  },

  async cancelPolicy(policyId: string): Promise<VehiclePolicy> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const policy = state.vehiclePolicies.find((p) => p.id === policyId);
    if (!policy) throw new Error('Póliza no encontrada.');
    const updated: VehiclePolicy = { ...policy, status: 'cancelada', activeToday: false };
    state.updateVehiclePolicy(policyId, updated);
    return updated;
  },
};
