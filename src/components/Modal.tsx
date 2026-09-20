import { useEffect } from 'react';
import { useKoraStore } from '../state/store';

/** Modal genérico de "esto llega en una fase siguiente" — Fase 2 es un port
 * visual; los flujos reales (PIN, ledger, transferencias, bandas de score,
 * etc.) se implementan cuando su lógica de negocio correspondiente exista. */
export function Modal() {
  const modal = useKoraStore((s) => s.placeholderModal);
  const close = useKoraStore((s) => s.closePlaceholder);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, close]);

  return (
    <div className={`overlay ${modal ? 'show' : ''}`} onClick={(e) => e.target === e.currentTarget && close()}>
      {modal && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="m-head">
            <div className="mi" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
              {modal.icon}
            </div>
            <div>
              <h3 id="modal-title">{modal.title}</h3>
            </div>
            <button className="m-x" onClick={close} aria-label="Cerrar">
              ✕
            </button>
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6 }}>{modal.body}</p>
        </div>
      )}
    </div>
  );
}
