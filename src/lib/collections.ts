export function keyBy<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

export function keyByField<T, K extends keyof T>(items: T[], field: K): Record<string, T> {
  return Object.fromEntries(items.map((item) => [String(item[field]), item])) as Record<string, T>;
}
