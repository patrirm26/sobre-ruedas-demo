import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { selectActiveAccount, selectActiveUser } from '../../state/selectors';
import type { Product } from '../../domain/marketplace';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { CartModal } from './CartModal';
import { CheckoutModal } from './CheckoutModal';
import { MerchantDashboard } from './MerchantDashboard';
import { formatUSD } from '../../lib/format';

const CATEGORIES = ['Todo', 'Vehículos Nuevos', 'Vehículos Usados', 'Motos', 'Bicicletas', 'Repuestos'];

type Screen = 'catalog' | 'cart' | 'checkout';
type Tab = 'catalog' | 'merchant';

export function MarketplaceView() {
  const [tab, setTab] = useState<Tab>('catalog');
  const [category, setCategory] = useState('Todo');
  const [screen, setScreen] = useState<Screen>('catalog');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const account = useKoraStore(selectActiveAccount);
  const activeUser = useKoraStore(selectActiveUser);
  const setActiveView = useKoraStore((s) => s.setActiveView);
  const justRegistered = useKoraStore((s) => s.justRegistered);
  const dismissJustRegistered = useKoraStore((s) => s.dismissJustRegistered);
  const products = useKoraStore(useShallow((s) => Object.values(s.products)));
  const merchants = useKoraStore((s) => s.merchants);
  const ownsAffiliatedMerchant = Object.values(merchants).some((m) => m.ownerUserId === activeUser?.id);
  const cartCount = useKoraStore(useShallow((s) => s.cart.reduce((sum, i) => sum + i.qty, 0)));
  const cuotasSummary = useKoraStore(
    useShallow((s) => {
      if (!account) return { count: 0, pendingCents: 0 };
      const activePlans = Object.values(s.installmentPlans).filter((p) => p.accountId === account.id && p.status !== 'pagado');
      const pendingCents = activePlans.reduce(
        (sum, p) => sum + p.installments.filter((i) => i.status !== 'pagado').reduce((s2, i) => s2 + i.amountCents + i.lateFeeCents, 0),
        0
      );
      return { count: activePlans.length, pendingCents };
    })
  );

  const [dealsOnly, setDealsOnly] = useState(false);

  const dealProducts = products.filter((p) => p.compareAtPriceCents);
  const maxDiscountPct = dealProducts.reduce((max, p) => {
    const pct = Math.round((1 - p.priceCents / (p.compareAtPriceCents ?? p.priceCents)) * 100);
    return Math.max(max, pct);
  }, 0);

  const byCategory = category === 'Todo' ? products : products.filter((p) => p.category === category);
  const filtered = dealsOnly ? byCategory.filter((p) => p.compareAtPriceCents) : byCategory;

  return (
    <>
      <div className="mkt-tabs">
        <button className={`mkt-tab ${tab === 'catalog' ? 'active' : ''}`} onClick={() => setTab('catalog')}>
          Catálogo
        </button>
        {activeUser?.accountType === 'empresa' && ownsAffiliatedMerchant && (
          <button className={`mkt-tab ${tab === 'merchant' ? 'active' : ''}`} onClick={() => setTab('merchant')}>
            Panel de comercio
          </button>
        )}
      </div>

      {tab === 'catalog' ? (
        <>
          {dealProducts.length > 0 && (
            <div className="mkt-hero">
              <div className="mkt-hero-copy">
                <span className="mkt-hero-eyebrow">Ofertas de la semana</span>
                <h2>Hasta {maxDiscountPct}% off en vehículos y motos</h2>
                <p>Compra protegida con Escrow en usados — el pago se libera solo cuando confirmas el traspaso.</p>
                <button
                  className="btn"
                  onClick={() => {
                    setCategory('Todo');
                    setDealsOnly(true);
                  }}
                >
                  Ver {dealProducts.length} ofertas →
                </button>
              </div>
              <div className="mkt-hero-thumbs">
                {dealProducts.slice(0, 3).map((p) => (
                  <img key={p.id} src={p.imageUrl} alt={p.name} />
                ))}
              </div>
            </div>
          )}
          {justRegistered && (
            <div className="welcome-banner">
              <div>
                <b>🎉 Tienes {formatUSD(account?.balanceUsdCents ?? 0)} de crédito promocional</b>
                <p>Es un bono de bienvenida de prueba — haz tu primera compra en Sobre Ruedas.</p>
              </div>
              <button className="welcome-banner-close" onClick={dismissJustRegistered} aria-label="Cerrar">
                ✕
              </button>
            </div>
          )}
          {cuotasSummary.count > 0 && (
            <div
              className="card"
              style={{ padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => setActiveView('cuotas')}
            >
              <div>
                <b style={{ fontSize: 13 }}>▤ Mis cuotas activas</b>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {cuotasSummary.count} plan{cuotasSummary.count > 1 ? 'es' : ''} · {formatUSD(cuotasSummary.pendingCents)} pendientes
                </div>
              </div>
              <span className="lnk">Ver todas →</span>
            </div>
          )}
          <div className="cats">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`cat ${category === c && !dealsOnly ? 'active' : ''}`}
                onClick={() => {
                  setCategory(c);
                  setDealsOnly(false);
                }}
              >
                {c}
              </button>
            ))}
            {dealsOnly && (
              <button className="cat active" onClick={() => setDealsOnly(false)}>
                ★ Ofertas ✕
              </button>
            )}
          </div>
          {filtered.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              No hay productos en esta categoría todavía.
            </div>
          ) : (
            <div className="prod-grid">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  merchantName={merchants[product.merchantId]?.name ?? ''}
                  onClick={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          )}

          {cartCount > 0 && (
            <button className="cart-fab" onClick={() => setScreen('cart')} aria-label="Ver carrito">
              🛒
              <span className="cart-badge">{cartCount}</span>
            </button>
          )}

          {selectedProduct && (
            <ProductDetailModal
              product={selectedProduct}
              merchantName={merchants[selectedProduct.merchantId]?.name ?? ''}
              onClose={() => setSelectedProduct(null)}
              onOpenCart={() => setScreen('cart')}
            />
          )}
          {screen === 'cart' && (
            <CartModal onClose={() => setScreen('catalog')} onCheckout={() => setScreen('checkout')} />
          )}
          {screen === 'checkout' && (
            <CheckoutModal onClose={() => setScreen('cart')} onSuccess={() => setScreen('catalog')} />
          )}
        </>
      ) : (
        <MerchantDashboard />
      )}
    </>
  );
}
