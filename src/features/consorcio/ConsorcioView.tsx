import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { selectActiveAccount } from '../../state/selectors';
import { condoService } from '../../services/condoService';
import { formatUSD } from '../../lib/format';

export function ConsorcioView() {
  const account = useKoraStore(selectActiveAccount);
  const showToast = useKoraStore((s) => s.showToast);
  const simulatedNowIso = useKoraStore((s) => s.simulatedNowIso);
  const units = useKoraStore(useShallow((s) => (account ? s.condoUnits.filter((u) => u.accountId === account.id) : [])));

  const todayKey = simulatedNowIso.slice(0, 10);
  const paidToday = units.filter((u) => u.status === 'pagado' && u.paidAt?.slice(0, 10) === todayKey);
  const pending = units.filter((u) => u.status === 'pendiente');
  const paidCount = units.filter((u) => u.status === 'pagado').length;
  const totalCents = units.reduce((sum, u) => sum + u.feeCents, 0);
  const collectedCents = units.filter((u) => u.status === 'pagado').reduce((sum, u) => sum + u.feeCents, 0);
  const collectedPct = units.length ? Math.round((paidCount / units.length) * 100) : 0;
  const feeCents = units[0]?.feeCents ?? 0;

  const handleMarkPaid = async (unitId: string) => {
    try {
      await condoService.markUnitPaid({ unitId });
      showToast('✅ Pago conciliado');
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    }
  };

  const handleLoadFees = async () => {
    if (!account) return;
    try {
      await condoService.loadMonthlyFees({ accountId: account.id, feeCents });
      showToast('✅ Cuotas cargadas — cada unidad ya tiene su QR de cobro');
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    }
  };

  return (
    <>
      <div className="condo-top">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: 2, color: 'var(--muted)', fontWeight: 800 }}>ADMINISTRAS</div>
            <div style={{ fontSize: 21, fontWeight: 850, marginTop: 5 }}>Res. Altamira · Torre A</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
              {units.length} unidades · cuota {formatUSD(feeCents)}
            </div>
          </div>
          <span className="pill p-violet">PERÍODO ACTUAL</span>
        </div>
        <div className="condo-stats">
          <div className="cs">
            <b style={{ color: 'var(--green)' }}>{collectedPct}%</b>
            <span>Cobrado</span>
          </div>
          <div className="cs">
            <b>{formatUSD(collectedCents)}</b>
            <span>Recaudado</span>
          </div>
          <div className="cs">
            <b style={{ color: 'var(--red)' }}>{pending.length}</b>
            <span>Pendientes</span>
          </div>
        </div>
        <div className="pb-wrap">
          <div className="pb-lab">
            Cobranza del período<span>{formatUSD(collectedCents)} / {formatUSD(totalCents)}</span>
          </div>
          <div className="pbar">
            <div className="pfill" style={{ width: `${collectedPct}%` }} />
          </div>
        </div>
      </div>

      <div className="grid2">
        <div>
          <div className="sec-h" style={{ marginTop: 0 }}>
            <h2>Pagos recibidos hoy</h2>
          </div>
          <div className="card">
            {paidToday.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Todavía no entró ningún pago hoy.</div>
            ) : (
              paidToday.map((u) => (
                <div className="unit" key={u.id}>
                  <div className="ui">🏠</div>
                  <div className="ub">
                    <div className="uid">{u.label}</div>
                    <div className="uo">
                      {u.ownerName} · {u.paymentMethod}
                    </div>
                  </div>
                  <div className="ur">
                    <div className="ua" style={{ color: 'var(--green)' }}>
                      {formatUSD(u.feeCents)} ✓
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <div className="sec-h" style={{ marginTop: 0 }}>
            <h2>Unidades pendientes</h2>
          </div>
          <div className="card">
            {pending.map((u) => (
              <div className="unit" key={u.id}>
                <div className="ui" style={{ background: 'rgba(214,69,80,.09)' }}>
                  ⚠️
                </div>
                <div className="ub">
                  <div className="uid">{u.label}</div>
                  <div className="uo">{u.ownerName}</div>
                </div>
                <div className="ur" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="ud" style={{ color: 'var(--red)' }}>
                    {formatUSD(u.feeCents)} pendiente
                  </div>
                  <button className="cbtn" onClick={() => handleMarkPaid(u.id)}>
                    Marcar pagado
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            className="btn full"
            style={{ marginTop: 12 }}
            disabled={pending.length === 0}
            onClick={() => showToast(`✅ Recordatorio enviado por WhatsApp a las ${pending.length} unidades pendientes`)}
          >
            Enviar recordatorio por WhatsApp
          </button>
        </div>
      </div>

      <div className="sec-h">
        <h2>Herramientas del administrador</h2>
      </div>
      <div className="grid3">
        <div className="earn-card" style={{ cursor: 'pointer' }} onClick={handleLoadFees}>
          <div className="ei" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
            📄
          </div>
          <div>
            <b>Cargar cuotas del mes</b>
            <span>Abre un nuevo período — cada unidad vuelve a pendiente con su cuota y su QR de cobro.</span>
          </div>
        </div>
        <div className="earn-card" style={{ cursor: 'pointer' }} onClick={() => showToast('✅ Reparto automático configurado')}>
          <div className="ei" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
            ⑂
          </div>
          <div>
            <b>Reparto automático</b>
            <span>Define cómo se reparte lo recaudado: proveedores, fondo de reserva y administración.</span>
          </div>
        </div>
        <div className="earn-card" style={{ cursor: 'pointer' }} onClick={() => showToast('✅ Reporte mensual generado — revisa tu correo')}>
          <div className="ei" style={{ background: 'rgba(31,169,113,.1)' }}>
            📊
          </div>
          <div>
            <b>Reporte mensual</b>
            <span>Descarga el estado de cobranza con el detalle por unidad, listo para la junta.</span>
          </div>
        </div>
      </div>
    </>
  );
}
