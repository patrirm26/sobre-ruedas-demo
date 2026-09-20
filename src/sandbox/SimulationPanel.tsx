import { useState } from 'react';
import { useKoraStore } from '../state/store';
import { selectActiveUser } from '../state/selectors';
import { bnplService } from '../services/bnplService';
import { factoringService } from '../services/factoringService';
import { investmentFundService } from '../services/investmentFundService';
import { fetchOfficialBcvRate } from '../services/bcvRateService';
import { formatDate } from '../lib/format';
import { useEscapeToClose } from '../lib/useEscapeToClose';
import type { ForcedBnplDecision } from '../state/slices/simulationSlice';

const TIME_STEPS = [1, 7, 30];
const RATE_BUMPS_PCT = [-10, -5, 5, 10];

const DECISION_OPTIONS: { value: ForcedBnplDecision; label: string }[] = [
  { value: 'auto', label: 'Automático (score real)' },
  { value: 'approved', label: 'Forzar aprobación' },
  { value: 'rejected', label: 'Forzar rechazo' },
];

/** Drawer global de controles de sandbox (Fase 6): reloj simulado, tasa BCV,
 * underwriting forzado para demos dirigidas, cambio rápido de perfil, y
 * reset a los datos semilla. Se abre desde `DemoBanner`. */
export function SimulationPanel() {
  const open = useKoraStore((s) => s.simulationPanelOpen);
  const close = useKoraStore((s) => s.closeSimulationPanel);
  const simulatedNowIso = useKoraStore((s) => s.simulatedNowIso);
  const advanceTimeDays = useKoraStore((s) => s.advanceTimeDays);
  const showToast = useKoraStore((s) => s.showToast);
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  const bcvRateSource = useKoraStore((s) => s.bcvRateSource);
  const setBcvRate = useKoraStore((s) => s.setBcvRate);
  const setLiveBcvRate = useKoraStore((s) => s.setLiveBcvRate);
  const markBcvRateFallback = useKoraStore((s) => s.markBcvRateFallback);
  const forcedBnplDecision = useKoraStore((s) => s.forcedBnplDecision);
  const setForcedBnplDecision = useKoraStore((s) => s.setForcedBnplDecision);
  const users = useKoraStore((s) => s.users);
  const activeUser = useKoraStore(selectActiveUser);
  const setActiveUser = useKoraStore((s) => s.setActiveUser);

  const [busy, setBusy] = useState(false);
  const [syncingRate, setSyncingRate] = useState(false);

  useEscapeToClose(close);

  if (!open) return null;

  const advance = async (days: number) => {
    setBusy(true);
    try {
      advanceTimeDays(days);
      await bnplService.recalculateStatuses();
      await factoringService.recalculateCollections();
      await investmentFundService.recalculateYields();
      showToast(`🕐 Reloj del sandbox adelantado ${days} día${days === 1 ? '' : 's'}`);
    } finally {
      setBusy(false);
    }
  };

  const bumpRate = (pct: number) => {
    const next = Math.round(bcvRate * (1 + pct / 100) * 100) / 100;
    setBcvRate(next);
    showToast(`💱 Tasa BCV fijada manualmente en ${next.toFixed(2)} Bs/$`);
  };

  const syncOfficialRate = async () => {
    setSyncingRate(true);
    try {
      const { rate, asOf } = await fetchOfficialBcvRate();
      setLiveBcvRate(rate, asOf);
      showToast('✅ Tasa BCV sincronizada con la fuente oficial');
    } catch {
      markBcvRateFallback();
      showToast('⚠️ No se pudo consultar la tasa oficial ahora mismo');
    } finally {
      setSyncingRate(false);
    }
  };

  const resetToSeed = () => {
    const ok = window.confirm(
      'Esto borra todo el progreso de la demo (compras, pagos, cuotas, movimientos de puntos) y vuelve a los 3 perfiles semilla originales. ¿Continuar?'
    );
    if (!ok) return;
    localStorage.removeItem('kora-sandbox-store');
    window.location.reload();
  };

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="sim-drawer" role="dialog" aria-modal="true">
        <div className="m-head">
          <div>
            <h3>🧪 Panel de simulación</h3>
            <p>Controles de sandbox — no afectan a ningún proveedor real.</p>
          </div>
          <button className="m-x" onClick={close} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="sim-section">
          <h4>Reloj del sandbox</h4>
          <p className="sim-hint">Ahora: {formatDate(simulatedNowIso)}</p>
          <div className="sim-row">
            {TIME_STEPS.map((days) => (
              <button key={days} className="btn ghost" disabled={busy} onClick={() => advance(days)}>
                +{days} día{days === 1 ? '' : 's'}
              </button>
            ))}
          </div>
        </div>

        <div className="sim-section">
          <h4>Tasa BCV</h4>
          <p className="sim-hint">
            Actual: <b>{bcvRate.toFixed(2).replace('.', ',')} Bs/$</b> ·{' '}
            {bcvRateSource === 'live' ? 'oficial en vivo' : bcvRateSource === 'manual' ? 'fijada manualmente' : 'sin conexión (respaldo)'}
          </p>
          <div className="sim-row">
            {RATE_BUMPS_PCT.map((pct) => (
              <button key={pct} className="btn ghost" onClick={() => bumpRate(pct)}>
                {pct > 0 ? '+' : ''}
                {pct}%
              </button>
            ))}
            <button className="btn ghost" disabled={syncingRate} onClick={syncOfficialRate}>
              {syncingRate ? 'Sincronizando...' : '↻ Usar oficial'}
            </button>
          </div>
        </div>

        <div className="sim-section">
          <h4>Underwriting de KORA Cuotas</h4>
          <p className="sim-hint">Fuerza el resultado de la próxima solicitud, sin tocar el score ni el cupo reales.</p>
          <div className="sim-row">
            {DECISION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`btn ghost ${forcedBnplDecision === opt.value ? 'sim-active' : ''}`}
                onClick={() => setForcedBnplDecision(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sim-section">
          <h4>Perfil activo</h4>
          <p className="sim-hint">Cambia de perfil sin cerrar sesión, para mostrar los 3 historiales distintos.</p>
          <div className="sim-row">
            {Object.values(users).map((u) => (
              <button
                key={u.id}
                className={`btn ghost ${activeUser?.id === u.id ? 'sim-active' : ''}`}
                onClick={() => setActiveUser(u.id)}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>

        <div className="sim-section">
          <h4>Reiniciar demo</h4>
          <p className="sim-hint">Borra todo el progreso y vuelve a los datos semilla de los 3 perfiles.</p>
          <button className="logout-btn" onClick={resetToSeed}>
            Reiniciar a datos semilla
          </button>
        </div>
      </div>
    </div>
  );
}
