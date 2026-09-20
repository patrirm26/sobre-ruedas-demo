import { useState } from 'react';
import { useKoraStore } from '../../state/store';
import { investmentFundService } from '../../services/investmentFundService';
import { formatUSD, formatVES } from '../../lib/format';
import { useEscapeToClose } from '../../lib/useEscapeToClose';
import type { InvestmentFund, FundPosition } from '../../domain/investmentFund';

interface Props {
  fund: InvestmentFund;
  position: FundPosition;
  accountId: string;
  onClose: () => void;
}

export function FundWithdrawModal({ fund, position, accountId, onClose }: Props) {
  const showToast = useKoraStore((s) => s.showToast);
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  const bs = (usdCents: number) => formatVES(Math.round(usdCents * bcvRate));
  const totalValueCents = position.principalCents + position.accruedYieldCents;
  const [amount, setAmount] = useState(totalValueCents / 100);
  const [submitting, setSubmitting] = useState(false);

  useEscapeToClose(onClose);

  const amountCents = Math.round(amount * 100);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await investmentFundService.withdraw({ accountId, fundId: fund.id, amountCents });
      showToast(`✅ Rescataste ${bs(amountCents)} (≈ ${formatUSD(amountCents)}) de ${fund.name}`);
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
            <h3>Rescatar {fund.name}</h3>
            <p>
              Valor actual de tu posición: {bs(totalValueCents)} (≈ {formatUSD(totalValueCents)})
            </p>
          </div>
          <button className="m-x" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="in-group">
          <label className="in-label">MONTO A RESCATAR (USD)</label>
          <input className="in-field" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
        </div>
        <button className="cbtn" style={{ marginBottom: 14 }} onClick={() => setAmount(totalValueCents / 100)}>
          Rescatar todo
        </button>

        <div className="sim-out">
          <div className="so-row">
            <span>Principal invertido</span>
            <b>
              {bs(position.principalCents)} (≈ {formatUSD(position.principalCents)})
            </b>
          </div>
          <div className="so-row">
            <span>Rendimiento acumulado</span>
            <b style={{ color: 'var(--green)' }}>
              {bs(position.accruedYieldCents)} (≈ {formatUSD(position.accruedYieldCents)})
            </b>
          </div>
        </div>

        <button
          className="btn full"
          style={{ marginTop: 14 }}
          disabled={submitting || amountCents <= 0 || amountCents > totalValueCents}
          onClick={handleConfirm}
        >
          {submitting ? 'Procesando...' : `Rescatar ${bs(amountCents)} (≈ ${formatUSD(amountCents)})`}
        </button>
      </div>
    </div>
  );
}
