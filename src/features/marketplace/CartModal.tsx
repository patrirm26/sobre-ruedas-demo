import { useKoraStore } from '../../state/store';
import { formatUSD } from '../../lib/format';
import { useCartLines } from '../../lib/useCartLines';
import { useEscapeToClose } from '../../lib/useEscapeToClose';

interface Props {
  onClose: () => void;
  onCheckout: () => void;
}

export function CartModal({ onClose, onCheckout }: Props) {
  const merchants = useKoraStore((s) => s.merchants);
  const setCartQty = useKoraStore((s) => s.setCartQty);
  const removeFromCart = useKoraStore((s) => s.removeFromCart);

  const lines = useCartLines();

  useEscapeToClose(onClose);

  const totalCents = lines.reduce((sum, l) => sum + l.product.priceCents * l.item.qty, 0);
  const merchantName = lines[0] ? merchants[lines[0].product.merchantId]?.name : null;

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="m-head">
          <div>
            <h3>Tu carrito</h3>
            <p>{merchantName ?? 'Sin productos todavía'}</p>
          </div>
          <button className="m-x" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {lines.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            Tu carrito está vacío.
          </div>
        ) : (
          <>
            <div>
              {lines.map(({ item, product }) => (
                <div className="cart-row" key={item.productId}>
                  <img src={product.imageUrl} alt={product.name} />
                  <div className="cr-body">
                    <div className="cr-name">{product.name}</div>
                    <div className="cr-price">
                      {formatUSD(product.priceCents)} c/u · {formatUSD(product.priceCents * item.qty)}
                    </div>
                    <div className="qty-stepper" style={{ marginTop: 6, padding: '3px 10px' }}>
                      <button aria-label="Disminuir cantidad" onClick={() => setCartQty(item.productId, item.qty - 1)}>
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button
                        aria-label="Aumentar cantidad"
                        onClick={() => setCartQty(item.productId, item.qty + 1)}
                        disabled={item.qty >= 10}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button className="cr-remove" onClick={() => removeFromCart(item.productId)}>
                    Quitar
                  </button>
                </div>
              ))}
            </div>
            <div className="q-line big" style={{ marginTop: 8 }}>
              <span>Total</span>
              <b>{formatUSD(totalCents)}</b>
            </div>
            <button className="btn full" style={{ marginTop: 14 }} onClick={onCheckout}>
              Continuar al pago
            </button>
          </>
        )}
      </div>
    </div>
  );
}
