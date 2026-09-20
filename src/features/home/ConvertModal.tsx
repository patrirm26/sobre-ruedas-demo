import { useState } from 'react';
import { useKoraStore } from '../../state/store';
import { selectActiveAccount } from '../../state/selectors';
import { formatVES, formatUSD, formatKRT } from '../../lib/format';
import { convertService } from '../../services/convertService';
import type { ConvertCurrency } from '../../services/convertService';

const CURRENCIES: { key: ConvertCurrency; label: string }[] = [
  { key: 'VES', label: 'Bs (VES)' },
  { key: 'USD', label: 'USD' },
  { key: 'KRT', label: 'Puntos' },
];

function formatByCurrency(currency: ConvertCurrency, cents: number): string {
  if (currency === 'VES') return formatVES(cents);
  if (currency === 'USD') return formatUSD(cents);
  return formatKRT(cents);
}

/** Estimado antes de confirmar. Exacto para VES↔USD (sin comisión); para
 * tramos con KRT es aproximado — el mint/burn real aplica su comisión
 * (1%) recién al confirmar, no se duplica ese cálculo acá. */
function estimateToAmountCents(from: ConvertCurrency, to: ConvertCurrency, amountCents: number, bcvRate: number): number {
  if (from !== 'KRT' && to !== 'KRT') {
    return from === 'VES' ? Math.round(amountCents / bcvRate) : Math.round(amountCents * bcvRate);
  }
  if (from === 'KRT') {
    return to === 'VES' ? amountCents : Math.round(amountCents / bcvRate);
  }
  return from === 'VES' ? amountCents : Math.round(amountCents * bcvRate);
}

export function ConvertModal({ onClose }: { onClose: () => void }) {
  const account = useKoraStore(selectActiveAccount);
  const krtBalances = useKoraStore((s) => (account ? s.krtBalances[account.id] : undefined));
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  const showToast = useKoraStore((s) => s.showToast);

  const [from, setFrom] = useState<ConvertCurrency>('VES');
  const [to, setTo] = useState<ConvertCurrency>('USD');
  const [amount, setAmount] = useState(100);
  const [submitting, setSubmitting] = useState(false);

  if (!account) return null;

  const involvesKrt = from === 'KRT' || to === 'KRT';
  const amountCents = Math.round(amount * 100);
  const estimateCents = estimateToAmountCents(from, to, amountCents, bcvRate);
  const availableCents = from === 'VES' ? account.balanceVesCents : from === 'USD' ? account.balanceUsdCents : (krtBalances?.STD ?? 0);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const handleConvert = async () => {
    setSubmitting(true);
    try {
      const result = await convertService.convert({ accountId: account.id, from, to, amountCents });
      showToast(`✅ Convertiste a ${formatByCurrency(to, result.toAmountCents)}`);
      onClose();
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="m-head">
          <h3>⇄ Convertir</h3>
          <button className="m-x" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="mb-io">
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
          <select className="cur-select" value={from} onChange={(e) => setFrom(e.target.value as ConvertCurrency)}>
            {CURRENCIES.filter((c) => c.key !== to).map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <button className="mb-arrow" style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%' }} onClick={swap} aria-label="Invertir dirección">
          ⇅
        </button>
        <div className="mb-io" style={{ borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}>
          <input type="text" value={`${involvesKrt ? '≈ ' : ''}${(estimateCents / 100).toFixed(2)}`} readOnly style={{ color: 'var(--gold)' }} />
          <select className="cur-select" value={to} onChange={(e) => setTo(e.target.value as ConvertCurrency)} style={{ color: 'var(--gold)' }}>
            {CURRENCIES.filter((c) => c.key !== from).map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-detail">
          <span>Tasa BCV</span>
          <b>{bcvRate.toFixed(2)} Bs/$</b>
        </div>
        <div className="mb-detail">
          <span>Saldo disponible</span>
          <b>{formatByCurrency(from, availableCents)}</b>
        </div>
        {involvesKrt && (
          <div className="mb-detail">
            <span>Comisión de puntos</span>
            <b>1% (se aplica al confirmar)</b>
          </div>
        )}

        <button className="btn gold full" style={{ marginTop: 13 }} disabled={submitting || amount <= 0} onClick={handleConvert}>
          {submitting ? 'Convirtiendo...' : 'Convertir'}
        </button>
      </div>
    </div>
  );
}
