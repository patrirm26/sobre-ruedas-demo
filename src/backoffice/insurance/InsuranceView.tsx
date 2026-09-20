import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { recordAudit } from '../../state/slices/auditSlice';
import { formatUSD, formatDate } from '../../lib/format';
import type { CreditInsurancePolicy } from '../../domain/insurance';
import type { InstallmentPlan } from '../../domain/credit';

function ClaimRow({ policy, plan, userName }: { policy: CreditInsurancePolicy; plan: InstallmentPlan; userName: string }) {
  const showToast = useKoraStore((s) => s.showToast);
  const updateInsurancePolicy = useKoraStore((s) => s.updateInsurancePolicy);
  const updateInstallmentPlan = useKoraStore((s) => s.updateInstallmentPlan);
  const simulatedNowIso = useKoraStore((s) => s.simulatedNowIso);
  const [submitting, setSubmitting] = useState(false);

  const pendingCents = plan.installments.filter((i) => i.status !== 'pagado').reduce((sum, i) => sum + i.amountCents + i.lateFeeCents, 0);

  const claim = () => {
    setSubmitting(true);
    const now = simulatedNowIso;
    updateInsurancePolicy(policy.id, (p) => ({ ...p, status: 'claimed', claimedAt: now }));
    updateInstallmentPlan(plan.id, (p) => ({
      ...p,
      status: 'pagado',
      installments: p.installments.map((i) => (i.status === 'pagado' ? i : { ...i, status: 'pagado', paidAt: now, lateFeeCents: 0 })),
    }));
    recordAudit({
      action: 'insurance.claim',
      targetType: 'installment_plan',
      targetId: plan.id,
      detail: `Reclamó el seguro de desgravamen de ${userName} — cubrió ${formatUSD(pendingCents)} pendientes`,
    });
    showToast(`✅ Seguro reclamado — la deuda de ${userName} quedó cubierta`);
    setSubmitting(false);
  };

  return (
    <div className="unit">
      <div className="ui">🛡️</div>
      <div className="ub">
        <div className="uid">{userName}</div>
        <div className="uo">
          Cobertura {formatUSD(policy.coverageCents)} · pendiente {formatUSD(pendingCents)} · plan en{' '}
          {plan.status.replace('_', ' ')} · asegurado desde {formatDate(policy.startedAt)}
        </div>
      </div>
      <div className="ur">
        <button className="cbtn" disabled={submitting} onClick={claim}>
          Marcar como cubierto por el seguro
        </button>
      </div>
    </div>
  );
}

/** Cola de reclamos — solo pólizas activas sobre planes en mora/default (los
 * casos que de verdad necesitan reclamarse; un plan al día no aparece acá).
 * Reclamar reusa el mismo campo `installment.status: 'pagado'` que ya usa
 * el pago normal de cuotas, sin inventar un estado nuevo — ver el plan. */
export function InsuranceView() {
  const users = useKoraStore((s) => s.users);
  const installmentPlans = useKoraStore((s) => s.installmentPlans);
  const claimable = useKoraStore(
    useShallow((s) =>
      Object.values(s.insurancePolicies).filter((p) => {
        if (p.status !== 'active') return false;
        const plan = s.installmentPlans[p.installmentPlanId];
        return plan && (plan.status === 'mora' || plan.status === 'default');
      })
    )
  );

  const userName = (accountId: string) => Object.values(users).find((u) => u.primaryAccountId === accountId)?.name ?? 'Usuario';

  return (
    <>
      <div className="sec-h" style={{ marginTop: 0 }}>
        <h2>Reclamos pendientes</h2>
      </div>
      {claimable.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Sin reclamos pendientes — ningún plan asegurado está en mora ahora mismo.
        </div>
      ) : (
        <div className="card">
          {claimable.map((policy) => {
            const plan = installmentPlans[policy.installmentPlanId];
            if (!plan) return null;
            return <ClaimRow key={policy.id} policy={policy} plan={plan} userName={userName(policy.accountId)} />;
          })}
        </div>
      )}
    </>
  );
}
