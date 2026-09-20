import type { CardService } from '../cardService';

const NOT_IMPLEMENTED =
  'Not implemented: cardService requiere un procesador de tarjetas licenciado (emisión, autorización, liquidación) — ver PRODUCTION_CHECKLIST.md.';

export const realCardService: CardService = {
  async issueCard() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async setDailyLimit() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async setFrozen() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async cancelCard() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async purchase() {
    throw new Error(NOT_IMPLEMENTED);
  },
};
