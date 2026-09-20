import { useKoraStore } from '../../state/store';
import { useEscapeToClose } from '../../lib/useEscapeToClose';
import { IconCopilot } from '../../components/icons';
import { CopilotView } from './CopilotView';

/** Entrada flotante persistente del Copilot (Sprint 1 — navegación): ya no
 * es un destino del nav, es una capa ambiental disponible sobre cualquier
 * vista. Mismo componente `CopilotView` de siempre, sin modificar — ahora
 * vive dentro de un drawer en vez de ocupar la pantalla completa. Mismo
 * patrón arquitectónico que `SimulationPanel` (flag propio en la store,
 * montado a nivel de shell en App.tsx). */
export function CopilotFab() {
  const open = useKoraStore((s) => s.copilotPanelOpen);
  const openPanel = useKoraStore((s) => s.openCopilotPanel);
  const closePanel = useKoraStore((s) => s.closeCopilotPanel);

  useEscapeToClose(closePanel);

  return (
    <>
      <button className="copilot-fab" onClick={openPanel} aria-label="Abrir Copilot">
        <IconCopilot width={24} height={24} />
      </button>

      {open && (
        <div className="overlay show" onClick={(e) => e.target === e.currentTarget && closePanel()}>
          <div className="copilot-drawer" role="dialog" aria-modal="true">
            <div className="m-head">
              <div>
                <h3>KORA Copilot</h3>
              </div>
              <button className="m-x" onClick={closePanel} aria-label="Cerrar">
                ✕
              </button>
            </div>
            <CopilotView />
          </div>
        </div>
      )}
    </>
  );
}
