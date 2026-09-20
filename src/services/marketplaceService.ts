import type { CartItem, Order, OrderPaymentMethod } from '../domain/marketplace';
import { isRealBackendEnabled } from './env';
import { mockMarketplaceService } from './mocks/marketplaceService.mock';
import { realMarketplaceService } from './real/marketplaceService.real';

export interface CheckoutWithBalanceInput {
  accountId: string;
  merchantId: string;
  items: CartItem[];
  totalCents: number;
  method: Extract<OrderPaymentMethod, 'saldo' | 'krt'>;
  /** Solo aplica con method:'saldo' — en qué moneda del saldo se cobra.
   * Default 'USD' (comportamiento de siempre) si se omite. */
  currency?: 'USD' | 'VES';
}

export interface RecordBnplOrderInput {
  accountId: string;
  merchantId: string;
  items: CartItem[];
  totalCents: number;
  installmentPlanId: string;
}

export interface MarketplaceService {
  /** Pago único con saldo USD o KRT-STD — descuenta el saldo, registra la
   * orden y transacción, y acredita el cashback por producto a KRT-REW. */
  checkoutWithBalance(input: CheckoutWithBalanceInput): Promise<Order>;
  /** Registra la orden ligada a un plan de cuotas ya creado por bnplService
   * (que ya se encargó del desembolso/liquidación y la transacción). */
  recordBnplOrder(input: RecordBnplOrderInput): Promise<Order>;
}

export const marketplaceService: MarketplaceService = isRealBackendEnabled() ? realMarketplaceService : mockMarketplaceService;
