import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../state/store';
import { formatKRT, formatDate } from '../lib/format';
import { useEscapeToClose } from '../lib/useEscapeToClose';
import type { KrtLedgerEntry, KrtLedgerEntryType } from '../domain/token';

const TYPE_LABEL: Record<KrtLedgerEntryType, string> = {
  mint: 'Compra (mint)',
  burn: 'Conversión (burn)',
  transfer: 'Transferencia',
  lock: 'Bloqueo de garantía',
  unlock: 'Liberación de garantía',
};

const TYPE_ICON: Record<KrtLedgerEntryType, string> = {
  mint: '↓',
  burn: '↑',
  transfer: '⇄',
  lock: '🔒',
  unlock: '🔓',
};

const SUB_BALANCE_LABEL: Record<string, string> = {
  STD: 'disponibles',
  REW: 'cashback',
  CRD: 'de crédito',
  COL: 'en garantía',
};

function EntryRow({ entry, accountId }: { entry: KrtLedgerEntry; accountId: string }) {
  const move = entry.from?.accountId === accountId ? entry.from : entry.to?.accountId === accountId ? entry.to : null;
  if (!move) return null;
  const positive = move.deltaCents > 0;

  return (
    <div className="tx">
      <div className="tx-ic" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
        {TYPE_ICON[entry.type]}
      </div>
      <div className="tx-body">
        <div className="tx-name">
          {TYPE_LABEL[entry.type]} · Puntos {SUB_BALANCE_LABEL[move.subBalance] ?? move.subBalance}
        </div>
        <div className="tx-sub">
          {formatDate(entry.at)} · {entry.reason}
        </div>
      </div>
      <div>
        <div className={`tx-amt ${positive ? 'pos' : 'neg'}`}>
          {positive ? '+' : ''}
          {formatKRT(move.deltaCents)}
        </div>
        <div className="tx-krt">saldo: {formatKRT(move.resultingBalanceCents)}</div>
      </div>
    </div>
  );
}

/** Ledger auditable línea por línea — cada mint/burn/transfer/lock/unlock
 * queda registrado con timestamp, tipo y balance resultante (no solo un
 * movimiento más en el historial general). */
export function TokenLedger({ accountId, onClose }: { accountId: string; onClose: () => void }) {
  const entries = useKoraStore(
    useShallow((s) => s.krtLedger.filter((e) => e.from?.accountId === accountId || e.to?.accountId === accountId))
  );

  useEscapeToClose(onClose);

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="m-head">
          <div className="mi" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
            ≡
          </div>
          <div>
            <h3>Mis movimientos de puntos</h3>
            <p>Ledger de doble entrada — timestamp, tipo y balance resultante</p>
          </div>
          <button className="m-x" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        {entries.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            Aún no tienes movimientos de puntos.
          </div>
        ) : (
          <div className="card">
            {entries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} accountId={accountId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
