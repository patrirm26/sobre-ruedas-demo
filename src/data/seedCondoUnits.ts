import type { CondoUnit } from '../domain/consorcio';

const ACCOUNT_ID = 'account-elavila';
const FEE_CENTS = 35_00;

const offsetDaysIso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

/** Las 9 unidades con nombre e historia ya conocidas de la vista original
 * (antes hardcodeadas en ConsorcioView.tsx) — se preservan tal cual para no
 * romper la continuidad de la demo. Las 39 restantes se generan abajo. */
const NAMED_UNITS: Omit<CondoUnit, 'id' | 'accountId' | 'feeCents'>[] = [
  { label: 'Apto 3A', ownerName: 'Rodríguez L.', status: 'pagado', paidAt: offsetDaysIso(0), paymentMethod: 'Pago Móvil' },
  { label: 'Apto 5B', ownerName: 'Martínez C.', status: 'pagado', paidAt: offsetDaysIso(0), paymentMethod: 'QR de la unidad' },
  { label: 'Apto 9D', ownerName: 'Fernández A.', status: 'pagado', paidAt: offsetDaysIso(0), paymentMethod: 'Transferencia' },
  { label: 'Apto 7C', ownerName: 'Pérez M.', status: 'pendiente' },
  { label: 'Apto 12B', ownerName: 'García T.', status: 'pendiente' },
  { label: 'Apto 15A', ownerName: 'Sucre F.', status: 'pendiente' },
  { label: 'Apto 2B', ownerName: 'Blanco R.', status: 'pendiente' },
  { label: 'Apto 8A', ownerName: 'Ríos D.', status: 'pendiente' },
  { label: 'Apto 11C', ownerName: 'Colmenares V.', status: 'pendiente' },
];

const FILLER_SURNAMES = [
  'Silva', 'Torres', 'Ramírez', 'Guerra', 'Salazar', 'Peña', 'Marcano', 'Uzcátegui',
  'Quintero', 'Bastidas', 'Escalona', 'Ochoa', 'Tovar', 'Zambrano', 'Camacho', 'Linares',
];

function buildFillerUnits(count: number): Omit<CondoUnit, 'id' | 'accountId' | 'feeCents'>[] {
  const usedLabels = new Set(NAMED_UNITS.map((u) => u.label));
  const units: Omit<CondoUnit, 'id' | 'accountId' | 'feeCents'>[] = [];
  let floor = 1;
  const letters = ['A', 'B', 'C', 'D'];
  while (units.length < count) {
    for (const letter of letters) {
      if (units.length >= count) break;
      const label = `Apto ${floor}${letter}`;
      if (usedLabels.has(label)) continue;
      units.push({
        label,
        ownerName: `${FILLER_SURNAMES[units.length % FILLER_SURNAMES.length]} ${String.fromCharCode(65 + (units.length % 20))}.`,
        status: 'pagado',
        paidAt: offsetDaysIso(-3 - (units.length % 10)),
        paymentMethod: units.length % 2 === 0 ? 'Pago Móvil' : 'QR de la unidad',
      });
    }
    floor += 1;
  }
  return units;
}

const ALL_UNITS = [...NAMED_UNITS, ...buildFillerUnits(48 - NAMED_UNITS.length)];

export const SEED_CONDO_UNITS: CondoUnit[] = ALL_UNITS.map((unit, i) => ({
  id: `condo-unit-${i + 1}`,
  accountId: ACCOUNT_ID,
  feeCents: FEE_CENTS,
  ...unit,
}));
