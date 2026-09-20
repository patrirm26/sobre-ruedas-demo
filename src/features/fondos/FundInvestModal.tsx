import { useState } from 'react';
import { useKoraStore } from '../../state/store';
import { investmentFundService } from '../../services/investmentFundService';
import { formatUSD, formatVES, formatPercent } from '../../lib/format';
import { useEscapeToClose } from '../../lib/useEscapeToClose';
import type { InvestmentFund } from '../../domain/investmentFund';

interface Props {
  fund: InvestmentFund;
  accountId: string;
  onClose: () => void;
}

export function FundInvestModal({ fund, accountId, onClose }: Props) {
  const account = useKoraStore((s) => s.accounts[accountId]);
  const showToast = useKoraStore((s) => s.showToast);
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  const bs = (usdCents: number) => formatVES(Math.round(usdCents * bcvRate));
  const [amount, setAmount] = useState(fund.minInvestmentCents / 100);
  const [submitting, setSubmitting] = useState(false);

  useEscapeToClose(onClose);

  const amountCents = Math.round(amount * 100);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await investmentFundService.invest({ accountId, fundId: fund.id, amountCents });
      showToast(`✅ Invertiste ${bs(amountCents)} (≈ ${formatUSD(amountCents)}) en ${fund.name}`);
      onClose();
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="m-head">
          <div>
            <h3>{fund.name}</h3>
            <p>
              {formatPercent(fund.annualYieldPct)} anual · mínimo {bs(fund.minInvestmentCents)} (≈ {formatUSD(fund.minInvestmentCents)})
            </p>
          </div>
          <button className="m-x" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 16 }}>{fund.description}</div>

        <div className="in-group">
          <label className="in-label">MONTO A INVERTIR (USD)</label>
          <input className="in-field" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
        </div>

        <div className="sim-out">
          <div className="so-row">
            <span>Tu saldo USD</span>
            <b style={{ color: account.balanceUsdCents >= amountCents ? 'var(--ink)' : 'var(--red)' }}>
              {bs(account.balanceUsdCents)} (≈ {formatUSD(account.balanceUsdCents)})
            </b>
          </div>
        </div>

        <button
          className="btn full"
          style={{ marginTop: 14 }}
          disabled={submitting || amountCents <= 0 || account.balanceUsdCents < amountCents}
          onClick={handleConfirm}
        >
          {submitting ? 'Procesando...' : `Invertir ${bs(amountCents)} (≈ ${formatUSD(amountCents)})`}
        </button>
      </div>
    </div>
  );
}
