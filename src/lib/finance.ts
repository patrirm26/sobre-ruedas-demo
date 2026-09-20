/**
 * Cuota fija por el método francés de amortización.
 * Migrado 1:1 desde KORA_Demo_OF_1.html (frenchCuota, línea ~2198):
 *   n===1 ? P*(1+i) : P*i/(1-(1+i)^-n)
 * `periodicRate` es la tasa del periodo (no anual), en fracción (0.05 = 5%).
 */
export function frenchInstallmentCents(principalCents: number, periodicRate: number, n: number): number {
  if (n <= 0) throw new Error('n debe ser mayor a 0');
  if (n === 1) return Math.round(principalCents * (1 + periodicRate));
  if (periodicRate === 0) return Math.round(principalCents / n);
  return Math.round((principalCents * periodicRate) / (1 - Math.pow(1 + periodicRate, -n)));
}

export interface AmortizationRow {
  index: number;
  interestCents: number;
  principalCents: number;
  balanceCents: number;
  installmentCents: number;
}

/** Tabla de amortización completa (interés/capital/saldo por cuota). */
export function generateAmortizationSchedule(
  principalCents: number,
  periodicRate: number,
  n: number
): AmortizationRow[] {
  const installmentCents = frenchInstallmentCents(principalCents, periodicRate, n);
  const rows: AmortizationRow[] = [];
  let balance = principalCents;

  for (let index = 1; index <= n; index += 1) {
    const interestCents = Math.round(balance * periodicRate);
    const principalPortion = index === n ? balance : Math.min(installmentCents - interestCents, balance);
    balance -= principalPortion;
    rows.push({
      index,
      interestCents,
      principalCents: principalPortion,
      balanceCents: Math.max(balance, 0),
      installmentCents: interestCents + principalPortion,
    });
  }

  return rows;
}

/** Costo total del crédito (suma de cuotas) menos el principal — para mostrar
 * "cuánto pagarás en total" antes de confirmar, como pide un checkout BNPL real. */
export function totalFeeCents(principalCents: number, periodicRate: number, n: number): number {
  const schedule = generateAmortizationSchedule(principalCents, periodicRate, n);
  const totalPaid = schedule.reduce((sum, row) => sum + row.installmentCents, 0);
  return totalPaid - principalCents;
}
