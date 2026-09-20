import { useCallback, useEffect, useState } from 'react';
import { useKoraStore } from '../../state/store';
import { splitPayoutService } from '../../services/splitPayoutService';
import { formatUSD, formatVES, formatDate } from '../../lib/format';
import type { SplitRule, SplitBeneficiary, SplitBeneficiaryRole, SplitPayout } from '../../domain/splitPayout';

const ROLE_PILL: Record<SplitBeneficiaryRole, string> = {
  merchant: 'p-green',
  platform: 'p-blue',
  ally: 'p-gold',
};

const ROLE_BAR_COLOR: Record<SplitBeneficiaryRole, string> = {
  merchant: 'var(--green)',
  platform: 'var(--accent2)',
  ally: 'var(--gold)',
};

function SplitRuleCard({ rule, onChanged }: { rule: SplitRule; onChanged: () => Promise<void> }) {
  const showToast = useKoraStore((s) => s.showToast);
  const [beneficiaries, setBeneficiaries] = useState<SplitBeneficiary[]>(rule.beneficiaries);
  const [saving, setSaving] = useState(false);

  const sumPct = beneficiaries.reduce((sum, b) => sum + b.pct, 0);
  const isValid = sumPct === 100;

  const setPct = (index: number, pct: number) => {
    setBeneficiaries((prev) => prev.map((b, i) => (i === index ? { ...b, pct } : b)));
  };

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      await splitPayoutService.updateRule(rule.id, beneficiaries);
      showToast(`✅ Reparto actualizado — ${rule.name}`);
      await onChanged();
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ padding: 20, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <h3 style={{ fontSize: 15 }}>{rule.name}</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{rule.description}</p>
        </div>
        <span className="pill p-blue">Marketplace</span>
      </div>

      {beneficiaries.map((b, i) => (
        <div className="factor" key={b.role}>
          <div className="f-head">
            <b>
              <span className={`pill ${ROLE_PILL[b.role]}`} style={{ marginRight: 8 }}>
                {b.label}
              </span>
            </b>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="number"
                className="in-field"
                style={{ width: 62, padding: '5px 8px', fontSize: 12, textAlign: 'right' }}
                value={b.pct}
                onChange={(e) => setPct(i, Number(e.target.value) || 0)}
              />
              %
            </span>
          </div>
          <div className="f-bar">
            <div className="f-fill" style={{ width: `${Math.min(100, Math.max(0, b.pct))}%`, background: ROLE_BAR_COLOR[b.role] }} />
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: isValid ? 'var(--green)' : 'var(--red)' }}>
          Suma actual: {sumPct}% {isValid ? '✓' : '— debe ser 100%'}
        </span>
        <button className="btn ghost" style={{ padding: '9px 18px', fontSize: 12.5 }} disabled={!isValid || saving} onClick={handleSave}>
          {saving ? 'Guardando…' : 'Guardar reparto'}
        </button>
      </div>
    </div>
  );
}

export function SplitPayoutsView() {
  const showToast = useKoraStore((s) => s.showToast);
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  const bs = (usdCents: number) => formatVES(Math.round(usdCents * bcvRate));

  const [splitRules, setSplitRules] = useState<SplitRule[]>([]);
  const [splitPayouts, setSplitPayouts] = useState<SplitPayout[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshRules = useCallback(async () => {
    setSplitRules(await splitPayoutService.listRules());
  }, []);

  useEffect(() => {
    Promise.all([splitPayoutService.listRules(), splitPayoutService.listPayouts()])
      .then(([rules, payouts]) => {
        setSplitRules(rules);
        setSplitPayouts(payouts);
      })
      .catch((e) => showToast(`⚠️ ${(e as Error).message}`))
      .finally(() => setLoading(false));
  }, [showToast]);

  const totals = splitPayouts.reduce(
    (acc, p) => {
      acc.total += p.totalCents;
      for (const leg of p.legs) {
        if (leg.role === 'merchant') acc.merchant += leg.amountCents;
        if (leg.role === 'platform') acc.platform += leg.amountCents;
      }
      return acc;
    },
    { total: 0, merchant: 0, platform: 0 }
  );

  return (
    <>
      <div className="sec-h" style={{ marginTop: 0 }}>
        <h2>Reglas de reparto</h2>
      </div>
      {loading ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Cargando…
        </div>
      ) : (
        splitRules.map((rule) => <SplitRuleCard key={rule.id} rule={rule} onChanged={refreshRules} />)
      )}

      <div className="sec-h">
        <h2>Historial de repartos</h2>
      </div>
      <div className="condo-stats" style={{ marginBottom: 20 }}>
        <div className="cs">
          <b>{splitPayouts.length}</b>
          <span>Repartos</span>
        </div>
        <div className="cs">
          <b>{bs(totals.total)}</b>
          <span>Distribuido (≈ {formatUSD(totals.total)})</span>
        </div>
        <div className="cs">
          <b style={{ color: 'var(--green)' }}>{bs(totals.merchant)}</b>
          <span>A comercios (≈ {formatUSD(totals.merchant)})</span>
        </div>
        <div className="cs">
          <b style={{ color: 'var(--accent2)' }}>{bs(totals.platform)}</b>
          <span>A KORA (≈ {formatUSD(totals.platform)})</span>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Cargando…
        </div>
      ) : splitPayouts.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Todavía no hay repartos registrados. Compra algo en el Marketplace con saldo o puntos para ver el primero.
        </div>
      ) : (
        <div className="card">
          {splitPayouts.map((p) => (
            <div className="unit" key={p.id}>
              <div className="ui">⑂</div>
              <div className="ub">
                <div className="uid">{p.sourceLabel}</div>
                <div className="uo">
                  {formatDate(p.at)} · {p.ruleName}
                </div>
              </div>
              <div className="ur">
                <div className="ua">{bs(p.totalCents)}</div>
                <div className="ud">{p.legs.map((leg) => `${leg.label} ${bs(leg.amountCents)}`).join(' · ')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
