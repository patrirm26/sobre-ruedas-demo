import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { selectActiveAccount } from '../../state/selectors';
import { vehicleInsuranceService } from '../../services/vehicleInsuranceService';
import { formatUSD, formatDate } from '../../lib/format';
import type { VehiclePolicy, VehiclePolicyStatus } from '../../domain/vehicleInsurance';

const STATUS_PILL: Record<VehiclePolicyStatus, { label: string; cls: string }> = {
  activa: { label: 'Activa', cls: 'p-green' },
  vencida: { label: 'Vencida', cls: 'p-amber' },
  cancelada: { label: 'Cancelada', cls: 'p-red' },
};

export function SegurosView() {
  const account = useKoraStore(selectActiveAccount);
  const plans = useKoraStore(useShallow((s) => s.vehicleInsurancePlans));
  const policies = useKoraStore(
    useShallow((s) => (account ? s.vehiclePolicies.filter((p) => p.accountId === account.id) : []))
  );
  const showToast = useKoraStore((s) => s.showToast);

  const [plate, setPlate] = useState('');
  const [vehicleLabel, setVehicleLabel] = useState('');
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);

  if (!account) return null;

  const rcvPlan = plans.find((p) => p.coverageType === 'rcv');
  const ampliadaPlan = plans.find((p) => p.coverageType === 'ampliada');
  const payperusePlan = plans.find((p) => p.coverageType === 'payperuse');
  const plateReady = plate.trim().length >= 5;

  const activePayPerUse = policies.find((p) => p.planId === payperusePlan?.id && p.status === 'activa' && p.activeToday);

  const handleIssue = async (planId: string, planName: string) => {
    setBusyPlanId(planId);
    try {
      await vehicleInsuranceService.issueTermPolicy({ accountId: account.id, planId, vehiclePlate: plate, vehicleLabel });
      showToast(`✅ ${planName} emitido para ${plate.toUpperCase()}`);
      setPlate('');
      setVehicleLabel('');
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setBusyPlanId(null);
    }
  };

  const handleTogglePayPerUse = async (active: boolean, targetPlate?: string, targetLabel?: string) => {
    if (!payperusePlan) return;
    const usePlate = targetPlate ?? plate;
    setBusyPlanId(payperusePlan.id);
    try {
      await vehicleInsuranceService.togglePayPerUse({
        accountId: account.id,
        planId: payperusePlan.id,
        vehiclePlate: usePlate,
        vehicleLabel: targetLabel ?? vehicleLabel,
        active,
      });
      showToast(active ? `✅ Microseguro activado para ${usePlate.toUpperCase()} — hoy` : `Microseguro desactivado para ${usePlate.toUpperCase()}`);
      if (active && !targetPlate) {
        setPlate('');
        setVehicleLabel('');
      }
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setBusyPlanId(null);
    }
  };

  const handleCancel = async (policy: VehiclePolicy) => {
    try {
      await vehicleInsuranceService.cancelPolicy(policy.id);
      showToast(`Póliza de ${policy.vehiclePlate} cancelada`);
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    }
  };

  return (
    <>
      <div className="card" style={{ padding: 16, marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🚗 Datos del vehículo</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div className="in-group" style={{ flex: '1 1 140px', marginBottom: 0 }}>
            <label className="in-label">PLACA</label>
            <input
              className="in-field"
              placeholder="AC123BC"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              maxLength={8}
            />
          </div>
          <div className="in-group" style={{ flex: '2 1 220px', marginBottom: 0 }}>
            <label className="in-label">VEHÍCULO (OPCIONAL)</label>
            <input
              className="in-field"
              placeholder="Toyota Corolla 2018"
              value={vehicleLabel}
              onChange={(e) => setVehicleLabel(e.target.value)}
            />
          </div>
        </div>
        {!plateReady && (
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
            Ingresa la placa para poder emitir cualquiera de las coberturas de abajo — un solo clic, sin papeleo.
          </div>
        )}
      </div>

      <div className="sec-h" style={{ marginTop: 0 }}>
        <h2>Emisión en un clic</h2>
      </div>
      <div className="card">
        {rcvPlan && (
          <div className="unit">
            <div className="ui">🛡</div>
            <div className="ub">
              <div className="uid">{rcvPlan.name} · obligatorio</div>
              <div className="uo">
                Cobertura {formatUSD(rcvPlan.coverageCents)} · {rcvPlan.provider}
              </div>
            </div>
            <div className="ur" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="ua">{formatUSD(rcvPlan.priceCents)}/año</div>
              <button
                className="btn"
                disabled={!plateReady || busyPlanId === rcvPlan.id}
                onClick={() => handleIssue(rcvPlan.id, rcvPlan.name)}
              >
                {busyPlanId === rcvPlan.id ? 'Emitiendo...' : 'Emitir RCV'}
              </button>
            </div>
          </div>
        )}
        {ampliadaPlan && (
          <div className="unit">
            <div className="ui">🛡</div>
            <div className="ub">
              <div className="uid">{ampliadaPlan.name}</div>
              <div className="uo">
                Cobertura {formatUSD(ampliadaPlan.coverageCents)} · daños propios, robo e incendio
              </div>
            </div>
            <div className="ur" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="ua">{formatUSD(ampliadaPlan.priceCents)}/año</div>
              <button
                className="cbtn"
                disabled={!plateReady || busyPlanId === ampliadaPlan.id}
                onClick={() => handleIssue(ampliadaPlan.id, ampliadaPlan.name)}
              >
                {busyPlanId === ampliadaPlan.id ? 'Emitiendo...' : 'Contratar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {payperusePlan && (
        <>
          <div className="sec-h">
            <h2>Microseguro pay-per-use</h2>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 12 }}>
              Actívalo solo los días que usas el carro — {formatUSD(payperusePlan.priceCents)}/día, cobertura hasta{' '}
              {formatUSD(payperusePlan.coverageCents)}. Se cobra al activar, se apaga sin costo.
            </div>
            {activePayPerUse ? (
              <div className="unit">
                <div className="ui">🟢</div>
                <div className="ub">
                  <div className="uid">{activePayPerUse.vehicleLabel} · {activePayPerUse.vehiclePlate}</div>
                  <div className="uo">
                    Activo hoy · {activePayPerUse.daysActive ?? 1} día{(activePayPerUse.daysActive ?? 1) > 1 ? 's' : ''} en total ·{' '}
                    {formatUSD(activePayPerUse.premiumCents)} acumulado
                  </div>
                </div>
                <div className="ur">
                  <button
                    className="cbtn"
                    disabled={busyPlanId === payperusePlan.id}
                    onClick={() => handleTogglePayPerUse(false, activePayPerUse.vehiclePlate, activePayPerUse.vehicleLabel)}
                  >
                    Desactivar
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn full"
                disabled={!plateReady || busyPlanId === payperusePlan.id}
                onClick={() => handleTogglePayPerUse(true)}
              >
                {busyPlanId === payperusePlan.id ? 'Activando...' : `Activar hoy — ${formatUSD(payperusePlan.priceCents)}`}
              </button>
            )}
          </div>
        </>
      )}

      <div className="sec-h">
        <h2>Mis pólizas</h2>
      </div>
      {policies.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Todavía no tienes seguros activos. Emite tu RCV arriba para empezar.
        </div>
      ) : (
        <div className="card">
          {policies.map((policy) => {
            const plan = plans.find((p) => p.id === policy.planId);
            const status = STATUS_PILL[policy.status];
            return (
              <div className="unit" key={policy.id}>
                <div className="ui">🛡</div>
                <div className="ub">
                  <div className="uid">
                    {policy.vehicleLabel} · {policy.vehiclePlate}
                  </div>
                  <div className="uo">
                    {plan?.name ?? policy.coverageType} ·{' '}
                    {policy.expiresAt
                      ? `vence ${formatDate(policy.expiresAt)}`
                      : `${policy.daysActive ?? 0} día${(policy.daysActive ?? 0) === 1 ? '' : 's'} activado`}
                  </div>
                </div>
                <div className="ur" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`pill ${status.cls}`}>{status.label}</span>
                  <div className="ua">{formatUSD(policy.premiumCents)}</div>
                  {policy.status === 'activa' && (
                    <button className="cbtn" onClick={() => handleCancel(policy)}>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
