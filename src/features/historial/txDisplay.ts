import type { Transaction, TransactionCategory } from '../../domain/transaction';
import { formatUSD, formatVES, formatKRT, formatDate } from '../../lib/format';

const CATEGORY_DISPLAY: Record<TransactionCategory, { icon: string; bg: string }> = {
  pago: { icon: '↕', bg: 'color-mix(in srgb, var(--accent) 12%, transparent)' },
  token: { icon: '◉', bg: 'color-mix(in srgb, var(--accent) 12%, transparent)' },
  credito: { icon: '◐', bg: 'rgba(230,160,25,.1)' },
  remesa: { icon: '🌎', bg: 'color-mix(in srgb, var(--accent) 10%, transparent)' },
  cobro: { icon: '↓', bg: 'rgba(31,169,113,.1)' },
  gobierno: { icon: '🏛', bg: 'rgba(214,69,80,.09)' },
  marketplace: { icon: '🛍', bg: 'rgba(214,69,80,.09)' },
  activo: { icon: '◆', bg: 'rgba(147,51,234,.12)' },
  banco: { icon: '🏦', bg: 'rgba(13,148,136,.12)' },
  fondo: { icon: '📈', bg: 'rgba(34,197,94,.12)' },
  tarjeta: { icon: '💳', bg: 'rgba(99,102,241,.12)' },
  convert: { icon: '⇄', bg: 'color-mix(in srgb, var(--accent) 10%, transparent)' },
};

export function getTxDisplay(tx: Transaction) {
  const { icon, bg } = CATEGORY_DISPLAY[tx.category];
  const amountClass = tx.category === 'token' ? 'gold' : tx.direction === 'in' ? 'pos' : 'neg';
  const sign = tx.direction === 'in' ? '+' : '−';
  const formatter = tx.currency === 'VES' ? formatVES : tx.currency === 'KRT' ? formatKRT : formatUSD;
  const amountLabel = tx.amountCents === 0 ? null : `${sign}${formatter(tx.amountCents)}`;
  const krtLabel = tx.krtDeltaCents ? `${tx.krtDeltaCents > 0 ? '+' : ''}${formatKRT(tx.krtDeltaCents)}` : null;

  return {
    icon,
    bg,
    amountClass,
    amountLabel,
    krtLabel,
    dateLabel: formatDate(tx.at),
  };
}
