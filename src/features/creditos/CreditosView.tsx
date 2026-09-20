import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { selectActiveAccount, selectActiveScoreSnapshot, selectActiveUser } from '../../state/selectors';
import { ScoreHero } from '../../components/ScoreHero';
import { BnplEvaluationCard } from '../../components/BnplEvaluationCard';
import { BnplTierCard } from '../../components/BnplTierCard';
import { formatUSD, formatVES, formatPercent, formatKRT } from '../../lib/format';
import { useComingSoon } from '../../lib/comingSoon';
import { useBnplFlow } from '../../lib/useBnplFlow';
import { useInstallmentPreview } from '../../lib/useInstallmentPreview';
import { getScoreCapCents, GRACE_DAYS, DEFAULT_DAYS, LATE_FEE_PCT } from '../../services/bnplRules';

export function CreditosView() {
  const account = useKoraStore(selectActiveAccount);
  const activeUser = useKoraStore(selectActiveUser);
  const score = useKoraStore(selectActiveScoreSnapshot);
  const krtBalances = useKoraStore((s) => (account ? s.krtBalances[account.id] : undefined));
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  // Bs como moneda principal en toda la vista de crédito — el dato interno
  // sigue en USD-cents (motor BNPL dolarizado a propósito), esto solo
  // decide qué número se muestra primero.
  const bs = (usdCents: number) => formatVES(Math.round(usdCents * bcvRate));
  const plans = useKoraStore(
    useShallow((s) => (account ? Object.values(s.installmentPlans).filter((p) => p.accountId === account.id) : []))
  );
  const insurancePolicies = useKoraStore((s) => s.insurancePolicies);
  const comingSoon = useComingSoon();
  const openPlaceholder = useKoraStore((s) => s.openPlaceholder);
  const { evaluation, submitting, requestEvaluation, confirmPlan, cancel, payInstallment } = useBnplFlow();

  const [amountCents, setAmountCents] = useState(300_00);
  const [months, setMonths] = useState(3);
  const [wantsCollateral, setWantsCollateral] = useState(false);

  // Si no hay ningún plan activo, se muestra el último cubierto por el
  // seguro (si lo hay) en vez de simplemente desaparecer — el cliente
  // necesita ver la confirmación de que su deuda quedó resuelta.
  const claimedPolicy = Object.values(insurancePolicies).find((p) => p.accountId === account?.id && p.status === 'claimed');
  const activePlan = plans.find((p) => p.status !== 'pagado') ?? plans.find((p) => p.id === claimedPolicy?.installmentPlanId);

  const preview = useInstallmentPreview(account?.id, amountCents, months);

  if (!account || !activeUser || !score || !krtBalances) return null;

  const revolvingUnlocked = score.value >= 70;
  const guaranteeUnlocked = activeUser.kycLevel >= 3;
  const scoreCapCents = getScoreCapCents(score.value);
  const nextUnpaidInstallment = activePlan?.installments.find((i) => i.status !== 'pagado');
  const activePolicy = activePlan ? Object.values(insurancePolicies).find((p) => p.installmentPlanId === activePlan.id) : undefined;

  // Garantía KRT: 120% del monto, convertido a KRT vía BCV (KRT pega 1:1 a Bs, no a USD).
  const collateralKrtCentsFor = (usdCents: number) => Math.round(usdCents * 1.2 * bcvRate);
  const minGuaranteeCollateralKrtCents = collateralKrtCentsFor(501_00);
  const guaranteeAffordable = krtBalances.STD >= minGuaranteeCollateralKrtCents;
  const guaranteeAvailable = guaranteeUnlocked && guaranteeAffordable;
  const requiredCollateralKrtCents = collateralKrtCentsFor(amountCents);
  const hasEnoughCollateral = krtBalances.STD >= requiredCollateralKrtCents;

  return (
    <>
      <ScoreHero score={score} onSeeBands={() => comingSoon('Bandas de score', 'Tabla completa de bandas — vista dedicada pendiente.')} />

      <div className="sec-h">
        <h2>Tu nivel BNPL</h2>
      </div>
      <BnplTierCard score={score} />

      <div className="sec-h">
        <h2>Tu crédito activo</h2>
      </div>
      {activePlan ? (
        <div className="active-loan">
          <div className="al-head">
            <div>
              <h4>
                Plan de cuotas · {bs(activePlan.principalCents)} (≈ {formatUSD(activePlan.principalCents)})
              </h4>
              <p>
                {activePlan.installmentsCount} cuotas {activePlan.frequency} · comisión al comercio{' '}
                {bs(activePlan.merchantFeeCents)} (≈ {formatUSD(activePlan.merchantFeeCents)})
              </p>
            </div>
            <span className={`pill ${activePlan.status === 'al_dia' ? 'p-green' : activePlan.status === 'en_gracia' ? 'p-amber' : 'p-red'}`}>
              {activePlan.status.replace('_', ' ').toUpperCase()} ·{' '}
              {activePlan.installments.filter((i) => i.status === 'pagado').length}/{activePlan.installmentsCount}
            </span>
          </div>
          <div className="al-prog">
            <div
              className="al-fill"
              style={{
                width: `${(activePlan.installments.filter((i) => i.status === 'pagado').length / activePlan.installmentsCount) * 100}%`,
              }}
            />
          </div>
          <div className="al-meta">
            <span>
              Próxima cuota:{' '}
              {nextUnpaidInstallment
                ? `${bs(nextUnpaidInstallment.amountCents + nextUnpaidInstallment.lateFeeCents)} (≈ ${formatUSD(nextUnpaidInstallment.amountCents + nextUnpaidInstallment.lateFeeCents)})`
                : '—'}
              {nextUnpaidInstallment && nextUnpaidInstallment.lateFeeCents > 0 && (
                <span style={{ color: 'var(--red)' }}> (incluye recargo por mora)</span>
              )}
            </span>
            <span>
              Costo total del crédito: {bs(activePlan.feeTotalCents)} (≈ {formatUSD(activePlan.feeTotalCents)})
            </span>
          </div>
          {activePolicy && (
            <div style={{ fontSize: 11.5, color: activePolicy.status === 'claimed' ? 'var(--green)' : 'var(--muted)', marginTop: 8 }}>
              {activePolicy.status === 'claimed'
                ? '✅ Deuda cubierta por el seguro de desgravamen'
                : `🛡️ Protegido con seguro de desgravamen (${activePolicy.provider}) — cubre tu saldo si no puedes pagar`}
            </div>
          )}
          <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
            <button
              className="btn ghost"
              style={{ padding: '11px 18px', fontSize: 12.5 }}
              disabled={!nextUnpaidInstallment || submitting}
              onClick={() => nextUnpaidInstallment && payInstallment(activePlan.id, nextUnpaidInstallment.id)}
            >
              {submitting ? 'Procesando...' : 'Pagar cuota · gana 0,2% en puntos'}
            </button>
            <button
              className="btn ghost"
              style={{ padding: '11px 18px', fontSize: 12.5 }}
              onClick={() =>
                openPlaceholder({
                  icon: '⚠️',
                  title: '¿Y si me atraso?',
                  body: `Tienes ${GRACE_DAYS} días de gracia sin costo tras el vencimiento. Después de eso entras en mora: se aplica un recargo del ${(LATE_FEE_PCT * 100).toFixed(0)}% sobre la cuota, no puedes solicitar crédito nuevo, y tu KORA Score baja. Si pasan ${DEFAULT_DAYS} días sin pagar, el plan pasa a default.`,
                })
              }
            >
              ¿Y si me atraso?
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          No tienes ningún crédito o plan de cuotas activo ahora mismo.
        </div>
      )}

      <div className="sec-h">
        <h2>Productos de crédito</h2>
        <span className="pill p-blue">
          Tu perfil: Score {score.value} · Verificación nivel {activeUser.kycLevel} · cupo aprobable hasta {bs(scoreCapCents)} (≈{' '}
          {formatUSD(scoreCapCents)})
        </span>
      </div>
      <div className="cred-products">
        <div
          className={`cprod ${scoreCapCents > 0 ? 'ok' : 'locked'}`}
          onClick={() => {
            if (scoreCapCents <= 0) return comingSoon('Micro Express', 'Necesitas score 35+ para acceder a este producto.');
            setAmountCents(Math.min(50_00, scoreCapCents));
            setMonths(1);
            setWantsCollateral(false);
          }}
        >
          <div className="cp-tier" style={{ color: scoreCapCents > 0 ? 'var(--green)' : 'var(--amber)' }}>
            {scoreCapCents > 0 ? '✓ DISPONIBLE PARA TI' : 'REQUIERE SCORE 35+'}
          </div>
          <h4>Micro Express</h4>
          <div className="cp-range">
            {bs(10_00)} – {bs(100_00)} <span style={{ color: 'var(--muted)' }}>(≈ $10–$100)</span>
          </div>
          <ul>
            <li>7 a 30 días · tasa 5% mensual</li>
            <li>Sin garantía · respuesta al instante</li>
          </ul>
          <div className="cp-cta">{scoreCapCents > 0 ? 'Prellenar simulador' : '🔒 Bloqueado por score'}</div>
        </div>
        <div
          className={`cprod ${scoreCapCents >= 101_00 ? 'ok' : 'locked'}`}
          onClick={() => {
            if (scoreCapCents < 101_00) return comingSoon('Personal Estándar', 'Necesitas score 50+ para acceder a este producto.');
            setAmountCents(Math.min(300_00, scoreCapCents));
            setMonths(3);
            setWantsCollateral(false);
          }}
        >
          <div className="cp-tier" style={{ color: scoreCapCents >= 101_00 ? 'var(--green)' : 'var(--amber)' }}>
            {scoreCapCents >= 101_00 ? '✓ DISPONIBLE PARA TI' : 'REQUIERE SCORE 50+'}
          </div>
          <h4>Personal Estándar</h4>
          <div className="cp-range">
            {bs(101_00)} – {bs(500_00)} <span style={{ color: 'var(--muted)' }}>(≈ $101–$500)</span>
          </div>
          <ul>
            <li>1 a 6 meses · tasa 4% mensual</li>
            <li>Cuota fija mensual</li>
          </ul>
          <div className="cp-cta">{scoreCapCents >= 101_00 ? 'Prellenar simulador' : '🔒 Bloqueado por score'}</div>
        </div>
        <div
          className={`cprod ${guaranteeAvailable ? 'ok' : 'locked'}`}
          onClick={() => {
            if (!guaranteeUnlocked) return comingSoon('Con Garantía de Puntos', 'Sube a Nivel 3 de verificación para desbloquear este producto.');
            if (!guaranteeAffordable) {
              return comingSoon(
                'Con Garantía de Puntos',
                `Necesitas al menos ${formatKRT(minGuaranteeCollateralKrtCents)} en puntos disponibles para colateralizar el mínimo de $501 (120% al BCV de hoy). Tienes ${formatKRT(krtBalances.STD)}.`
              );
            }
            setAmountCents(501_00);
            setMonths(6);
            setWantsCollateral(true);
          }}
        >
          <div className="cp-tier" style={{ color: guaranteeAvailable ? 'var(--green)' : 'var(--amber)' }}>
            {guaranteeUnlocked ? (guaranteeAffordable ? '✓ DISPONIBLE PARA TI' : 'PUNTOS INSUFICIENTES') : 'REQUIERE VERIFICACIÓN NIVEL 3'}
          </div>
          <h4>Con Garantía de Puntos</h4>
          <div className="cp-range">
            {bs(501_00)} – {bs(2000_00)} <span style={{ color: 'var(--muted)' }}>(≈ $501–$2.000)</span>
          </div>
          <ul>
            <li>1 a 6 meses · la mejor tasa: 3% mensual</li>
            <li>Garantía: puntos disponibles por el 120% del monto</li>
            <li>Tus puntos se liberan a medida que pagas</li>
          </ul>
          <div className="cp-cta">{guaranteeAvailable ? 'Prellenar simulador' : '🔒 Bloqueado'}</div>
        </div>
        <div
          className="cprod locked"
          onClick={() => comingSoon('Línea Revolving', revolvingUnlocked ? 'Producto fuera de alcance de este sandbox.' : `Con score 70+ desbloqueas la línea revolving (tienes ${score.value}).`)}
        >
          <div className="cp-tier" style={{ color: 'var(--amber)' }}>
            {revolvingUnlocked ? '✓ SCORE SUFICIENTE' : `TE FALTAN ${70 - score.value} PUNTOS DE SCORE`}
          </div>
          <h4>Línea Revolving</h4>
          <div className="cp-range">
            Cupo hasta {bs(1000_00)} <span style={{ color: 'var(--muted)' }}>(≈ $1.000)</span>
          </div>
          <ul>
            <li>Renovación automática mensual</li>
            <li>Tasa 3,5% solo sobre lo que uses</li>
          </ul>
          <div className="cp-cta">{revolvingUnlocked ? '🔒 Fuera de alcance' : '🔒 Bloqueado por score'}</div>
        </div>
      </div>

      <div className="sec-h">
        <h2>Simulador — cuota fija mensual</h2>
      </div>
      <div className="grid2">
        <div className="sim">
          <div className="in-group">
            <label className="in-label">
              MONTO SOLICITADO ·{' '}
              <span style={{ color: 'var(--accent2)' }}>
                {bs(amountCents)} (≈ {formatUSD(amountCents)})
              </span>
            </label>
            <input type="range" className="slider" min={10_00} max={2000_00} step={10_00} value={amountCents} onChange={(e) => setAmountCents(Number(e.target.value))} />
            <div className="slider-val">
              <span>{bs(10_00)}</span>
              <span>{bs(2000_00)}</span>
            </div>
          </div>
          <div className="in-group">
            <label className="in-label">
              PLAZO · <span style={{ color: 'var(--accent2)' }}>{months} {months === 1 ? 'mes' : 'meses'}</span>
            </label>
            <input type="range" className="slider" min={1} max={6} value={months} onChange={(e) => setMonths(Number(e.target.value))} />
            <div className="slider-val">
              <span>1 mes</span>
              <span>6 meses</span>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.6 }}>
            Tu tasa mensual se decide por tu score, no por el producto que elijas — por eso puedes pedir hasta {bs(2000_00)}{' '}
            (≈ $2.000) aunque tu score solo alcance para menos: el underwriting decide cuánto se aprueba de verdad.
          </div>
          {wantsCollateral && (
            <div
              className="pill p-gold"
              style={{ marginTop: 12, display: 'inline-flex', cursor: 'pointer' }}
              onClick={() => setWantsCollateral(false)}
            >
              🔒 Con garantía de puntos · quitar
            </div>
          )}
        </div>
        <div className="sim">
          {preview && (
            <div className="sim-out">
              <div className="so-row">
                <span>Financias</span>
                <b>
                  {bs(preview.financedCents)} (≈ {formatUSD(preview.financedCents)})
                </b>
              </div>
              <div className="so-row">
                <span>Tasa mensual (según tu score)</span>
                <b>{formatPercent(preview.periodicRatePct)}</b>
              </div>
              <div className="so-row hl">
                <span>Cuota fija mensual</span>
                <b>
                  {bs(preview.installmentCents)} (≈ {formatUSD(preview.installmentCents)})
                </b>
              </div>
              <div className="so-row">
                <span>Costo total del crédito</span>
                <b>
                  {bs(preview.feeTotalCents)} (≈ {formatUSD(preview.feeTotalCents)})
                </b>
              </div>
              <div className="so-row">
                <span>🛡️ Seguro de desgravamen incluido</span>
                <b>
                  {bs(preview.insurancePremiumCents)} (≈ {formatUSD(preview.insurancePremiumCents)})
                </b>
              </div>
              <div className="so-row">
                <span>Tasa efectiva del plan</span>
                <b>{formatPercent(preview.effectiveRatePct)}</b>
              </div>
              {wantsCollateral && (
                <div className="so-row">
                  <span>Garantía en puntos requerida (120%)</span>
                  <b style={{ color: hasEnoughCollateral ? 'var(--ink)' : 'var(--red)' }}>{formatKRT(requiredCollateralKrtCents)}</b>
                </div>
              )}
            </div>
          )}
          {wantsCollateral && !hasEnoughCollateral && (
            <div style={{ fontSize: 11.5, color: 'var(--red)', marginTop: 10 }}>
              No te alcanza el saldo de puntos disponibles para este monto — baja el monto solicitado o quita la garantía.
            </div>
          )}
          {evaluation ? (
            <BnplEvaluationCard
              evaluation={evaluation}
              submitting={submitting}
              onConfirm={() => confirmPlan(months, 'mensual', wantsCollateral)}
              onCancel={cancel}
            />
          ) : (
            <button
              className="btn full"
              style={{ marginTop: 14 }}
              disabled={submitting || (wantsCollateral && !hasEnoughCollateral)}
              onClick={() =>
                requestEvaluation(account.id, amountCents, null, undefined, {
                  manualReview: true,
                  installmentsCount: months,
                  frequency: 'mensual',
                  useCollateral: wantsCollateral,
                })
              }
            >
              {submitting ? 'Enviando...' : wantsCollateral ? 'Solicitar con garantía de puntos' : 'Solicitar este crédito'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
