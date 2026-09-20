import type { Product } from '../../domain/marketplace';
import { formatUSD, formatKRT } from '../../lib/format';
import { frenchInstallmentCents } from '../../lib/finance';

interface Props {
  product: Product;
  merchantName: string;
  onClick: () => void;
}

/** Tasa/plazo representativos solo para el "desde $X/mes" del catálogo —
 * mejor tramo ilustrativo de `getRateForScore` (services/bnplRules.ts), sin
 * llamar a bnplService por tarjeta (evitaría N llamadas async en el grid).
 * La tasa real y personalizada se resuelve en el checkout vía
 * `useInstallmentPreview`, sin cambios ahí. `[AJUSTAR]` mismo criterio que
 * el resto de tasas ilustrativas del proyecto. */
const CATALOG_RATE = 0.03;
const CATALOG_INSTALLMENTS = 4;

export function ProductCard({ product, merchantName, onClick }: Props) {
  const cashbackKrtCents = Math.round(product.priceCents * (product.cashbackPct / 100));
  const installmentFromCents = product.bnplEligible
    ? frenchInstallmentCents(product.priceCents, CATALOG_RATE, CATALOG_INSTALLMENTS)
    : null;
  const roundedRating = product.ratingStars ? Math.round(product.ratingStars) : 0;

  return (
    <div className="prod-card" onClick={onClick}>
      <div className="pc-image-wrap">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        {product.compareAtPriceCents && <span className="pc-badge pc-badge-discount">Oferta</span>}
        {product.escrowEligible && (
          <span className="pc-badge" style={{ left: 10, right: 'auto', background: 'var(--ink)', color: '#fff' }}>
            🔒 Escrow
          </span>
        )}
      </div>
      <div className="pc-body">
        <div className="pc-merchant">{merchantName}</div>
        <div className="pc-name">{product.name}</div>
        {(product.year || product.mileageKm !== undefined) && (
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: -2, marginBottom: 2 }}>
            {product.year}
            {product.mileageKm !== undefined ? ` · ${product.mileageKm.toLocaleString('es-VE')} km` : ''}
          </div>
        )}
        {product.ratingStars && (
          <div className="pc-rating">
            <span>{'★'.repeat(roundedRating)}{'☆'.repeat(5 - roundedRating)}</span>
            {product.ratingStars.toFixed(1)}
          </div>
        )}
        <div className="pc-price-row">
          {product.compareAtPriceCents && <span className="pc-price-old">{formatUSD(product.compareAtPriceCents)}</span>}
          <span className="pc-price">{formatUSD(product.priceCents)}</span>
        </div>
        {installmentFromCents !== null && (
          <div className="pc-cuotas">
            Desde {formatUSD(installmentFromCents)}/mes en {CATALOG_INSTALLMENTS} cuotas
          </div>
        )}
        <div className="pc-cashback">+{formatKRT(cashbackKrtCents)} de cashback</div>
      </div>
    </div>
  );
}
