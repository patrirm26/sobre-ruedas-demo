import { useKoraStore } from '../../state/store';
import { generateId } from '../../lib/ids';
import { recordAudit } from '../../state/slices/auditSlice';
import type { SplitPayout, SplitPayoutLeg, SplitRule, SplitBeneficiary } from '../../domain/splitPayout';
import type { SplitPayoutService, RecordSplitInput } from '../splitPayoutService';
import { simulateLatency } from '../delay';

/** Reparte `totalCents` entre los beneficiarios de una regla. Redondea cada
 * pierna y ajusta el remanente en la más grande para que la suma de legs
 * cuadre exactamente con `totalCents` (si no, $79.99 al 92/5/3 no cuadra
 * por redondeo de céntimos). */
function computeLegs(totalCents: number, beneficiaries: { role: SplitPayoutLeg['role']; label: string; pct: number }[]): SplitPayoutLeg[] {
  const legs = beneficiaries.map((b) => ({ ...b, amountCents: Math.round(totalCents * (b.pct / 100)) }));
  const distributed = legs.reduce((sum, l) => sum + l.amountCents, 0);
  const remainder = totalCents - distributed;
  if (remainder !== 0 && legs.length > 0) {
    const largest = legs.reduce((a, b) => (b.amountCents > a.amountCents ? b : a), legs[0]);
    largest.amountCents += remainder;
  }
  return legs;
}

export const mockSplitPayoutService: SplitPayoutService = {
  async recordSplit({ source, sourceLabel, relatedEntityId, totalCents }: RecordSplitInput): Promise<SplitPayout> {
    await simulateLatency(100, 300);
    const state = useKoraStore.getState();
    const rule = state.splitRules.find((r) => r.appliesTo === source);
    if (!rule) throw new Error(`No hay una regla de reparto configurada para "${source}".`);

    const payout: SplitPayout = {
      id: generateId('split'),
      at: state.simulatedNowIso,
      source,
      sourceLabel,
      relatedEntityId,
      totalCents,
      ruleId: rule.id,
      ruleName: rule.name,
      legs: computeLegs(totalCents, rule.beneficiaries),
    };
    state.addSplitPayout(payout);
    return payout;
  },

  async listRules(): Promise<SplitRule[]> {
    await simulateLatency();
    return useKoraStore.getState().splitRules;
  },

  async updateRule(ruleId: string, beneficiaries: SplitBeneficiary[]): Promise<SplitRule> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const rule = state.splitRules.find((r) => r.id === ruleId);
    if (!rule) throw new Error('Regla de reparto no encontrada.');

    state.updateSplitRule(ruleId, beneficiaries);
    recordAudit({
      action: 'decisioning.update_split_rule',
      targetType: 'split_rule',
      targetId: ruleId,
      detail: `Cambió la regla de reparto ${rule.name} — ${beneficiaries.map((b) => `${b.label} ${b.pct}%`).join(' · ')}`,
    });
    return { ...rule, beneficiaries };
  },

  async listPayouts(): Promise<SplitPayout[]> {
    await simulateLatency();
    return useKoraStore.getState().splitPayouts;
  },
};
