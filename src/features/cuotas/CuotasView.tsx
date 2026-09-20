import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { selectActiveAccount, selectActiveScoreSnapshot, selectActiveUser } from '../../state/selectors';
import { Gauge } from '../../components/Gauge';
import { formatUSD, formatVES, formatPercent } from '../../lib/format';
import { useBnplFlow } from '../../lib/useBnplFlow';

export function CuotasView() {
  const account = useKoraStore(selectActiveAccount);
  const activeUser = useKoraStore(selectActiveUser);
  const score = useKoraStore(selectActiveScoreSnapshot);
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  const merchants = useKoraStore((s) => s.merchants);
  const cuotasCashbackPct = useKoraStore((s) => s.loyaltyRates.find((r) => r.channel === 'cuotas')?.cashbackPct ?? 0);
  const plans = useKoraStore(
    useShallow((s) =>
      account
        ? Object.values(s.installmentPlans)
            .filter((p) => p.accountId === account.id && p.status !== 'pagado')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : []
    )
  );
  const { submitting, payInstallment } = useBnplFlow();
  const insurancePolicies = useKoraStore((s) => s.insurancePolicies);

  if (!score || !activeUser || !account) return null;

  const originLabel = (plan: (typeof plans)[number]) =>
    plan.originLabel ?? (plan.merchantId ? merchants[plan.merchantId]?.name : 'Crédito de libre disponibilidad') ?? 'KORA Cuotas';

  return (
    <>
      <div className="cred-hero">
        <div className="score-card">
          <h3>TU SCORE DE CUOTAS</h3>
          <Gauge value={score.value} label={score.band} size={92} />
          <div className="score-note">
            Este score evalúa solo tu comportamiento dentro de KORA. <b style={{ color: 'var(--ink)' }}>Tus pagos al
            Estado no se usan</b> — esos datos son solo del ente recaudador.
          </div>
        </div>
        <div className="factors">
          <h3>¿CÓMO SE CALCULA? — {score.factors.length} FACTORES</h3>
          {score.factors.map((f, i) => (
            <div className="factor" key={f.key}>
              <div className="f-head">
                <b>
                  {i + 1} · {f.label}
                </b>
                <span>{Math.round(f.weight * 100)} pts</span>
              </div>
              <div className="f-bar">
                <div className="f-fill" style={{ width: `${f.valuePct}%`, background: 'var(--accent2)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sec-h">
        <h2>Tus planes activos</h2>
      </div>
      {plans.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          No tienes ningún plan de cuotas activo ahora mismo. KORA Cuotas se ofrece directamente al comprar en el
          Marketplace, al pagar, o al diferir un pago al Estado.
        </div>
      ) : (
        plans.map((plan) => {
          const nextUnpaidInstallment = plan.installments.find((i) => i.status !== 'pagado');
          const policy = Object.values(insurancePolicies).find((p) => p.installmentPlanId === plan.id);
          return (
            <div className="active-loan" key={plan.id} style={{ marginBottom: 14 }}>
              <div className="al-head">
                <div>
                  <h4>{originLabel(plan)}</h4>
                  <p>
                    {formatVES(Math.round(plan.principalCents * bcvRate))} (≈ {formatUSD(plan.principalCents)}) ·{' '}
                    {plan.installmentsCount} cuotas {plan.frequency} · tasa efectiva{' '}
                    {formatPercent(plan.effectiveRatePct)}
                  </p>
                </div>
                <span className={`pill ${plan.status === 'al_dia' ? 'p-green' : plan.status === 'en_gracia' ? 'p-amber' : 'p-red'}`}>
                  {plan.status.replace('_', ' ').toUpperCase()} ·{' '}
                  {plan.installments.filter((i) => i.status === 'pagado').length}/{plan.installmentsCount}
                </span>
              </div>
              <div className="al-prog">
                <div
                  className="al-fill"
                  style={{
                    width: `${(plan.installments.filter((i) => i.status === 'pagado').length / plan.installmentsCount) * 100}%`,
                  }}
                />
              </div>
              {policy && (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                  🛡️ Protegido con seguro de desgravamen ({policy.provider})
                </div>
              )}
              <button
                className="btn ghost"
                style={{ marginTop: 14, padding: '11px 18px', fontSize: 12.5 }}
                disabled={!nextUnpaidInstallment || submitting}
                onClick={() => nextUnpaidInstallment && payInstallment(plan.id, nextUnpaidInstallment.id)}
              >
                {submitting ? 'Procesando...' : `Pagar cuota · gana ${formatPercent(cuotasCashbackPct)} en puntos`}
              </button>
            </div>
          );
        })
      )}

      <div className="sec-h">
        <h2>¿Por qué existe KORA Cuotas?</h2>
      </div>
      <div className="card" style={{ padding: 20, fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
        <b style={{ color: 'var(--ink)' }}>Liquidez, no deuda eterna —</b> KORA Cuotas paga completo y a tiempo por ti
        (el Estado o el vendedor cobran ya) y tú lo divides en partes que sí calzan con tu flujo. Pagar puntual te da
        cashback en puntos y hace crecer tu score.
      </div>
    </>
  );
}
