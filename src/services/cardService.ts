import type { Card } from '../domain/card';
import type { Transaction } from '../domain/transaction';
import { isRealBackendEnabled } from './env';
import { mockCardService } from './mocks/cardService.mock';
import { realCardService } from './real/cardService.real';

export interface IssueCardInput {
  accountId: string;
}

export interface SetDailyLimitInput {
  cardId: string;
  dailyLimitCents: number;
}

export interface SetFrozenInput {
  cardId: string;
  frozen: boolean;
}

export interface CancelCardInput {
  cardId: string;
}

export interface CardPurchaseInput {
  cardId: string;
  amountCents: number;
  merchantName: string;
}

export interface CardService {
  /** Emisión self-service — instantánea si se cumple el nivel KYC mínimo, sin aprobación del operador. */
  issueCard(input: IssueCardInput): Promise<Card>;
  setDailyLimit(input: SetDailyLimitInput): Promise<Card>;
  /** Congelar/descongelar — el usuario o el operador (respuesta a fraude) pueden llamarlo. */
  setFrozen(input: SetFrozenInput): Promise<Card>;
  /** Cancelación permanente — libera al usuario para emitir una tarjeta nueva. */
  cancelCard(input: CancelCardInput): Promise<Card>;
  /** Simula una compra con la tarjeta — respeta estado y límite, da cashback real. */
  purchase(input: CardPurchaseInput): Promise<Transaction>;
}

export const cardService: CardService = isRealBackendEnabled() ? realCardService : mockCardService;
