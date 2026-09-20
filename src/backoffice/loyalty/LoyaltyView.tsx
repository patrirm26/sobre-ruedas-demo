import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { recordAudit } from '../../state/slices/auditSlice';
import { formatPercent } from '../../lib/format';
import type { LoyaltyRate } from '../../domain/loyalty';

/** [AJUSTAR] tope ilustrativo — evita que el operador cargue una tasa absurda por error. */
const LOYALTY_MAX_PCT = 5;

function LoyaltyRateCard({ rate }: { rate: LoyaltyRate }) {
  const updateLoyaltyRate = useKoraStore((s) => s.updateLoyaltyRate);
  const showToast = useKoraStore((s) => s.showToast);
  const [pct, setPct] = useState(rate.cashbackPct);

  const isValid = pct >= 0 && pct <= LOYALTY_MAX_PCT;

  const handleSave = () => {
    if (!isValid) return;
    updateLoyaltyRate(rate.channel, pct);
    recordAudit({
      action: 'loyalty.update_rate',
      targetType: 'loyalty_channel',
      targetId: rate.channel,
      detail: `Cambió el cashback de ${rate.label} a ${formatPercent(pct)}`,
    });
    showToast(`✅ Tasa actualizada — ${rate.label}`);
  };

  return (
    <div className="card" style={{ padding: 20, marginBottom: 14 }}>
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: 15 }}>{rate.label}</h3>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{rate.description}</p>
      </div>
      <div className="in-group">
        <label className="in-label">CASHBACK (%)</label>
        <input
          className="in-field"
          type="number"
          step="0.1"
          value={pct}
          onChange={(e) => setPct(Number(e.target.value) || 0)}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: isValid ? 'var(--green)' : 'var(--red)' }}>
          {isValid ? `${formatPercent(pct)} en puntos de cashback` : `Debe estar entre 0% y ${LOYALTY_MAX_PCT}%`}
        </span>
        <button className="btn ghost" style={{ padding: '9px 18px', fontSize: 12.5 }} disabled={!isValid} onClick={handleSave}>
          Guardar
        </button>
      </div>
    </div>
  );
}

export function LoyaltyView() {
  const loyaltyRates = useKoraStore(useShallow((s) => s.loyaltyRates));

  return (
    <>
      <div className="sec-h" style={{ marginTop: 0 }}>
        <h2>Tasas de cashback por canal</h2>
      </div>
      {loyaltyRates.map((rate) => (
        <LoyaltyRateCard key={rate.channel} rate={rate} />
      ))}
    </>
  );
}
