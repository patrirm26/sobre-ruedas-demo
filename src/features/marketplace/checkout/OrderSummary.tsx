import type { CartLine } from '../../../lib/useCartLines';
import { formatUSD } from '../../../lib/format';

interface Props {
  lines: CartLine[];
  totalCents: number;
}

/** Resumen fijo del pedido — igual en los 3 pasos previos al éxito. */
export function OrderSummary({ lines, totalCents }: Props) {
  return (
    <div className="checkout-summary card" style={{ padding: 18 }}>
      <b style={{ fontSize: 13 }}>Resumen del pedido</b>
      <div style={{ marginTop: 12 }}>
        {lines.map(({ item, product }) => (
          <div key={item.productId} style={{ display: 'flex', gap: 10, padding: '8px 0' }}>
            <img src={product.imageUrl} alt={product.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                {item.qty > 1 ? `${item.qty} × ` : ''}
                {formatUSD(product.priceCents)}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="sim-out" style={{ marginTop: 10 }}>
        <div className="so-row">
          <span>Envío</span>
          <b style={{ color: 'var(--green)' }}>Gratis</b>
        </div>
        <div className="so-row hl">
          <span>Total</span>
          <b>{formatUSD(totalCents)}</b>
        </div>
      </div>
    </div>
  );
}
