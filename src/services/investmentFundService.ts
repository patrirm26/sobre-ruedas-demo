import type { FundPosition } from '../domain/investmentFund';
import { isRealBackendEnabled } from './env';
import { mockInvestmentFundService } from './mocks/investmentFundService.mock';
import { realInvestmentFundService } from './real/investmentFundService.real';

export interface InvestFundInput {
  accountId: string;
  fundId: string;
  amountCents: number;
}

export interface WithdrawFundInput {
  accountId: string;
  fundId: string;
  amountCents: number;
}

export interface InvestmentFundService {
  /** Aporta a un fondo — crea la posición si no existe, o la acumula si ya existe. */
  invest(input: InvestFundInput): Promise<FundPosition>;
  /** Rescata (total o parcial) una posición, primero contra el rendimiento acumulado y luego contra el principal. */
  withdraw(input: WithdrawFundInput): Promise<FundPosition>;
  /** Acumula el rendimiento de todas las posiciones activas contra el reloj simulado — se llama desde SimulationPanel. */
  recalculateYields(): Promise<void>;
}

export const investmentFundService: InvestmentFundService =
  isRealBackendEnabled() ? realInvestmentFundService : mockInvestmentFundService;
