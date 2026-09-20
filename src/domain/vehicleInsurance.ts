/** No confundir con `domain/insurance.ts` (`CreditInsurancePolicy`, seguro de
 * desgravamen atado a un plan de cuotas). Esto es seguro del VEHÍCULO en sí
 * — RCV obligatorio, coberturas ampliadas y microseguro pay-per-use. */
export type VehicleCoverageType = 'rcv' | 'ampliada' | 'payperuse';

export interface VehicleInsurancePlan {
  id: string;
  coverageType: VehicleCoverageType;
  name: string;
  description: string;
  /** RCV/ampliada: prima por año. Pay-per-use: tarifa por día activado. */
  priceCents: number;
  priceUnit: 'anual' | 'dia';
  /** Suma asegurada / tope de cobertura. */
  coverageCents: number;
  /** Aseguradora aliada — ilustrativa, [AJUSTAR] cuando haya un aliado real firmado. */
  provider: string;
}

export type VehiclePolicyStatus = 'activa' | 'vencida' | 'cancelada';

export interface VehiclePolicy {
  id: string;
  accountId: string;
  planId: string;
  coverageType: VehicleCoverageType;
  vehiclePlate: string;
  vehicleLabel: string;
  status: VehiclePolicyStatus;
  /** Acumulado de todo lo cobrado a esta póliza (prima anual, o suma de días de payperuse). */
  premiumCents: number;
  coverageCents: number;
  startedAt: string;
  /** RCV/ampliada: vigencia de 1 año. Pay-per-use: no aplica (se paga por día). */
  expiresAt?: string;
  /** Solo pay-per-use. */
  daysActive?: number;
  activeToday?: boolean;
}
