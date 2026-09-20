import type { MarketplaceService } from '../marketplaceService';
import { invokeEdgeFunction } from '../../lib/invokeEdgeFunction';

export const realMarketplaceService: MarketplaceService = {
  checkoutWithBalance: (input) => invokeEdgeFunction('marketplace-checkout', input),

  recordBnplOrder: (input) => invokeEdgeFunction('marketplace-record-bnpl-order', input),
};
