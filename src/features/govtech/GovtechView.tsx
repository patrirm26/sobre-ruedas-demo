import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { selectActiveAccount, selectActiveUser } from '../../state/selectors';
import { paymentService } from '../../services/paymentService';
import { govtechService } from '../../services/govtechService';
import { formatVES, formatUSD, formatPercent } from '../../lib/format';
import { useComingSoon } from '../../lib/comingSoon';
import { useBnplFlow } from '../../lib/useBnplFlow';
import { useInstallmentPreview } from '../../lib/useInstallmentPreview';
import { BnplEvaluationCard } from '../../components/BnplEvaluationCard';

const HOW_IT_WORKS = [
  { icon: '🔍', bg: 'color-mix(in srgb, var(--accent) 10%, transparent)', title: '1 · Consulta', desc: 'Con tu cédula o RIF, KORA busca lo que debes en cada ente conectado.' },
  { icon: '⚡', bg: 'color-mix(in srgb, var(--accent) 12%, transparent)', title: '2 · Paga sin colas', desc: 'Pagas desde tu saldo y el ente lo recibe directo. Comprobante al instante.' },
  { icon: '▤', bg: 'color-mix(in srgb, var(--accent) 12%, transparent)', title: '3 · O difiérelo', desc: '¿No te cuadra el mes? KORA paga hoy por ti y tú lo divides con KORA Cuotas.' },
];

const CATEGORY_ALL = 'Todo';

