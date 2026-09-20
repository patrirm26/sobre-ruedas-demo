import { useState } from 'react';
import { useKoraStore } from '../state/store';
import { tokenService } from '../services/tokenService';
import { formatKRT } from '../lib/format';
import { useEscapeToClose } from '../lib/useEscapeToClose';

interface Props {
  fromAccountId: string;
  onClose: () => void;
}

/** Solo KRT-STD es transferible entre cuentas KORA (REW/CRD/COL no lo son —
 * ver domain/token.ts). El directorio de destinatarios se limita a las otras
 * cuentas del sandbox porque no existe un buscador de usuarios real —
 * excluye al operador de Back Office, que no tiene cuenta/billetera. */
export function TransferModal({ fromAccountId, onClose }: Props) {
  const users = useKoraStore((s) => s.users);
  const showToast = useKoraStore((s) => s.showToast);
  const stdBalance = useKoraStore((s) => s.krtBalances[fromAccountId]?.STD ?? 0);
  const others = Object.values(users).filter(
    (u): u is typeof u & { primaryAccountId: string } => !!u.primaryAccountId && u.primaryAccountId !== fromAccountId
  );

  const [toAccountId, setToAccountId] = useState(others[0]?.primaryAccountId ?? '');
  const [amount, setAmount] = useState(1000);
  const [submitting, setSubmitting] = useState(false);

  useEscapeToClose(onClose);

  const handleTransfer = async () => {
    setSubmitting(true);
    try {
      await tokenService.transfer({ fromAccountId, toAccountId, krtAmountCents: Math.round(amount * 100) });
      showToast('✅ Transferencia enviada');
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
          <div className="mi" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
            ⇄
          </div>
          <div>
            <h3>Transferir puntos</h3>
            <p>Solo puntos disponibles · disponible: {formatKRT(stdBalance)}</p>
          </div>
          <button className="m-x" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="in-group">
          <label className="in-label">DESTINATARIO</label>
          <select className="in-field" value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
            {others.map((u) => (
              <option key={u.primaryAccountId} value={u.primaryAccountId}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div className="in-group">
          <label className="in-label">MONTO (PUNTOS)</label>
          <input className="in-field" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
        </div>
        <button className="btn full" disabled={submitting || !toAccountId} onClick={handleTransfer}>
          {submitting ? 'Enviando...' : `Transferir ${formatKRT(Math.round(amount * 100))}`}
        </button>
      </div>
    </div>
  );
}
