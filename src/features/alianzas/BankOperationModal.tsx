import { useState } from 'react';
import { useKoraStore } from '../../state/store';
import { bankAllianceService } from '../../services/bankAllianceService';
import { formatUSD, formatVES } from '../../lib/format';
import { useEscapeToClose } from '../../lib/useEscapeToClose';
import type { AllyBank, LinkedBankAccount } from '../../domain/bankAlliance';

type Mode = 'deposit' | 'withdraw';
type Currency = 'USD' | 'VES';

const MODE_COPY: Record<Mode, { title: string; cta: string; verb: string }> = {
  deposit: { title: 'Fondear vía Pago Móvil', cta: 'Fondear', verb: 'Fondeaste' },
  withdraw: { title: 'Retirar por transferencia', cta: 'Retirar', verb: 'Retiraste' },
};

interface Props {
  mode: Mode;
  linked: LinkedBankAccount;
  bank: AllyBank | undefined;
  accountId: string;
  onClose: () => void;
}

export function BankOperationModal({ mode, linked, bank, accountId, onClose }: Props) {
  const account = useKoraStore((s) => s.accounts[accountId]);
  const showToast = useKoraStore((s) => s.showToast);
  const [amount, setAmount] = useState(50);
  const [currency, setCurrency] = useState<Currency>('VES');
  const [submitting, setSubmitting] = useState(false);

  useEscapeToClose(onClose);

  const amountCents = Math.round(amount * 100);
  const copy = MODE_COPY[mode];
  const available = currency === 'USD' ? account.balanceUsdCents : account.balanceVesCents;
  const formatter = currency === 'USD' ? formatUSD : formatVES;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      if (mode === 'deposit') {
        await bankAllianceService.depositViaMobilePayment({ linkedAccountId: linked.id, amountCents, currency });
      } else {
        await bankAllianceService.withdrawViaBankTransfer({ linkedAccountId: linked.id, amountCents, currency });
      }
      showToast(`✅ ${copy.verb} ${formatter(amountCents)} · ${bank?.name ?? 'banco aliado'}`);
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
            <h3>{copy.title}</h3>
            <p>
              {bank?.name ?? 'Banco aliado'} · Cuenta •••• {linked.accountNumber.slice(-4)}
            </p>
          </div>
          <button className="m-x" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="in-row">
          <div className="in-group">
            <label className="in-label">MONTO</label>
            <input className="in-field" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
          </div>
          <div className="in-group">
            <label className="in-label">MONEDA</label>
            <select className="in-field" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
              <option value="USD">USD</option>
              <option value="VES">VES</option>
            </select>
          </div>
        </div>

        {mode === 'withdraw' && (
          <div className="sim-out">
            <div className="so-row">
              <span>Saldo disponible</span>
              <b style={{ color: available >= amountCents ? 'var(--ink)' : 'var(--red)' }}>{formatter(available)}</b>
            </div>
          </div>
        )}

        <button
          className="btn full"
          style={{ marginTop: 14 }}
          disabled={submitting || amountCents <= 0 || (mode === 'withdraw' && available < amountCents)}
          onClick={handleConfirm}
        >
          {submitting ? 'Procesando...' : `${copy.cta} ${formatter(amountCents)}`}
        </button>
      </div>
    </div>
  );
}
