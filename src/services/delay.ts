/** Latencia simulada para que los mocks se sientan como una llamada de red
 * real (breve loading) en vez de una respuesta instantánea y evidente. */
export function simulateLatency(minMs = 300, maxMs = 900): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
