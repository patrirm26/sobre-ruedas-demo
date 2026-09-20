import { useState, type ComponentType, type SVGProps } from 'react';
import { useKoraStore } from '../../state/store';
import { Logo } from '../../components/Logo';
import { PaymentEcosystemAnimation } from '../../components/PaymentEcosystemAnimation';
import { IconUser, IconBuilding, IconOperator, IconDoc, IconUpload, IconSelfie, IconEye, IconEyeOff } from '../../components/icons';
import type { AccountType } from '../../domain/user';
import { isRealBackendEnabled } from '../../services/env';
import { authService } from '../../services/authService';
import { fetchWhoAmI } from '../../lib/hydrateSession';
import { hydrateAccountData } from '../../lib/hydrateAccountData';

const DEMO_ROLE_ICON: Record<AccountType, ComponentType<SVGProps<SVGSVGElement>>> = {
  persona: IconUser,
  empresa: IconBuilding,
  operador: IconOperator,
};

type Screen = 'login' | 'forgot' | 'register';

const FEATURES = [
  { icon: '◉', title: 'Puntos', desc: 'Tu dinero respaldado 1:1 al BCV, con cashback automático.' },
  { icon: '◐', title: 'Créditos y Cuotas', desc: 'Crédito digital basado en tu comportamiento, sin buró ni papeleo.' },
  { icon: '🏛', title: 'Pagos al Estado', desc: 'Impuestos, trámites y tasas sin colas — con comprobante al instante.' },
];

