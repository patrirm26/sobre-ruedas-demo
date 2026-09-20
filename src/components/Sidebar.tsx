import { useKoraStore } from '../state/store';
import { selectActiveUser } from '../state/selectors';
import { Logo } from './Logo';
import { NAV_SECTIONS } from './navConfig';

export function Sidebar() {
  const activeView = useKoraStore((s) => s.activeView);
  const setActiveView = useKoraStore((s) => s.setActiveView);
  const activeUser = useKoraStore(selectActiveUser);

  const initial = activeUser?.name.charAt(0).toUpperCase() ?? '?';
  const statusLabel =
    activeUser && activeUser.kycLevel > 0 ? `● Verificado · Nivel ${activeUser.kycLevel}` : '○ Sin verificar';

  return (
    <aside className="sidebar">
      <div className="brand">
        <Logo height={78} />
      </div>

      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <div className="nav-sec">{section.title}</div>
          {section.items
            .filter((item) => !item.requiresAccountType || item.requiresAccountType === activeUser?.accountType)
            .map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => setActiveView(item.id)}
              >
                <span className="nico">
                  <Icon width={20} height={20} />
                </span>
                <span>{item.label}</span>
                {item.badge && <span className="nv">{item.badge}</span>}
              </button>
            );
          })}
        </div>
      ))}

      <div className="side-user">
        <div className="user-chip" onClick={() => setActiveView('perfil')}>
          <div className="uavatar">{initial}</div>
          <div>
            <b>{activeUser?.name ?? 'Invitado'}</b>
            <span>{statusLabel}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
