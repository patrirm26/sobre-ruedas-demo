import { useKoraStore } from '../../state/store';
import type { CondoService, LoadMonthlyFeesInput, MarkUnitPaidInput } from '../condoService';
import { simulateLatency } from '../delay';

const PAYMENT_METHODS = ['Pago Móvil', 'QR de la unidad', 'Transferencia'];

export const mockCondoService: CondoService = {
  async loadMonthlyFees({ accountId, feeCents }: LoadMonthlyFeesInput) {
    await simulateLatency();
    const state = useKoraStore.getState();
    state.setCondoUnitsForNewPeriod(accountId, feeCents);
  },

  async markUnitPaid({ unitId }: MarkUnitPaidInput) {
    await simulateLatency();
    const state = useKoraStore.getState();
    const unit = state.condoUnits.find((u) => u.id === unitId);
    if (!unit) throw new Error('Unidad no encontrada.');
    if (unit.status === 'pagado') throw new Error('Esa unidad ya está al día.');

    const paymentMethod = PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)];
    const updated = { ...unit, status: 'pagado' as const, paidAt: state.simulatedNowIso, paymentMethod };
    state.markCondoUnitPaid(unitId, state.simulatedNowIso, paymentMethod);
    return updated;
  },
};
