import { useState } from 'react';
import { useKoraStore } from '../state/store';
import { selectActiveUser } from '../state/selectors';
import type { ViewId } from '../state/slices/uiSlice';
import { MOBILE_NAV_ITEMS, NAV_SECTIONS } from './navConfig';
import { useEscapeToClose } from '../lib/useEscapeToClose';
import { IconPlus, IconMenu, IconCollect, IconPay, IconCredit, IconCopilot } from './icons';

type SheetKind = 'actions' | 'menu' | null;

// Recortado a Pagar/Cobrar (pago móvil y QR) — Remesas y Pagos al Estado
// siguen alcanzables desde el sheet de "Menú" (sección MOVER DINERO). Copilot
// vive acá también (no en este array — abre el drawer, no una vista) porque
// el FAB flotante propio (CopilotFab.tsx) se oculta en mobile: su posición
// fija chocaba con contenido de la página en pantallas chicas (ej. tapaba
// "Nivel X de 6" en la tarjeta BNPL de Home apenas se abría).
const QUICK_ACTIONS: { view: ViewId; label: string; icon: typeof IconCollect; color: string }[] = [
  { view: 'cobrar', label: 'Cobrar', icon: IconCollect, color: 'var(--green)' },
  { view: 'pagar', label: 'Pagar', icon: IconPay, color: 'var(--accent2)' },
];

export function BottomNav() {
  const [sheet, setSheet] = useState<SheetKind>(null);
  const activeView = useKoraStore((s) => s.activeView);
  const setActiveView = useKoraStore((s) => s.setActiveView);
  const openCopilotPanel = useKoraStore((s) => s.openCopilotPanel);
  const activeUser = useKoraStore(selectActiveUser);

  const goTo = (view: ViewId) => {
    setActiveView(view);
    setSheet(null);
  };

  useEscapeToClose(() => setSheet(null));

  return (
    <>
      <nav className="mobilenav">
        {MOBILE_NAV_ITEMS.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`mnav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => goTo(item.id)}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button className="mnav-fab" onClick={() => setSheet('actions')} aria-label="Acciones rápidas">
          <IconPlus />
        </button>
        <button
          className={`mnav-item ${activeView === 'creditos' ? 'active' : ''}`}
          onClick={() => goTo('creditos')}
        >
          <IconCredit />
          <span>Crédito</span>
        </button>
        <button className="mnav-item" onClick={() => setSheet('menu')}>
          <IconMenu />
          <span>Menú</span>
        </button>
      </nav>

      <div
        className={`msheet-overlay ${sheet === 'actions' ? 'show' : ''}`}
        onClick={(e) => e.target === e.currentTarget && setSheet(null)}
      >
        <div className="msheet">
          <div className="msheet-handle" />
          <h3 className="msheet-title">¿Qué quieres hacer?</h3>
          <div className="msheet-grid">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button key={action.view} onClick={() => goTo(action.view)}>
                  <div className="msg-ic" style={{ background: 'var(--surface3)', color: action.color }}>
                    <Icon />
                  </div>
                  <span>{action.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => {
                openCopilotPanel();
                setSheet(null);
              }}
            >
              <div className="msg-ic" style={{ background: 'var(--surface3)', color: 'var(--accent)' }}>
                <IconCopilot />
              </div>
              <span>Copilot</span>
            </button>
          </div>
        </div>
      </div>

      <div
        className={`msheet-overlay ${sheet === 'menu' ? 'show' : ''}`}
        onClick={(e) => e.target === e.currentTarget && setSheet(null)}
      >
        <div className="msheet">
          <div className="msheet-handle" />
          <h3 className="msheet-title">Menú</h3>
          <div className="mmenu-list">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                <div className="mmenu-sec">{section.title}</div>
                {section.items
                  .filter((item) => !item.requiresAccountType || item.requiresAccountType === activeUser?.accountType)
                  .map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      className={`mmenu-item ${activeView === item.id ? 'active' : ''}`}
                      onClick={() => goTo(item.id)}
                    >
                      <Icon />
                      <span>{item.label}</span>
                      {item.badge && <span className="nv">{item.badge}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
