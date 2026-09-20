export type CardStatus = 'activa' | 'congelada' | 'cancelada';

export interface Card {
  id: string;
  accountId: string;
  /** Solo se guardan/muestran los últimos 4 dígitos — no hay PAN completo. */
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  status: CardStatus;
  dailyLimitCents: number;
  issuedAt: string;
  /** 3 dígitos, oculto por defecto en la tarjeta digital — el usuario lo
   * revela con "Ver CVV" (mismo criterio de dato sensible que `last4`). */
  cvv: string;
}
