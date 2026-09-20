import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { selectActiveUser } from '../../state/selectors';
import { formatUSD, formatDate } from '../../lib/format';

/** Vista del lado comercio: cómo un comercio del marketplace ve sus ventas
 * BNPL — bruto, comisión que le cobra KORA, y neto que recibe de inmediato
 * (aunque el comprador esté pagando a plazos). Gateado a comercios afiliados
 * (Sprint 4 — gate empresarial): solo lista los comercios de los que el
 * usuario activo es dueño (`Merchant.ownerUserId`), no todo el catálogo. */
export function MerchantDashboard() {
  const activeUser = useKoraStore(selectActiveUser);
  const allMerchants = useKoraStore((s) => s.merchants);
  const users = useKoraStore((s) => s.users);
  const ownedMerchants = Object.values(allMerchants).filter((m) => m.ownerUserId === activeUser?.id);
  const [merchantId, setMerchantId] = useState(ownedMerchants[0]?.id ?? '');

  const orders = useKoraStore(
    useShallow((s) => Object.values(s.orders).filter((o) => o.merchantId === merchantId).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()))
  );
  const plans = useKoraStore((s) => s.installmentPlans);
  const products = useKoraStore((s) => s.products);

  const buyerName = (accountId: string) => Object.values(users).find((u) => u.primaryAccountId === accountId)?.name ?? 'Cliente';

  const rows = orders.map((order) => {
    const plan = order.installmentPlanId ? plans[order.installmentPlanId] : undefined;
    const grossCents = order.totalCents;
    const feeCents = plan?.merchantFeeCents ?? 0;
    const netCents = grossCents - feeCents;
    const itemNames = order.items.map((i) => products[i.productId]?.name).filter(Boolean).join(', ');
    return { order, plan, grossCents, feeCents, netCents, itemNames };
  });

  const totals = rows.reduce(
    (acc, r) => ({ gross: acc.gross + r.grossCents, fee: acc.fee + r.feeCents, net: acc.net + r.netCents }),
    { gross: 0, fee: 0, net: 0 }
  );

  return (
    <>
      {ownedMerchants.length > 1 && (
        <div className="in-group" style={{ maxWidth: 320 }}>
          <label className="in-label">TU COMERCIO</label>
          <select className="in-field" value={merchantId} onChange={(e) => setMerchantId(e.target.value)}>
            {ownedMerchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="condo-stats" style={{ marginBottom: 20 }}>
        <div className="cs">
          <b>{rows.length}</b>
          <span>Ventas</span>
        </div>
        <div className="cs">
          <b>{formatUSD(totals.gross)}</b>
          <span>Bruto</span>
        </div>
        <div className="cs">
          <b style={{ color: 'var(--amber)' }}>{formatUSD(totals.fee)}</b>
          <span>Comisión KORA</span>
        </div>
        <div className="cs">
          <b style={{ color: 'var(--green)' }}>{formatUSD(totals.net)}</b>
          <span>Neto recibido</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Este comercio todavía no tiene ventas registradas.
        </div>
      ) : (
        <div className="card">
          {rows.map(({ order, itemNames, grossCents, feeCents, netCents }) => (
            <div className="unit" key={order.id}>
              <div className="ui">{order.paymentMethod === 'bnpl' ? '▤' : '💵'}</div>
              <div className="ub">
                <div className="uid">{buyerName(order.accountId)}</div>
                <div className="uo">
                  {itemNames} · {formatDate(order.at)} ·{' '}
                  {order.paymentMethod === 'bnpl' ? 'KORA Cuotas' : order.paymentMethod === 'krt' ? 'Puntos' : 'Saldo'}
                </div>
              </div>
              <div className="ur">
                <div className="ua">{formatUSD(grossCents)} bruto</div>
                <div className="ud">
                  {feeCents > 0 ? `−${formatUSD(feeCents)} comisión · ` : ''}
                  <span style={{ color: 'var(--green)' }}>{formatUSD(netCents)} neto</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
