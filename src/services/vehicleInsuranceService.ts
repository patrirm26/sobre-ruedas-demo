import type { VehiclePolicy } from '../domain/vehicleInsurance';
import { isRealBackendEnabled } from './env';
import { mockVehicleInsuranceService } from './mocks/vehicleInsuranceService.mock';
import { realVehicleInsuranceService } from './real/vehicleInsuranceService.real';

export interface IssueTermPolicyInput {
  accountId: string;
  /** Plan 'rcv' o 'ampliada' — pay-per-use usa `togglePayPerUse`. */
  planId: string;
  vehiclePlate: string;
  vehicleLabel: string;
}

export interface TogglePayPerUseInput {
  accountId: string;
  planId: string;
  vehiclePlate: string;
  vehicleLabel: string;
  active: boolean;
}

export interface VehicleInsuranceService {
  /** Emite RCV o Ampliada — cobra la prima anual completa de una vez. */
  issueTermPolicy(input: IssueTermPolicyInput): Promise<VehiclePolicy>;
  /** Prende/apaga el microseguro pay-per-use para una placa. Prender cobra
   * la tarifa del día; apagar no cobra ni reembolsa. Crea la póliza si es
   * la primera vez que se activa esa placa. */
  togglePayPerUse(input: TogglePayPerUseInput): Promise<VehiclePolicy>;
  cancelPolicy(policyId: string): Promise<VehiclePolicy>;
}

export const vehicleInsuranceService: VehicleInsuranceService =
  isRealBackendEnabled() ? realVehicleInsuranceService : mockVehicleInsuranceService;
