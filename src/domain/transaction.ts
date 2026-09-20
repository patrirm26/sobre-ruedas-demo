export type TransactionCategory =
  | 'pago'
  | 'token'
  | 'credito'
  | 'remesa'
  | 'cobro'
  | 'gobierno'
  | 'marketplace'
  | 'activo'
  | 'banco'
  | 'fondo'
  | 'tarjeta'
  | 'convert';

export type TransactionDirection = 'in' | 'out';
export type TransactionCurrency = 'VES' | 'USD' | 'KRT';

/** Fila unificada de historial — toda acción del sandbox debe registrar una de estas. */
export interface Transaction {
  id: string;
  accountId: string;
  at: string;
  title: string;
  subtitle: string;
  amountCents: number;
  currency: TransactionCurrency;
  direction: TransactionDirection;
  category: TransactionCategory;
  /** Cambio adicional en KRT cuando la transacción principal es en otra moneda (ej. cashback de una compra en Bs). */
  krtDeltaCents?: number;
  relatedEntityId?: string;
}
