import { useKoraStore } from '../state/store';

/** Aviso discreto y permanente de que el entorno es un sandbox de demostración
 * (sección 6 del brief de producto) — vive sobre el Topbar, dentro de `.main`,
 * para no invadir la sidebar con la identidad de marca. */
export function DemoBanner() {
  const openSimulationPanel = useKoraStore((s) => s.openSimulationPanel);

  return (
    <div className="demo-banner">
      <span>🧪 Sandbox — datos de demostración, sin dinero real ni conexión a proveedores</span>
      <button className="demo-banner-btn" onClick={openSimulationPanel}>
        Panel de simulación
      </button>
    </div>
  );
}
