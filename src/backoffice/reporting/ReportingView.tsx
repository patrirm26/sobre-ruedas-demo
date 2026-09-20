import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { formatUSD, formatVES } from '../../lib/format';
import { downloadCsv } from '../../lib/csvExport';
import { recordAudit } from '../../state/slices/auditSlice';

/** Panel de solo lectura — agrega datos ya reales del store (sin servicio ni
 * dominio nuevo), generados por las acciones que ya se hicieron en la demo
 * de consumidor. No hay nada que "sembrar": si el operador entra antes de
 * que un consumidor haya operado, los totales están en cero de verdad. */
export function ReportingView() {
  const orders = useKoraStore(useShallow((s) => Object.values(s.orders)));
  const installmentPlans = useKoraStore(useShallow((s) => Object.values(s.installmentPlans)));
  const advanceRequests = useKoraStore(useShallow((s) => s.advanceRequests));
  const obligations = useKoraStore(useShallow((s) => s.obligations));
  const splitPayouts = useKoraStore(useShallow((s) => s.splitPayouts));
  const fundPositions = useKoraStore(useShallow((s) => s.fundPositions));
  const linkedBankAccounts = useKoraStore(useShallow((s) => s.linkedBankAccounts));
  const merchants = useKoraStore((s) => s.merchants);

  const gmvCents = orders.reduce((sum, o) => sum + o.totalCents, 0);
  const bnplPrincipalCents = installmentPlans.reduce((sum, p) => sum + p.principalCents, 0);
  const approvedAdvances = advanceRequests.filter((r) => r.approved);
  const advancedCents = approvedAdvances.reduce((sum, r) => sum + r.advancedNowCents, 0);
  const factoringFeeCents = approvedAdvances.reduce((sum, r) => sum + r.feeCents, 0);
  const recaudadoVesCents = obligations.filter((o) => o.paid).reduce((sum, o) => sum + o.amountCents, 0);
  const fundAumCents = fundPositions.reduce((sum, p) => sum + p.principalCents + p.accruedYieldCents, 0);
  const splitDistributedCents = splitPayouts.reduce((sum, p) => sum + p.totalCents, 0);

  const merchantRows = Object.values(merchants).map((m) => {
    const merchantOrders = orders.filter((o) => o.merchantId === m.id);
    return {
      merchant: m,
      count: merchantOrders.length,
      gmvCents: merchantOrders.reduce((sum, o) => sum + o.totalCents, 0),
    };
  });

  const handleExport = () => {
    const generatedAt = new Date().toLocaleString('es-VE');
    const rows: (string | number)[][] = [
      ['Reporte KORA', generatedAt],
      [],
      ['Resumen', ''],
      ['GMV Tienda', formatUSD(gmvCents)],
      ['Originado en KORA Cuotas', formatUSD(bnplPrincipalCents)],
      ['Anticipado por Factoring', formatUSD(advancedCents)],
      ['Recaudado — Pagos al Estado', formatVES(recaudadoVesCents)],
      ['AUM · Fondos de Inversión', formatUSD(fundAumCents)],
      ['Repartido — Split de Pagos', formatUSD(splitDistributedCents)],
      ['Cuentas bancarias vinculadas', linkedBankAccounts.length],
      ['Comisión KORA — Factoring', formatUSD(factoringFeeCents)],
      [],
      ['Ventas por comercio', '', '', ''],
      ['Comercio', 'Categoría', 'Órdenes', 'GMV'],
      ...merchantRows.map(({ merchant, count, gmvCents: merchantGmvCents }) => [
        merchant.name,
        merchant.category,
        count,
        formatUSD(merchantGmvCents),
      ]),
    ];
    const filename = `kora-reporte-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(filename, rows);
    recordAudit({
      action: 'reporting.export',
      targetType: 'report',
      targetId: 'daily-summary',
      detail: 'Exportó el reporte de Reportes a CSV',
    });
  };

  return (
    <>
      <div className="sec-h" style={{ marginTop: 0 }}>
        <h2>Volumen de la plataforma</h2>
        <button className="btn ghost" style={{ padding: '9px 16px', fontSize: 12.5 }} onClick={handleExport}>
          ⬇ Exportar CSV
        </button>
      </div>
      <div className="condo-stats" style={{ marginBottom: 20 }}>
        <div className="cs">
          <b>{formatUSD(gmvCents)}</b>
          <span>GMV Tienda</span>
        </div>
        <div className="cs">
          <b>{formatUSD(bnplPrincipalCents)}</b>
          <span>Originado en KORA Cuotas</span>
        </div>
        <div className="cs">
          <b style={{ color: 'var(--gold)' }}>{formatUSD(advancedCents)}</b>
          <span>Anticipado por Factoring</span>
        </div>
        <div className="cs">
          <b>{formatVES(recaudadoVesCents)}</b>
          <span>Recaudado — Pagos al Estado</span>
        </div>
      </div>

      <div className="sec-h">
        <h2>Fondeo y adopción</h2>
      </div>
      <div className="condo-stats" style={{ marginBottom: 20 }}>
        <div className="cs">
          <b style={{ color: 'var(--green)' }}>{formatUSD(fundAumCents)}</b>
          <span>AUM · Fondos de Inversión</span>
        </div>
        <div className="cs">
          <b style={{ color: 'var(--accent2)' }}>{formatUSD(splitDistributedCents)}</b>
          <span>Repartido — Split de Pagos</span>
        </div>
        <div className="cs">
          <b>{linkedBankAccounts.length}</b>
          <span>Cuentas bancarias vinculadas</span>
        </div>
        <div className="cs">
          <b>{formatUSD(factoringFeeCents)}</b>
          <span>Comisión KORA — Factoring</span>
        </div>
      </div>

      <div className="sec-h">
        <h2>Ventas por comercio</h2>
      </div>
      <div className="card">
        {merchantRows.map(({ merchant, count, gmvCents: merchantGmvCents }) => (
          <div className="unit" key={merchant.id}>
            <div className="ui">🏪</div>
            <div className="ub">
              <div className="uid">{merchant.name}</div>
              <div className="uo">
                {merchant.category} · {count} orden{count === 1 ? '' : 'es'}
              </div>
            </div>
            <div className="ur">
              <div className="ua">{formatUSD(merchantGmvCents)}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
