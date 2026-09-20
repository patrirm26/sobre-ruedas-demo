import { isRealBackendEnabled } from './env';
import { mockConvertService } from './mocks/convertService.mock';
import { realConvertService } from './real/convertService.real';

export type ConvertCurrency = 'VES' | 'USD' | 'KRT';

export interface ConvertInput {
  accountId: string;
  from: ConvertCurrency;
  to: ConvertCurrency;
  amountCents: number;
}

export interface ConvertResult {
  toAmountCents: number;
}

export interface ConvertService {
  /** Convert multimoneda instantáneo (Sprint 9). VES↔USD es directo, sin
   * comisión (utilidad de billetera, tasa BCV pura). Cualquier tramo con
   * KRT se orquesta reusando tokenService.mint/burn (que ya cobran su
   * propia comisión) — nunca se reimplementa el lado KRT acá. */
  convert(input: ConvertInput): Promise<ConvertResult>;
}

export const convertService: ConvertService = isRealBackendEnabled() ? realConvertService : mockConvertService;
