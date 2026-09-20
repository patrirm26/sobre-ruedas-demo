import { useState } from 'react';
import { useKoraStore } from '../../state/store';
import type { Product } from '../../domain/marketplace';
import { formatUSD, formatKRT } from '../../lib/format';
import { useEscapeToClose } from '../../lib/useEscapeToClose';

interface Props {
  product: Product;
  merchantName: string;
  onClose: () => void;
  onOpenCart: () => void;
}

/** Ficha de producto — agregar al carrito. Si el carrito ya tenía productos
 * de OTRO comercio, se vacía primero: una orden es siempre con un solo
 * comercio (así el checkout puede liquidarlo de una vez). */
export function ProductDetailModal({ product, merchantName, onClose, onOpenCart }: Props) {
  const [qty, setQty] = useState(1);
  const cart = useKoraStore((s) => s.cart);
  const products = useKoraStore((s) => s.products);
  const addToCart = useKoraStore((s) => s.addToCart);
  const clearCart = useKoraStore((s) => s.clearCart);
  const showToast = useKoraStore((s) => s.showToast);

  useEscapeToClose(onClose);

  /** Repuestos se compran por cantidad; un vehículo/moto/bici es una sola
   * unidad — no tiene sentido "agregar 3" de un mismo Corolla usado. */
  const isSingleUnit = product.category !== 'Repuestos';

  const cashbackKrtCents = Math.round(product.priceCents * qty * (product.cashbackPct / 100));

  const handleAddToCart = () => {
    const currentMerchantId = cart.length > 0 ? products[cart[0].productId]?.merchantId : undefined;
    if (currentMerchantId && currentMerchantId !== product.merchantId) {
      clearCart();
      showToast('🛍 Tu carrito anterior se vació — una compra es con un solo comercio a la vez');
    }
    addToCart(product.id, qty);
    showToast(`✅ ${product.name} agregado al carrito`);
    onClose();
  };

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="m-head">
          <div>
            <h3>{product.name}</h3>
            <p>{merchantName}</p>
          </div>
          <button className="m-x" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="pd-image">
          <img src={product.imageUrl} alt={product.name} />
        </div>
        {(product.year || product.mileageKm !== undefined || product.condition) && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {product.condition && (
              <span className="pc-cuotas" style={{ background: 'var(--surface3)', color: 'var(--ink)' }}>
                {product.condition === 'nuevo' ? '● 0 KM' : '● Usado'}
              </span>
            )}
            {product.year && <span className="pc-cuotas" style={{ background: 'var(--surface3)', color: 'var(--ink)' }}>{product.year}</span>}
            {product.mileageKm !== undefined && (
              <span className="pc-cuotas" style={{ background: 'var(--surface3)', color: 'var(--ink)' }}>
                {product.mileageKm.toLocaleString('es-VE')} km
              </span>
            )}
          </div>
        )}
        {product.escrowEligible && (
          <div
            style={{
              background: 'color-mix(in srgb, var(--ink) 6%, transparent)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: '10px 12px',
              marginBottom: 12,
              fontSize: 12,
              lineHeight: 1.45,
            }}
          >
            <b>🔒 Protegido con Escrow.</b> Tu pago queda retenido por Sobre Ruedas y solo se libera al vendedor
            cuando confirmas que el traspaso (INTT) y la entrega del vehículo están completos. Si algo no cuadra,
            el dinero se devuelve a tu saldo.
          </div>
        )}
        <div className="pd-price">{formatUSD(product.priceCents)}</div>
        {product.bnplEligible ? (
          <div className="pc-cuotas" style={{ marginBottom: 10 }}>
            ✓ Disponible con KORA Cuotas — elige el plan en el checkout
          </div>
        ) : (
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 10 }}>
            Este producto solo admite pago único (saldo o puntos).
          </div>
        )}
        <div style={{ fontSize: 11.5, color: 'var(--gold)', fontWeight: 700, marginBottom: 16 }}>
          +{formatKRT(cashbackKrtCents)} de cashback al confirmar la compra
        </div>

        {!isSingleUnit && (
          <div className="in-group">
            <label className="in-label">CANTIDAD</label>
            <div className="qty-stepper">
              <button aria-label="Disminuir cantidad" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>
                −
              </button>
              <span>{qty}</span>
              <button aria-label="Aumentar cantidad" onClick={() => setQty((q) => Math.min(10, q + 1))} disabled={qty >= 10}>
                +
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 9 }}>
          <button className="btn full" onClick={handleAddToCart}>
            Agregar al carrito · {formatUSD(product.priceCents * qty)}
          </button>
        </div>
        <button
          className="btn ghost full"
          style={{ marginTop: 9 }}
          onClick={() => {
            onClose();
            onOpenCart();
          }}
        >
          Ver carrito
        </button>
      </div>
    </div>
  );
}
