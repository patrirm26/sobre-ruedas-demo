/**
 * Tasa oficial BCV (Banco Central de Venezuela). El BCV no publica una API
 * pública propia, así que se consulta dolarapi.com — agregador gratuito,
 * sin API key, con CORS abierto, que reporta la tasa "oficial" (fuente BCV).
 *
 * Esta es la única llamada de red real de todo el sandbox: es un dato de
 * mercado público (no una transacción ni un dato de un usuario), así que no
 * choca con la regla de "nada de integraciones reales" del resto del
 * proyecto — ver README para el detalle de esta excepción.
 */
const BCV_RATE_ENDPOINT = 'https://ve.dolarapi.com/v1/dolares/oficial';

export interface BcvRateResult {
  rate: number;
  /** Fecha que reporta la fuente oficial para esta tasa. */
  asOf: string;
}

export async function fetchOfficialBcvRate(): Promise<BcvRateResult> {
  const response = await fetch(BCV_RATE_ENDPOINT);
  if (!response.ok) {
    throw new Error(`No se pudo consultar la tasa BCV (HTTP ${response.status})`);
  }

  const data: unknown = await response.json();
  const rate = (data as { promedio?: unknown })?.promedio;
  const asOf = (data as { fechaActualizacion?: unknown })?.fechaActualizacion;

  if (typeof rate !== 'number' || typeof asOf !== 'string') {
    throw new Error('La fuente de la tasa BCV devolvió un formato inesperado.');
  }

  return { rate, asOf };
}
