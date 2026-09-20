import { useKoraStore } from '../state/store';
import { selectActiveUser } from '../state/selectors';
import { useStaffRole } from '../state/staffRole';
import { Logo } from '../components/Logo';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import {
  IconGrid,
  IconSplit,
  IconFactoring,
  IconDoc,
  IconBuilding,
  IconToken,
  IconCard,
  IconInstallment,
  IconGauge,
  IconUsers,
  IconHistory,
  IconShield,
  IconLock,
  IconMoon,
  IconSun,
  IconLogout,
} from '../components/icons';
import { ROLE_SECTIONS, type BackofficeView } from '../state/slices/backofficeSlice';
import { BACKOFFICE_ROLE_LABEL } from '../domain/staff';
import { ReportingView } from './reporting/ReportingView';
import { SplitPayoutsView } from '../features/split/SplitPayoutsView';
import { FactoringView } from '../features/factoring/FactoringView';
import { ComplianceView } from './compliance/ComplianceView';
import { OnboardingView } from './onboarding/OnboardingView';
import { LoyaltyView } from './loyalty/LoyaltyView';
import { CardsView } from './cards/CardsView';
import { CreditRequestsView } from './creditRequests/CreditRequestsView';
import { ScoreCreditoBackofficeView } from './scoreCredito/ScoreCreditoBackofficeView';
import { InsuranceView } from './insurance/InsuranceView';
import { StaffView } from './staff/StaffView';
import { AuditView } from './audit/AuditView';
import { SecurityView } from './security/SecurityView';

const SECTIONS: { id: BackofficeView; label: string; subtitle: string; icon: typeof IconGrid }[] = [
  { id: 'reporting', label: 'Reportes', subtitle: 'Métricas agregadas de todo el ecosistema KORA', icon: IconGrid },
  { id: 'decisioning', label: 'Reparto de Pagos', subtitle: 'Reglas de negocio — reparto de pagos por rol', icon: IconSplit },
  { id: 'collections', label: 'Cobranzas', subtitle: 'Anticipo de facturas de comercios afiliados', icon: IconFactoring },
  { id: 'compliance', label: 'Cumplimiento', subtitle: 'Alertas AML y solicitudes de verificación KYC', icon: IconDoc },
  { id: 'onboarding', label: 'Altas', subtitle: 'Alta de comercios y aliados nuevos', icon: IconBuilding },
  { id: 'loyalty', label: 'Fidelización', subtitle: 'Tasas de cashback en puntos por canal', icon: IconToken },
  { id: 'cards', label: 'Tarjetas', subtitle: 'Tarjetas KORA emitidas — congelar y cancelar', icon: IconCard },
  { id: 'creditRequests', label: 'Solicitudes de crédito', subtitle: 'Aprobar o rechazar solicitudes de KORA Créditos', icon: IconInstallment },
  { id: 'scoreCredito', label: 'Score Crediticio', subtitle: 'Perfil de crédito del cliente: comportamiento, patrimonio y cuentas', icon: IconGauge },
  { id: 'insurance', label: 'Seguros', subtitle: 'Reclamar el seguro de desgravamen de planes en mora', icon: IconShield },
  { id: 'staff', label: 'Personal', subtitle: 'Roles y permisos del personal del banco', icon: IconUsers },
  { id: 'audit', label: 'Auditoría', subtitle: 'Quién hizo qué y cuándo en el Back Office', icon: IconHistory },
  { id: 'security', label: 'Seguridad', subtitle: 'Intentos fallidos y errores no manejados de las Edge Functions', icon: IconLock },
];

const VIEW_COMPONENTS: Record<BackofficeView, () => React.ReactElement> = {
  reporting: ReportingView,
  decisioning: SplitPayoutsView,
  collections: FactoringView,
  compliance: ComplianceView,
  onboarding: OnboardingView,
  loyalty: LoyaltyView,
  cards: CardsView,
  creditRequests: CreditRequestsView,
  scoreCredito: ScoreCreditoBackofficeView,
  insurance: InsuranceView,
  staff: StaffView,
  audit: AuditView,
  security: SecurityView,
};

/** Shell del Back Office — panel de operador separado de la billetera de
 * consumidor (bifurcado desde App.tsx por `accountType === 'operador'`).
 * Sin BottomNav: es un panel de escritorio, como el propio BeClever.
 * Las secciones del sidebar se filtran por el rol de staff del operador
 * activo (roles y permisos, ver ROLE_SECTIONS) — no todo el mundo ve todo. */
export function BackOfficeApp() {
  const activeUser = useKoraStore(selectActiveUser);
  const role = useStaffRole();
  const backofficeView = useKoraStore((s) => s.backofficeView);
  const setBackofficeView = useKoraStore((s) => s.setBackofficeView);
  const theme = useKoraStore((s) => s.theme);
  const toggleTheme = useKoraStore((s) => s.toggleTheme);
  const logout = useKoraStore((s) => s.logout);

  const allowedIds = role ? ROLE_SECTIONS[role] : [];
  const visibleSections = SECTIONS.filter((s) => allowedIds.includes(s.id));
  const activeSection = visibleSections.find((s) => s.id === backofficeView) ?? visibleSections[0];
  const ActiveView = activeSection ? VIEW_COMPONENTS[activeSection.id] : null;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <Logo height={78} />
        </div>
        <div className="nav-sec">BACK OFFICE</div>
        {visibleSections.map((section) => (
          <button
            key={section.id}
            className={`nav-item ${activeSection?.id === section.id ? 'active' : ''}`}
            onClick={() => setBackofficeView(section.id)}
          >
            <span className="nico">
              <section.icon width={20} height={20} />
            </span>
            <span>{section.label}</span>
          </button>
        ))}
        <div className="side-user">
          <div className="user-chip" style={{ cursor: 'default' }}>
            <div className="uavatar">{activeUser?.name.charAt(0).toUpperCase() ?? '?'}</div>
            <div>
              <b>{activeUser?.name ?? 'Operador'}</b>
              <span>● {role ? BACKOFFICE_ROLE_LABEL[role] : 'Panel de operador'}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div className="tb-title">
            <h1>{activeSection?.label ?? 'Back Office'}</h1>
            <p>{activeSection?.subtitle ?? 'Resolviendo tu rol de personal…'}</p>
          </div>
          <div className="tb-right">
            <button className="tb-icon" onClick={toggleTheme} title="Cambiar tema" aria-label="Cambiar tema">
              {theme === 'dark' ? <IconMoon /> : <IconSun />}
            </button>
            <button className="tb-icon" onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión">
              <IconLogout />
            </button>
          </div>
        </div>
        <div className="content">
          <div className="view show">{ActiveView && <ActiveView />}</div>
        </div>
      </div>

      <Modal />
      <Toast />
    </div>
  );
}
