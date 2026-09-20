import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { selectAccountTransactions } from '../../state/selectors';
import { TxRow } from '../../components/TxRow';
import { PageShell } from '../../components/PageShell';
import { formatUSD, formatVES } from '../../lib/format';
import type { TransactionCategory, TransactionDirection } from '../../domain/transaction';

type FilterId = 'todo' | 'recibido' | 'enviado' | 'token' | 'credito' | 'remesa';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'todo', label: 'Todo' },
  { id: 'recibido', label: 'Recibido' },
  { id: 'enviado', label: 'Enviado' },
  { id: 'token', label: 'Puntos' },
  { id: 'credito', label: 'Créditos' },
  { id: 'remesa', label: 'Remesas' },
];

function matches(filter: FilterId, category: TransactionCategory, direction: TransactionDirection): boolean {
  if (filter === 'todo') return true;
  if (filter === 'recibido') return direction === 'in';
  if (filter === 'enviado') return direction === 'out';
  return category === filter;
}

export function HistorialView() {
  const [filter, setFilter] = useState<FilterId>('todo');
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  const transactions = useKoraStore(useShallow(selectAccountTransactions));
  const filtered = transactions.filter((tx) => matches(filter, tx.category, tx.direction));

  // Ventana móvil de 30 días en vez de mes calendario — evita que el total
  // se vea artificialmente chico los primeros días de cada mes.
  const thirtyDaysAgo = Date.now() - 30 * 86_400_000;
  const monthTotalVesCents = transactions
    .filter((tx) => tx.direction === 'in' && tx.currency !== 'KRT' && new Date(tx.at).getTime() >= thirtyDaysAgo)
    .reduce((sum, tx) => sum + (tx.currency === 'USD' ? Math.round(tx.amountCents * bcvRate) : tx.amountCents), 0);

  return (
    <PageShell
      title={formatVES(monthTotalVesCents)}
      subtitle={`Recibiste en los últimos 30 días · ≈ ${formatUSD(Math.round(monthTotalVesCents / bcvRate))}`}
    >
      <div className="cats">
        {FILTERS.map((f) => (
          <button key={f.id} className={`cat ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="card">
        {filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            No hay movimientos en esta categoría.
          </div>
        ) : (
          filtered.map((tx) => <TxRow key={tx.id} tx={tx} />)
        )}
      </div>
    </PageShell>
  );
}
