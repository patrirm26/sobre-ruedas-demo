import { useMemo } from 'react';
import { useKoraStore } from '../state/store';
import type { CartItem, Product } from '../domain/marketplace';

export interface CartLine {
  item: CartItem;
  product: Product;
}

/**
 * Combina el carrito (ids + cantidades) con los datos de producto.
 *
 * A propósito NO es un selector de Zustand con .map() adentro: crear objetos
 * nuevos por elemento dentro de un selector rompe useShallow (compara cada
 * elemento con Object.is, y un objeto literal nuevo nunca es "igual" al
 * anterior aunque su contenido sea idéntico) — eso metía a React en un loop
 * infinito. Aquí se toman referencias estables del store (cart, products) y
 * la combinación se memoiza con useMemo, no con la igualdad de Zustand.
 */
export function useCartLines(): CartLine[] {
  const cart = useKoraStore((s) => s.cart);
  const products = useKoraStore((s) => s.products);

  return useMemo(
    () =>
      cart
        .map((item) => ({ item, product: products[item.productId] }))
        .filter((line): line is CartLine => Boolean(line.product)),
    [cart, products]
  );
}
