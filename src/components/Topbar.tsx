import { useKoraStore } from '../state/store';
import { selectActiveUser, selectKrtTotalCents } from '../state/selectors';
import { formatKRT, formatDate } from '../lib/format';
import { VIEW_META } from './viewMeta';
import { IconLogout, IconMoon, IconSun } from './icons';

export function Topbar() {
  const activeView = useKoraStore((s) => s.activeView);
  const setActiveView = useKoraStore((s) => s.setActiveView);
  const theme = useKoraStore((s) => s.theme);
  const toggleTheme = useKoraStore((s) => s.toggleTheme);
  const logout = useKoraStore((s) => s.logout);
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  const bcvRateSource = useKoraStore((s) => s.bcvRateSource);
  const bcvRateAsOf = useKoraStore((s) => s.bcvRateAsOf);
  const activeUser = useKoraStore(selectActiveUser);
  const krtTotalCents = useKoraStore(selectKrtTotalCents);

  const meta = VIEW_META[activeView];
  const title = activeView === 'home' && activeUser ? `Hola, ${activeUser.name.split(' ')[0]}` : meta.title;
  const initial = activeUser?.name.charAt(0).toUpperCase() ?? '?';

  const rateTitle =
    bcvRateSource === 'live'
      ? 'Tasa oficial BCV sincronizada en vivo'
      : bcvRateSource === 'manual'
        ? 'Tasa fijada manualmente desde el panel de simulación'
        : 'Sin conexión a la fuente oficial — mostrando la última tasa conocida';

  return (
    <div className="topbar">
      <div className="tb-title">
        <h1>{title}</h1>
        <p>{meta.subtitle}</p>
      </div>
      <div className="tb-right">
        <div className="rate-chip" title={rateTitle}>
          BCV <b>{bcvRate.toFixed(2).replace('.', ',')}</b> Bs/$
          {bcvRateAsOf && (
            <>
              <span style={{ opacity: 0.4 }}> · </span>
              {formatDate(bcvRateAsOf)}
            </>
          )}
          {bcvRateSource === 'fallback' && <span style={{ color: 'var(--amber)' }}> ⚠</span>}
        </div>
        <button className="krt-chip" onClick={() => setActiveView('tokens')}>
          <span className="krt-coin">K</span>
          <span>{formatKRT(krtTotalCents)}</span>
        </button>
        <button className="tb-icon" onClick={toggleTheme} title="Cambiar tema" aria-label="Cambiar tema">
          {theme === 'dark' ? <IconMoon /> : <IconSun />}
        </button>
        <button className="tb-icon tb-avatar" onClick={() => setActiveView('perfil')} title="Mi perfil" aria-label="Mi perfil">
          {initial}
        </button>
        <button className="tb-icon" onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión">
          <IconLogout />
        </button>
      </div>
    </div>
  );
}
