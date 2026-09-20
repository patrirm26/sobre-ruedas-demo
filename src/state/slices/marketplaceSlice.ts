import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { Product, Merchant, CartItem, Order } from '../../domain/marketplace';
import { SEED_PRODUCTS } from '../../data/seedProducts';
import { SEED_MERCHANTS } from '../../data/seedMerchants';
import { keyBy } from '../../lib/collections';

export interface MarketplaceSlice {
  products: Record<string, Product>;
  merchants: Record<string, Merchant>;
  cart: CartItem[];
  orders: Record<string, Order>;
  addToCart: (productId: string, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  /** Fija la cantidad exacta — quita el producto si queda en 0. */
  setCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  addOrder: (order: Order) => void;
  /** Alta de un comercio nuevo — usada por onboardingService al aprobar una MerchantOnboardingRequest. */
  addMerchant: (merchant: Merchant) => void;
  /** Reemplaza las órdenes del usuario por las del backend real (Sprint 10
   * — hidratación) — no toca `products`/`merchants`, que siguen siendo el
   * catálogo compartido, no datos propios del usuario. */
  hydrateOrders: (orders: Order[]) => void;
}

export const createMarketplaceSlice: StateCreator<StoreState, [], [], MarketplaceSlice> = (set) => ({
  products: keyBy(SEED_PRODUCTS),
  merchants: keyBy(SEED_MERCHANTS),
  cart: [],
  orders: {},

  addToCart: (productId, qty = 1) =>
    set((state) => {
      const existing = state.cart.find((item) => item.productId === productId);
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.productId === productId ? { ...item, qty: item.qty + qty } : item
          ),
        };
      }
      return { cart: [...state.cart, { productId, qty }] };
    }),

  removeFromCart: (productId) =>
    set((state) => ({ cart: state.cart.filter((item) => item.productId !== productId) })),

  setCartQty: (productId, qty) =>
    set((state) => ({
      cart:
        qty <= 0
          ? state.cart.filter((item) => item.productId !== productId)
          : state.cart.map((item) => (item.productId === productId ? { ...item, qty } : item)),
    })),

  clearCart: () => set({ cart: [] }),

  addOrder: (order) => set((state) => ({ orders: { ...state.orders, [order.id]: order } })),

  addMerchant: (merchant) => set((state) => ({ merchants: { ...state.merchants, [merchant.id]: merchant } })),

  hydrateOrders: (orders) => set({ orders: keyBy(orders) }),
});
