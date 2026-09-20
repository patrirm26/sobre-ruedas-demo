export interface Merchant {
  id: string;
  name: string;
  category: string;
  /** Comisión BNPL que paga el comercio a KORA, no el usuario. */
  bnplMerchantFeePct: number;
  /** RIF/cédula del comercio — opcional, los 5 comercios semilla no lo tienen; los dados de alta desde Onboarding sí. */
  taxId?: string;
  /** Cuenta empresa dueña de este comercio (Sprint 4 — gate empresarial).
   * Ya existía como `owner_user_id` en el schema de Supabase desde la Fase A
   * ("queda listo para cuando exista login de comercio"); el cliente nunca
   * lo había expuesto hasta ahora. */
  ownerUserId?: string;
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  /** Siempre en USD, como en el catálogo original ("$X"). */
  priceCents: number;
  /** Precio "antes" tachado, opcional — efecto de descuento de tienda real. */
  compareAtPriceCents?: number;
  imageUrl: string;
  category: string;
  bnplEligible: boolean;
  cashbackPct: number;
  /** [AJUSTAR] rating ilustrativo 1-5, mismo criterio que cashbackPct. */
  ratingStars?: number;
  /** Solo vehículos (autos/motos) — año-modelo. Ausente en repuestos/bicicletas. */
  year?: number;
  /** Solo usados — kilometraje. Ausente en nuevos, repuestos y bicicletas. */
  mileageKm?: number;
  /** 'nuevo' | 'usado' — solo autos y motos. Determina si se ofrece Escrow en el checkout. */
  condition?: 'nuevo' | 'usado';
  /** true en toda operación C2C/C2B de vehículo usado — activa el flujo de Escrow
   * (fondos retenidos hasta traspaso verificado) en vez de "compra protegida" genérica. */
  escrowEligible?: boolean;
}

export interface CartItem {
  productId: string;
  qty: number;
}

export type OrderPaymentMethod = 'saldo' | 'krt' | 'bnpl';

export interface Order {
  id: string;
  accountId: string;
  merchantId: string;
  at: string;
  items: CartItem[];
  /** Siempre en USD, igual que Product.priceCents. */
  totalCents: number;
  paymentMethod: OrderPaymentMethod;
  installmentPlanId?: string;
}
