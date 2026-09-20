import { useCallback, useEffect, useState } from 'react';
import { useKoraStore } from '../../state/store';
import { formatDate } from '../../lib/format';
import { staffService } from '../../services/staffService';
import { BACKOFFICE_ROLE_LABEL, type BackofficeRole, type StaffMember } from '../../domain/staff';

const ROLE_PILL: Record<BackofficeRole, string> = {
  admin: 'p-violet',
  compliance: 'p-red',
  operaciones: 'p-blue',
  reporting: 'p-gold',
};

const ROLE_OPTIONS = Object.keys(BACKOFFICE_ROLE_LABEL) as BackofficeRole[];

function StaffRow({ member, onChanged }: { member: StaffMember; onChanged: () => Promise<void> }) {
  const showToast = useKoraStore((s) => s.showToast);
  const [busy, setBusy] = useState(false);

  const handleRoleChange = async (role: BackofficeRole) => {
    setBusy(true);
    try {
      await staffService.update({ id: member.id, role });
      await onChanged();
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async () => {
    setBusy(true);
    try {
      await staffService.update({ id: member.id, active: !member.active });
      showToast(member.active ? `✅ ${member.name} desactivado` : `✅ ${member.name} reactivado`);
      await onChanged();
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="unit">
      <div className="ui">{member.name.charAt(0).toUpperCase()}</div>
      <div className="ub">
        <div className="uid">{member.name}</div>
        <div className="uo">
          {member.email} · desde {formatDate(member.createdAt)}
        </div>
      </div>
      <div className="ur" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className={`pill ${member.active ? 'p-green' : 'p-red'}`}>{member.active ? 'ACTIVO' : 'INACTIVO'}</span>
        <span className={`pill ${ROLE_PILL[member.role]}`}>{BACKOFFICE_ROLE_LABEL[member.role].toUpperCase()}</span>
        <select
          className="in-field"
          style={{ width: 150 }}
          value={member.role}
          disabled={busy}
          onChange={(e) => handleRoleChange(e.target.value as BackofficeRole)}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {BACKOFFICE_ROLE_LABEL[r]}
            </option>
          ))}
        </select>
        <button className="cbtn" disabled={busy} onClick={handleToggleActive}>
          {member.active ? 'Desactivar' : 'Reactivar'}
        </button>
      </div>
    </div>
  );
}

/** Gestión de staff del banco (roles y permisos) — solo alcanzable con rol
 * 'admin' (ver ROLE_SECTIONS en backofficeSlice.ts y el filtro en
 * BackOfficeApp.tsx). Invitar da de alta un miembro nuevo con una
 * contraseña temporal — este proyecto no tiene SMTP configurado para
 * mandar la invitación por correo real. */
export function StaffView() {
  const showToast = useKoraStore((s) => s.showToast);
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<BackofficeRole>('operaciones');
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setMembers(await staffService.list());
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleInvite = async () => {
    setSubmitting(true);
    try {
      const { member, tempPassword } = await staffService.invite({ name, email, role });
      showToast(`✅ ${member.name} invitado como ${BACKOFFICE_ROLE_LABEL[member.role]} — contraseña temporal: ${tempPassword}`);
      setName('');
      setEmail('');
      setRole('operaciones');
      await refresh();
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="sec-h" style={{ marginTop: 0 }}>
        <h2>Invitar miembro del personal</h2>
      </div>
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="in-row">
          <div className="in-group">
            <label className="in-label">NOMBRE</label>
            <input className="in-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" />
          </div>
          <div className="in-group">
            <label className="in-label">CORREO</label>
            <input className="in-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@banco.com" />
          </div>
        </div>
        <div className="in-group">
          <label className="in-label">ROL</label>
          <select className="in-field" value={role} onChange={(e) => setRole(e.target.value as BackofficeRole)}>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {BACKOFFICE_ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </div>
        <button className="btn full" disabled={submitting || !name.trim() || !email.trim()} onClick={handleInvite}>
          {submitting ? 'Invitando...' : '+ Invitar'}
        </button>
      </div>

      <div className="sec-h">
        <h2>Personal del banco</h2>
      </div>
      {loading ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Cargando…
        </div>
      ) : (
        <div className="card">
          {members.map((m) => (
            <StaffRow key={m.id} member={m} onChanged={refresh} />
          ))}
        </div>
      )}
    </>
  );
}
