import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { selectActiveAccount, selectActiveScoreSnapshot, selectActiveUser, selectKrtTotalCents } from '../../state/selectors';
import { formatUSD, formatVES, formatKRT, formatDate } from '../../lib/format';
import { useComingSoon } from '../../lib/comingSoon';
import { KYC_LIMITS } from '../../services/kycLimits';
import { complianceService } from '../../services/complianceService';
import { BnplTierCard } from '../../components/BnplTierCard';
import type { KycLevel } from '../../domain/user';

function Toggle({ defaultOn, onChange }: { defaultOn: boolean; onChange: () => void }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      className={`sw ${on ? 'on' : ''}`}
      onClick={() => {
        setOn((v) => !v);
        onChange();
      }}
    />
  );
}

export function PerfilView() {
  const activeUser = useKoraStore(selectActiveUser);
  const account = useKoraStore(selectActiveAccount);
  const score = useKoraStore(selectActiveScoreSnapshot);
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  const bs = (usdCents: number) => formatVES(Math.round(usdCents * bcvRate));
  const krtTotalCents = useKoraStore(selectKrtTotalCents);
  const logout = useKoraStore((s) => s.logout);
  const setActiveView = useKoraStore((s) => s.setActiveView);
  const activePlansCount = useKoraStore(
    useShallow((s) =>
      account ? Object.values(s.installmentPlans).filter((p) => p.accountId === account.id && p.status !== 'pagado').length : 0
    )
  );
  const comingSoon = useComingSoon();
  const showToast = useKoraStore((s) => s.showToast);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const hasPendingVerification = useKoraStore(
    useShallow((s) => (activeUser ? s.verificationRequests.some((r) => r.userId === activeUser.id && r.status === 'pendiente') : false))
  );
  const card = useKoraStore(
    useShallow((s) => (account ? s.cards.find((c) => c.accountId === account.id && c.status !== 'cancelada') : undefined))
  );

  if (!activeUser || !account || !score) return null;

  const handleRequestVerification = async () => {
    setRequestingVerification(true);
    try {
      await complianceService.requestVerification({ userId: activeUser.id, requestedLevel: (activeUser.kycLevel + 1) as KycLevel });
      showToast('✅ Solicitud enviada — un operador la va a revisar');
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setRequestingVerification(false);
    }
  };

  const limits = KYC_LIMITS[activeUser.kycLevel];
  const kycPct = (activeUser.kycLevel / 3) * 100;
  const initial = activeUser.name.charAt(0).toUpperCase();
  const alias = `@${activeUser.name.split(' ')[0].toLowerCase()}.kora`;

  return (
    <>
      <div className="profile-head">
        <div className="profile-avatar">{initial}</div>
        <div style={{ flex: 1 }}>
          <h2>{activeUser.name}</h2>
          <div className="ph-sub">
            {activeUser.accountType === 'empresa' ? 'Cuenta empresa' : 'Cuenta personal'} · miembro desde{' '}
            {formatDate(activeUser.createdAt)}
          </div>
        </div>
        <span className="pill p-green">
          ● {activeUser.kycLevel > 0 ? 'VERIFICADO' : 'SIN VERIFICAR'} · NIVEL {activeUser.kycLevel}
        </span>
      </div>

      <div className="grid2">
        <div>
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>Mis datos</h3>
            <div className="prow">
              <span>Nombre</span>
              <b>{activeUser.name}</b>
            </div>
            <div className="prow">
              <span>Tipo de cuenta</span>
              <b>{activeUser.accountType === 'empresa' ? 'Empresa' : 'Persona'}</b>
            </div>
            <div className="prow">
              <span>Alias KORA</span>
              <b>
                {alias} <button className="cbtn" onClick={() => comingSoon('Alias copiado', 'Copiar al portapapeles.')}>Copiar</button>
              </b>
            </div>
          </div>

          <div className="card" style={{ padding: 22, marginTop: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>Seguridad</h3>
            <div className="prow">
              <span>PIN de 6 dígitos</span>
              <b>
                <span className="pill p-green">ACTIVO</span>{' '}
                <button className="cbtn" onClick={() => comingSoon('Cambiar PIN')}>Cambiar</button>
              </b>
            </div>
            <div className="prow">
              <span>Confirmación extra en pagos mayores</span>
              <Toggle defaultOn onChange={() => comingSoon('Preferencia guardada', undefined, '🔐')} />
            </div>
            <div className="prow">
              <span>Notificaciones por WhatsApp</span>
              <Toggle defaultOn onChange={() => comingSoon('Preferencia guardada', undefined, '💬')} />
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Tu nivel de verificación</h3>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Nivel {activeUser.kycLevel} de 3</div>
            <div className="kyc-bar">
              <div className="kyc-fill" style={{ width: `${kycPct}%` }} />
            </div>
            <div className="prow">
              <span>Límite diario</span>
              <b>
                {bs(limits.daily)} (≈ {formatUSD(limits.daily)})
              </b>
            </div>
            <div className="prow">
              <span>Límite mensual</span>
              <b>
                {bs(limits.monthly)} (≈ {formatUSD(limits.monthly)})
              </b>
            </div>
            <div className="prow">
              <span>Compra de puntos</span>
              <b>{bs(limits.krtMonthly)}/mes</b>
            </div>
            {activeUser.kycLevel < 3 && (
              <button
                className="btn full"
                style={{ marginTop: 12 }}
                disabled={requestingVerification || hasPendingVerification}
                onClick={handleRequestVerification}
              >
                {hasPendingVerification
                  ? 'Solicitud en revisión'
                  : requestingVerification
                    ? 'Enviando...'
                    : `Subir a Nivel ${activeUser.kycLevel + 1}`}
              </button>
            )}
          </div>

          <div className="card" style={{ padding: 22, marginTop: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Tu nivel y beneficios</h3>
            <BnplTierCard score={score} compact />
            <div className="prow" style={{ marginTop: 4 }}>
              <span>Cashback base en compras</span>
              <b style={{ color: 'var(--gold)' }}>hasta 1,2% en puntos</b>
            </div>
            <div className="prow">
              <span>Compra de puntos</span>
              <b>{bs(limits.krtMonthly)}/mes</b>
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />

            <div className="prow" style={{ cursor: 'pointer' }} onClick={() => setActiveView('tokens')}>
              <span>Puntos</span>
              <b style={{ color: 'var(--gold)' }}>{formatKRT(krtTotalCents)} · Ver más →</b>
            </div>
            <div className="prow" style={{ cursor: 'pointer' }} onClick={() => setActiveView('creditos')}>
              <span>Cupo de crédito disponible</span>
              <b>
                {bs(account.creditLimitTotalCents - account.creditLimitUsedCents)} / {bs(account.creditLimitTotalCents)}{' '}
                · Ver más →
              </b>
            </div>
            <div className="prow" style={{ cursor: 'pointer' }} onClick={() => setActiveView('cuotas')}>
              <span>Planes de KORA Cuotas activos</span>
              <b>{activePlansCount} · Ver más →</b>
            </div>
            <div className="prow" style={{ cursor: 'pointer' }} onClick={() => setActiveView('tarjeta')}>
              <span>Mi Tarjeta KORA</span>
              <b>
                {card ? (card.status === 'congelada' ? 'Congelada' : 'Activa') : 'Sin emitir'} · Ver más →
              </b>
            </div>
          </div>

          <button className="logout-btn" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </>
  );
}