export function GovtechView() {
  const account = useKoraStore(selectActiveAccount);
  const activeUser = useKoraStore(selectActiveUser);
  const showToast = useKoraStore((s) => s.showToast);
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  const obligations = useKoraStore(useShallow((s) => s.obligations));
  const govEntities = useKoraStore(useShallow((s) => s.govEntities));
  const addObligations = useKoraStore((s) => s.addObligations);
  const [cedula, setCedula] = useState('V-12.345.678');
  const [payingId, setPayingId] = useState<string | null>(null);
  const [consultingId, setConsultingId] = useState<string | null>(null);
  const [category, setCategory] = useState(CATEGORY_ALL);
  const [bnplObligationId, setBnplObligationId] = useState<string | null>(null);
  const [installments, setInstallments] = useState(3);
  const comingSoon = useComingSoon();
  const { evaluation, submitting: bnplSubmitting, requestEvaluation, confirmPlan, cancel } = useBnplFlow();

  const entityName = (entityId: string) => govEntities.find((e) => e.id === entityId)?.name ?? entityId;

  // GovSegment ('retail'|'empresa'|'ambos') no comparte vocabulario con
  // AccountType ('persona'|'empresa'|'operador') — 'persona' es quien ve
  // los entes 'retail'.
  const userSegment = activeUser?.accountType === 'empresa' ? 'empresa' : 'retail';
  const categories = [CATEGORY_ALL, ...Array.from(new Set(govEntities.map((e) => e.category)))];
  const directory = govEntities.filter(
    (e) => (e.segment === 'ambos' || e.segment === userSegment) && (category === CATEGORY_ALL || e.category === category)
  );

  const handleConsultarDeudas = async (entityId: string) => {
    setConsultingId(entityId);
    try {
      const found = await govtechService.consultarDeudas(entityId);
      addObligations(found);
      showToast(
        found.length > 0
          ? `🔍 ${entityName(entityId)}: ${found.length} obligación${found.length === 1 ? '' : 'es'} encontrada${found.length === 1 ? '' : 's'}`
          : `✅ ${entityName(entityId)}: no tienes deudas pendientes`
      );
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setConsultingId(null);
    }
  };

  const bnplObligation = obligations.find((o) => o.id === bnplObligationId);
  const amountUsdCents = bnplObligation ? Math.ceil(bnplObligation.amountCents / bcvRate) : 0;
  const preview = useInstallmentPreview(bnplObligation ? account?.id : undefined, amountUsdCents, installments);

  const handlePay = async (obligationId: string) => {
    if (!account) return;
    setPayingId(obligationId);
    try {
      await paymentService.payObligation({ accountId: account.id, obligationId });
      showToast('✅ Obligación pagada — comprobante disponible en Historial');
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setPayingId(null);
    }
  };

  const openDefer = (obligationId: string) => {
    setBnplObligationId(obligationId);
    setInstallments(3);
    cancel();
  };

  const closeDefer = () => {
    setBnplObligationId(null);
    cancel();
  };

  const handleRequestBnpl = async () => {
    if (!account || !bnplObligation) return;
    await requestEvaluation(account.id, amountUsdCents, null, bnplObligation.name);
  };

  const handleConfirmBnpl = async () => {
    if (!account || !bnplObligation) return;
    const plan = await confirmPlan(installments);
    if (!plan) return;
    try {
      await paymentService.payObligationWithBnplDisbursement({ accountId: account.id, obligationId: bnplObligation.id, installmentPlanId: plan.id });
      showToast('✅ Obligación diferida — pagada hoy, la divides en cuotas');
      closeDefer();
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    }
  };

  return (
    <>
      <div className="gov-search">
        <input className="in-field" value={cedula} onChange={(e) => setCedula(e.target.value)} placeholder="Cédula o RIF" />
        <button className="btn" style={{ padding: '13px 26px' }} onClick={() => comingSoon('Consultar deudas', 'La consulta contra entes reales llega cuando se conecte un proveedor GovTech real.')}>
          Consultar mis deudas
        </button>
      </div>

      <div className="sec-h" style={{ marginTop: 0 }}>
        <h2>Tus obligaciones encontradas</h2>
        <span className="pill p-gold">★ Pagar al Estado también da puntos</span>
      </div>
      <div className="card">
        {obligations.map((o) => (
          <div key={o.id}>
            <div className="oblig">
              <div className="oi" style={{ background: o.color }}>
                {o.icon}
              </div>
              <div className="ob">
                <div className="on">{o.name}</div>
                <div className="od">{entityName(o.entityId)}</div>
              </div>
              <div className="oa">
                <div className="om">{formatVES(o.amountCents)}</div>
                <div className="ov" style={{ color: o.dueColor }}>
                  {o.dueLabel}
                </div>
              </div>
              {o.paid ? (
                <span className="pill p-green" style={{ marginLeft: 12 }}>
                  Pagada ✓
                </span>
              ) : (
                <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
                  <button
                    className="btn ghost"
                    style={{ padding: '9px 16px', fontSize: 12.5 }}
                    disabled={payingId === o.id || !account}
                    onClick={() => handlePay(o.id)}
                  >
                    {payingId === o.id ? 'Pagando...' : 'Pagar'}
                  </button>
                  <button
                    className="btn ghost"
                    style={{ padding: '9px 16px', fontSize: 12.5 }}
                    disabled={!account}
                    onClick={() => (bnplObligationId === o.id ? closeDefer() : openDefer(o.id))}
                  >
                    ▤ Diferir con Cuotas
                  </button>
                </div>
              )}
            </div>

            {bnplObligationId === o.id && (
              <div className="card" style={{ padding: 20, margin: '0 0 14px', border: '1px solid var(--accent-dim)' }}>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>
                  KORA paga hoy {formatVES(o.amountCents)} (≈ {formatUSD(amountUsdCents)}) por ti — tú lo divides en cuotas en USD.
                </div>
                <div className="in-group">
                  <label className="in-label">
                    CUOTAS · <span style={{ color: 'var(--accent2)' }}>{installments}</span>
                  </label>
                  <input
                    type="range"
                    className="slider"
                    min={2}
                    max={6}
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                    disabled={!!evaluation}
                  />
                  <div className="slider-val">
                    <span>2 cuotas</span>
                    <span>6 cuotas</span>
                  </div>
                </div>
                {preview && (
                  <div className="sim-out">
                    <div className="so-row">
                      <span>Tasa mensual (según tu score)</span>
                      <b>{formatPercent(preview.periodicRatePct)}</b>
                    </div>
                    <div className="so-row hl">
                      <span>Cuota fija mensual</span>
                      <b>
                        {formatVES(Math.round(preview.installmentCents * bcvRate))} (≈ {formatUSD(preview.installmentCents)})
                      </b>
                    </div>
                    <div className="so-row">
                      <span>Costo total del crédito</span>
                      <b>
                        {formatVES(Math.round(preview.feeTotalCents * bcvRate))} (≈ {formatUSD(preview.feeTotalCents)})
                      </b>
                    </div>
                  </div>
                )}
                {evaluation ? (
                  <BnplEvaluationCard evaluation={evaluation} submitting={bnplSubmitting} onConfirm={handleConfirmBnpl} onCancel={cancel} />
                ) : (
                  <button className="btn full" style={{ marginTop: 14 }} disabled={bnplSubmitting} onClick={handleRequestBnpl}>
                    {bnplSubmitting ? 'Evaluando...' : 'Solicitar KORA Cuotas'}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="sec-h">
        <h2>Directorio — ¿a quién quieres pagarle?</h2>
      </div>
      <div className="cats" style={{ marginBottom: 14 }}>
        {categories.map((c) => (
          <button key={c} className={`cat ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>
      <div>
        {directory.map((ente) => (
          <div
            className="ente"
            key={ente.id}
            onClick={() =>
              ente.adapterKey ? handleConsultarDeudas(ente.id) : comingSoon(ente.name, ente.description)
            }
          >
            <div className="gi">{ente.icon}</div>
            <div className="gb">
              <div className="gn">{ente.name}</div>
              <div className="gd">{ente.description}</div>
            </div>
            <div className="gr">{consultingId === ente.id ? '…' : '→'}</div>
          </div>
        ))}
      </div>

      <div className="sec-h">
        <h2>¿Cómo funciona?</h2>
      </div>
      <div className="grid3">
        {HOW_IT_WORKS.map((step) => (
          <div className="earn-card" key={step.title}>
            <div className="ei" style={{ background: step.bg }}>
              {step.icon}
            </div>
            <div>
              <b>{step.title}</b>
              <span>{step.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
