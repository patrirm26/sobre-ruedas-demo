export type LoyaltyChannel = 'qr' | 'remesa' | 'govtech' | 'cuotas' | 'tarjeta';

export interface LoyaltyRate {
  channel: LoyaltyChannel;
  label: string;
  description: string;
  cashbackPct: number;
}
