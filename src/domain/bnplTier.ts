export interface BnplTier {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  minScore: number;
  capCents: number;
  initialPct: number;
  installmentsAvailable: number[];
}
