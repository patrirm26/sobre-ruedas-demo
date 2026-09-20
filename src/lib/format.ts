const vesNumberFormatter = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usdFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const numberFormatter = new Intl.NumberFormat('es-VE', { maximumFractionDigits: 2 });
const dateFormatter = new Intl.DateTimeFormat('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });

/** Intl no tiene un símbolo "Bs" simple para VES (usa "Bs.S" o "Bs."), así
 * que se prefija a mano para calzar con el copy del diseño original. */
export function formatVES(cents: number): string {
  return `Bs ${vesNumberFormatter.format(cents / 100)}`;
}

export function formatUSD(cents: number): string {
  return usdFormatter.format(cents / 100);
}

/** Los puntos KORA no tienen símbolo de Intl propio: se formatean como
 * número + sufijo. "token" no puede aparecer en la app (restricción del
 * contexto bancario venezolano) — el nombre interno de la función y del
 * dominio (`KrtSubBalance`, `tokenService`, etc.) no cambia, solo el
 * texto que ve el usuario. */
export function formatKRT(cents: number): string {
  return `${numberFormatter.format(cents / 100)} puntos`;
}

export function formatPercent(pct: number): string {
  return `${numberFormatter.format(pct)}%`;
}

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