export function AuthScreen() {
  const [screen, setScreen] = useState<Screen>('login');

  return (
    <div className="login-screen">
      <div className="login-left">
        <PaymentEcosystemAnimation />
        <div className="ll-glow" />
        <div className="ll-top">
          <Logo height={68} variant="dark" />
        </div>
        <div className="ll-center">
          <h1 className="ll-headline">El corazón de los pagos.</h1>
          <p className="ll-sub">Billetera multimoneda, puntos, créditos, remesas y pagos al Estado — todo en un solo lugar.</p>
          <div className="ll-rotator">
            {FEATURES.map((f) => (
              <div className="ll-feature" key={f.title} style={{ marginBottom: 10 }}>
                <span className="llf-ic">{f.icon}</span>
                <div>
                  <b>{f.title}</b>
                  <span>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="ll-foot">
          <div className="ll-stat">
            <b>Sandbox</b>
            <span>entorno de demostración</span>
          </div>
          <div className="ll-divider" />
          <div className="ll-stat">
            <b>7</b>
            <span>perfiles de prueba</span>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-mobile-logo">
            <Logo height={130} />
            <p>El corazón de los pagos.</p>
          </div>
          {screen === 'login' && <LoginForm onForgot={() => setScreen('forgot')} onRegister={() => setScreen('register')} />}
          {screen === 'forgot' && <ForgotFlow onBack={() => setScreen('login')} />}
          {screen === 'register' && <RegisterFlow onBack={() => setScreen('login')} />}
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onForgot, onRegister }: { onForgot: () => void; onRegister: () => void }) {
  const [acctType, setAcctType] = useState<'persona' | 'empresa'>('persona');
  const [showDemoRoles, setShowDemoRoles] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberUser, setRememberUser] = useState(false);
  const users = useKoraStore((s) => s.users);
  const setActiveUser = useKoraStore((s) => s.setActiveUser);
  const login = useKoraStore((s) => s.login);
  const hydrateRealUser = useKoraStore((s) => s.hydrateRealUser);
  const hydrateTransactions = useKoraStore((s) => s.hydrateTransactions);
  const hydrateInstallmentPlans = useKoraStore((s) => s.hydrateInstallmentPlans);
  const setKrtBalances = useKoraStore((s) => s.setKrtBalances);
  const hydrateKrtLedger = useKoraStore((s) => s.hydrateKrtLedger);
  const hydrateOrders = useKoraStore((s) => s.hydrateOrders);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // isRealBackendEnabled(): login real contra Supabase Auth. No hay perfiles de
  // demo en este modo — son datos del sandbox, no existen en el backend
  // real. El resto de este componente (debajo) es el flujo sandbox de
  // siempre, sin cambios.
  if (isRealBackendEnabled()) {
    const handleSubmit = async () => {
      setSubmitting(true);
      setErrorMsg(null);
      try {
        await authService.signIn({ email, password });
        const whoami = await fetchWhoAmI();
        if (!whoami.account) throw new Error('Tu registro no se completó — contacta a soporte.');
        hydrateRealUser(whoami.user, whoami.account, whoami.scoreSnapshot);
        // Hidratación de datos propios (Sprint 10) — antes de login() para
        // que la app nunca muestre un frame con los datos semilla de María.
        const accountData = await hydrateAccountData(whoami.account.id);
        hydrateTransactions(accountData.transactions);
        hydrateInstallmentPlans(accountData.installmentPlans);
        if (accountData.krtBalances) setKrtBalances(whoami.account.id, accountData.krtBalances);
        hydrateKrtLedger(accountData.krtLedger);
        hydrateOrders(accountData.orders);
        login();
      } catch (e) {
        setErrorMsg((e as Error).message);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <>
        <h2 className="lr-title">Bienvenido de vuelta</h2>
        <p className="lr-subtitle">Ingresa para acceder a tu cuenta</p>
        <div className="in-group">
          <label className="in-label">CORREO ELECTRÓNICO</label>
          <input className="in-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="in-group">
          <label className="in-label">CONTRASEÑA</label>
          <input className="in-field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {errorMsg && <div className="lg-otp-note">{errorMsg}</div>}
        <button className="btn full" disabled={submitting || !email || !password} onClick={handleSubmit}>
          {submitting ? 'Ingresando…' : 'Entrar a mi cuenta'}
        </button>
        <div className="login-foot">
          ¿No tienes cuenta? <a onClick={onRegister}>Regístrate gratis</a>
        </div>
      </>
    );
  }

  return (
    <>
      <h2 className="lr-title">Bienvenido de vuelta</h2>
      <p className="lr-subtitle">Ingresa para acceder a tu cuenta</p>

      <div className="acct-tabs">
        <button className={`acct-tab ${acctType === 'persona' ? 'active' : ''}`} onClick={() => setAcctType('persona')}>
          <IconUser width={15} height={15} /> Persona Natural
        </button>
        <button className={`acct-tab ${acctType === 'empresa' ? 'active' : ''}`} onClick={() => setAcctType('empresa')}>
          <IconBuilding width={15} height={15} /> Persona Jurídica
        </button>
      </div>
      {acctType === 'empresa' && (
        <div className="in-group">
          <label className="in-label">RIF</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="in-field" style={{ width: 72, flexShrink: 0 }} defaultValue="J">
              <option>J</option>
              <option>G</option>
              <option>V</option>
              <option>E</option>
            </select>
            <input className="in-field" style={{ flex: 1 }} placeholder="12345678-9" />
          </div>
        </div>
      )}
      <div className="in-group">
        <label className="in-label">USUARIO</label>
        <input className="in-field" defaultValue={acctType === 'empresa' ? 'comercial.elavila' : 'maria.fernandez'} />
      </div>
      <div className="in-group">
        <label className="in-label">CONTRASEÑA</label>
        <div style={{ position: 'relative' }}>
          <input
            className="in-field"
            type={showPassword ? 'text' : 'password'}
            defaultValue="••••••••"
            style={{ paddingRight: 44 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            style={{
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              padding: 8,
              color: 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            {showPassword ? <IconEyeOff width={18} height={18} /> : <IconEye width={18} height={18} />}
          </button>
        </div>
      </div>
      <div
        onClick={() => setRememberUser((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16, cursor: 'pointer' }}
      >
        <div className={`rg-check ${rememberUser ? 'on' : ''}`} />
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>Recordar usuario</span>
      </div>
      <button
        className="btn full"
        onClick={() => {
          // El formulario manual no valida credenciales de verdad (es
          // sandbox) — pero si elegís Persona Jurídica, sí tiene que
          // entrar al único comercio autorizado hoy en la demo (Comercial
          // El Ávila), no quedarse en María por default.
          if (acctType === 'empresa') setActiveUser('user-elavila');
          login();
        }}
      >
        Entrar a mi cuenta
      </button>
      <div className="login-foot">
        ¿Olvidaste tu contraseña? <a onClick={onForgot}>Recupérala aquí</a>
      </div>
      <div className="login-foot" style={{ marginTop: 8 }}>
        ¿No tienes cuenta? <a onClick={onRegister}>Regístrate gratis</a>
      </div>

      <div className="lr-demo-sep">
        <span>O ENTRA COMO PERFIL DE DEMO</span>
      </div>
      <button
        type="button"
        className={`demo-roles-toggle ${showDemoRoles ? 'open' : ''}`}
        onClick={() => setShowDemoRoles((v) => !v)}
        aria-expanded={showDemoRoles}
      >
        <span>Seleccionar perfil de demostración</span>
        <span className="drt-chevron">⌄</span>
      </button>
      {showDemoRoles && (
        <div className="demo-roles">
          {Object.values(users).map((u) => {
            const RoleIcon = DEMO_ROLE_ICON[u.accountType];
            return (
              <button
                key={u.id}
                className="demo-role"
                onClick={() => {
                  setActiveUser(u.id);
                  login();
                }}
              >
                <RoleIcon />
                {u.name}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

function ForgotFlow({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  return (
    <>
      <button className="lg-back" onClick={onBack}>
        ← Volver
      </button>
      <h2 className="lr-title">Recupera tu acceso</h2>
      <p className="lr-subtitle">Te enviaremos un código para verificar tu identidad</p>

      {step === 1 && (
        <>
          <div className="in-group">
            <label className="in-label">TELÉFONO REGISTRADO</label>
            <input className="in-field" defaultValue="0412-555 8821" />
          </div>
          <button className="btn full" onClick={() => setStep(2)}>
            Enviar código de verificación
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="lg-otp-note">
            Ingresa el código de 6 dígitos que enviamos por SMS a <b>tu teléfono</b>
          </div>
          <div className="otp-row">
            {otp.map((digit, i) => (
              <input
                key={i}
                className={`otp-box ${digit ? 'filled' : ''}`}
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const next = [...otp];
                  next[i] = e.target.value.replace(/\D/g, '').slice(-1);
                  setOtp(next);
                }}
              />
            ))}
          </div>
          <button className="btn full" onClick={() => setStep(3)}>
            Verificar código
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <div className="in-group">
            <label className="in-label">NUEVO PIN (6 DÍGITOS)</label>
            <input className="in-field" type="password" maxLength={6} placeholder="••••••" style={{ letterSpacing: 6, fontSize: 18 }} />
          </div>
          <div className="in-group">
            <label className="in-label">CONFIRMA TU NUEVO PIN</label>
            <input className="in-field" type="password" maxLength={6} placeholder="••••••" style={{ letterSpacing: 6, fontSize: 18 }} />
          </div>
          <button className="btn full" onClick={onBack}>
            Guardar nuevo PIN
          </button>
        </>
      )}
    </>
  );
}

function RegisterFlow({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<'persona' | 'empresa' | null>(null);
  const [uploaded, setUploaded] = useState({ doc: false, selfie: false });
  const [termsOk, setTermsOk] = useState(false);
  const login = useKoraStore((s) => s.login);
  const enterAfterSignup = useKoraStore((s) => s.enterAfterSignup);
  const hydrateRealUser = useKoraStore((s) => s.hydrateRealUser);
  const hydrateTransactions = useKoraStore((s) => s.hydrateTransactions);
  const hydrateInstallmentPlans = useKoraStore((s) => s.hydrateInstallmentPlans);
  const setKrtBalances = useKoraStore((s) => s.setKrtBalances);
  const hydrateKrtLedger = useKoraStore((s) => s.hydrateKrtLedger);
  const hydrateOrders = useKoraStore((s) => s.hydrateOrders);
  // Solo se usan con isRealBackendEnabled() — en sandbox el registro sigue
  // terminando en login() directo, sin backend real.
  const [name, setName] = useState('');
  const [rif, setRif] = useState('');
  const [representanteLegal, setRepresentanteLegal] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRealSignUp = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await authService.signUp({
        name,
        email,
        password,
        accountType: type ?? 'persona',
        businessProfile: type === 'empresa' ? { razonSocial: name, rif, representanteLegal } : undefined,
      });
      const whoami = await fetchWhoAmI();
      if (!whoami.account) throw new Error('No se pudo completar el registro.');
      hydrateRealUser(whoami.user, whoami.account, whoami.scoreSnapshot);
      // Un usuario recién registrado no tiene movimientos todavía — las 4
      // listas vuelven vacías, pero se hidrata igual por consistencia con
      // el login real (mismo criterio, ver handleSubmit más arriba).
      const accountData = await hydrateAccountData(whoami.account.id);
      hydrateTransactions(accountData.transactions);
      hydrateInstallmentPlans(accountData.installmentPlans);
      if (accountData.krtBalances) setKrtBalances(whoami.account.id, accountData.krtBalances);
      hydrateKrtLedger(accountData.krtLedger);
      hydrateOrders(accountData.orders);
      enterAfterSignup();
    } catch (e) {
      setErrorMsg((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const dotClass = (n: number) => (n < step ? 'done' : n === step ? 'active' : '');
  const lineClass = (n: number) => (n < step ? 'done' : '');

  return (
    <>
      <button className="lg-back" onClick={onBack}>
        ← Volver
      </button>
      <h2 className="lr-title">Crea tu cuenta</h2>
      <p className="lr-subtitle">En pocos pasos verificamos tu identidad y listo</p>

      <div className="rg-steps">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 4 ? 1 : undefined }}>
            <div className={`rg-dot ${dotClass(n)}`}>{n}</div>
            {n < 4 && <div className={`rg-line ${lineClass(n)}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <label className="in-label" style={{ marginBottom: 10, display: 'block' }}>
            ¿QUÉ TIPO DE CUENTA QUIERES?
          </label>
          <button
            className="rg-choice"
            onClick={() => {
              setType('persona');
              setStep(2);
            }}
          >
            <IconUser />
            <div>
              <b>Persona</b>
              <span>Para tu uso personal</span>
            </div>
            <span className="rg-arrow">→</span>
          </button>
          <button
            className="rg-choice"
            onClick={() => {
              setType('empresa');
              setStep(2);
            }}
          >
            <IconBuilding />
            <div>
              <b>Empresa</b>
              <span>Para tu negocio o comercio</span>
            </div>
            <span className="rg-arrow">→</span>
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="in-group">
            <label className="in-label">{type === 'empresa' ? 'RAZÓN SOCIAL' : 'NOMBRE COMPLETO'}</label>
            <input
              className="in-field"
              placeholder={type === 'empresa' ? 'Nombre de tu empresa' : 'Tu nombre y apellido'}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="in-group">
            <label className="in-label">{type === 'empresa' ? 'RIF' : 'CÉDULA'}</label>
            <input
              className="in-field"
              placeholder={type === 'empresa' ? 'J-12345678-9' : 'V-12.345.678'}
              value={rif}
              onChange={(e) => setRif(e.target.value)}
            />
          </div>
          {type === 'empresa' && (
            <div className="in-group">
              <label className="in-label">REPRESENTANTE LEGAL</label>
              <input
                className="in-field"
                placeholder="Nombre y apellido"
                value={representanteLegal}
                onChange={(e) => setRepresentanteLegal(e.target.value)}
              />
            </div>
          )}
          <div className="in-group">
            <label className="in-label">TELÉFONO</label>
            <input className="in-field" placeholder="0412-000 0000" />
          </div>
          <div className="in-group">
            <label className="in-label">CORREO ELECTRÓNICO</label>
            <input className="in-field" type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn full" onClick={() => setStep(3)}>
            Continuar
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="rg-kyc-box">
            <div className="rg-kyc-ic">
              <IconDoc />
            </div>
            <b>Verificación de identidad (KYC)</b>
            <span>Para cumplir con la normativa, necesitamos verificar que eres tú.</span>
          </div>
          <button
            className={`rg-upload ${uploaded.doc ? 'done' : ''}`}
            onClick={() => setUploaded((u) => ({ ...u, doc: true }))}
          >
            <IconUpload />
            <span>{uploaded.doc ? '✓ Documento subido' : 'Subir foto de tu cédula o RIF'}</span>
          </button>
          <button
            className={`rg-upload ${uploaded.selfie ? 'done' : ''}`}
            onClick={() => setUploaded((u) => ({ ...u, selfie: true }))}
          >
            <IconSelfie />
            <span>{uploaded.selfie ? '✓ Selfie tomada' : 'Tomarte una selfie'}</span>
          </button>
          <button className="btn full" style={{ marginTop: 6 }} disabled={!uploaded.doc || !uploaded.selfie} onClick={() => setStep(4)}>
            Continuar
          </button>
        </div>
      )}

      {step === 4 && (
        <div>
          {isRealBackendEnabled() ? (
            <div className="in-group">
              <label className="in-label">CREA TU CONTRASEÑA</label>
              <input className="in-field" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          ) : (
            <div className="in-group">
              <label className="in-label">CREA TU PIN DE ACCESO (6 DÍGITOS)</label>
              <input className="in-field" type="password" maxLength={6} placeholder="••••••" style={{ letterSpacing: 6, fontSize: 18 }} />
            </div>
          )}
          <div className="rg-terms" onClick={() => setTermsOk((v) => !v)}>
            <div className={`rg-check ${termsOk ? 'on' : ''}`} />
            <span>
              Acepto los <a onClick={(e) => e.stopPropagation()}>Términos</a> y la{' '}
              <a onClick={(e) => e.stopPropagation()}>Política de privacidad</a>
            </span>
          </div>
          {isRealBackendEnabled() && errorMsg && <div className="lg-otp-note">{errorMsg}</div>}
          <button
            className="btn full"
            disabled={!termsOk || (isRealBackendEnabled() && (!name || !email || !password || submitting))}
            onClick={isRealBackendEnabled() ? handleRealSignUp : login}
          >
            {isRealBackendEnabled() && submitting ? 'Creando cuenta…' : 'Crear mi cuenta'}
          </button>
        </div>
      )}
    </>
  );
}
