let counter = 0;

/** ID legible y único dentro de la sesión, ej. "tx_m3f8k2_a1". No es un UUID
 * criptográfico — suficiente para un sandbox sin backend real. */
export function generateId(prefix: string): string {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rand}${counter}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
