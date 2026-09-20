import type { Order } from '../../../domain/marketplace';
import type { CartLine } from '../../../lib/useCartLines';
import { formatUSD } from '../../../lib/format';

interface Props {
  order: Order;
  lines: CartLine[];
  totalCents: number;
  carrierEtaLabel: string;
  onDone: () => void;
}

export function SuccessStep({ order, lines, totalCents, carrierEtaLabel, onDone }: Props) {
  const productLabel =
    lines.length === 1
      ? lines[0].product.name
      : `${lines[0].product.name}${lines.length > 1 ? ` y ${lines.length - 1} producto${lines.length > 2 ? 's' : ''} más` : ''}`;

  return (
    <div className="checkout-success">
      <div className="cs-icon">✓</div>
      <h3>¡Tu compra fue procesada con éxito!</h3>
      <p>Puedes seguir el estado de tu envío desde Actividad.</p>
      <div className="sim-out" style={{ textAlign: 'left', maxWidth: 360, margin: '0 auto' }}>
        <div className="so-row">
          <span>Número de orden</span>
          <b>#KORA-{order.id.slice(-6).toUpperCase()}</b>
        </div>
        <div className="so-row">
          <span>Producto</span>
          <b>{productLabel}</b>
        </div>
        <div className="so-row">
          <span>Total</span>
          <b>{formatUSD(totalCents)}</b>
        </div>
        <div className="so-row">
          <span>Entrega estimada</span>
          <b>{carrierEtaLabel}</b>
        </div>
      </div>
      <button className="btn full" style={{ maxWidth: 360, margin: '20px auto 0' }} onClick={onDone}>
        Volver al inicio
      </button>
    </div>
  );
}
