import type { CondoUnit } from '../domain/consorcio';
import { ENV } from './env';
import { mockCondoService } from './mocks/condoService.mock';
import { realCondoService } from './real/condoService.real';

export interface LoadMonthlyFeesInput {
  accountId: string;
  feeCents: number;
}

export interface MarkUnitPaidInput {
  unitId: string;
}

export interface CondoService {
  /** Simula un mes nuevo: todas las unidades del edificio vuelven a `pendiente` con el monto indicado. */
  loadMonthlyFees(input: LoadMonthlyFeesInput): Promise<void>;
  /** Simula la conciliación de un pago entrante para una unidad puntual. */
  markUnitPaid(input: MarkUnitPaidInput): Promise<CondoUnit>;
}

export const condoService: CondoService = ENV === 'production' ? realCondoService : mockCondoService;
