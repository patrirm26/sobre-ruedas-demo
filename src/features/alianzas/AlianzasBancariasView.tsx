import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { selectActiveAccount } from '../../state/selectors';
import { bankAllianceService } from '../../services/bankAllianceService';
import { formatDate } from '../../lib/format';
import { BankOperationModal } from './BankOperationModal';
import type { BankAccountType, LinkedBankAccount } from '../../domain/bankAlliance';

const ACCOUNT_TYPE_LABEL: Record<BankAccountType, string> = {
  corriente: 'Corriente',
  ahorro: 'Ahorro',
};

export function AlianzasBancariasView() {
  const account = useKoraStore(selectActiveAccount);
  const allyBanks = useKoraStore((s) => s.allyBanks);
  const showToast = useKoraStore((s) => s.showToast);
  const linkedAccounts = useKoraStore(
    useShallow((s) => (account ? s.linkedBankAccounts.filter((l) => l.accountId === account.id) : []))
  );

  // Solo se puede vincular el banco dueño de este sandbox — la billetera es
  // un producto de ESE banco, vincular cuentas de otros bancos no es legal
  // en ese contexto (a diferencia de Pago Móvil en Pagar/Cobrar, que sí es
  // interbancario y sigue usando `allyBanks` completo).
  const ownBank = allyBanks.find((b) => b.isOwnBank);
  const bankId = ownBank?.id ?? '';
  const [accountType, setAccountType] = useState<BankAccountType>('ahorro');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderIdDoc, setHolderIdDoc] = useState('');
  const [holderName, setHolderName] = useState('');
  const [phone, setPhone] = useState('');
  const [linking, setLinking] = useState(false);

  const [operation, setOperation] = useState<{ mode: 'deposit' | 'withdraw'; linked: LinkedBankAccount } | null>(null);

  const handleLink = async () => {
    if (!account) return;
    setLinking(true);
    try {
      await bankAllianceService.linkBankAccount({
        accountId: account.id,
        bankId,
        bankCode: ownBank?.code,
        bankName: ownBank?.name,
        accountType,
        accountNumber,
        holderIdDoc,
        holderName,
        phone,
      });
      showToast('✅ Cuenta bancaria vinculada');
      setAccountNumber('');
      setHolderIdDoc('');
      setHolderName('');
      setPhone('');
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setLinking(false);
    }
  };

  return (
    <>
      <div className="sec-h" style={{ marginTop: 0 }}>
        <h2>Vincular tu cuenta en {ownBank?.name ?? 'tu banco'}</h2>
      </div>
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
          Solo podés vincular una cuenta de {ownBank?.name ?? 'tu banco'} — esta billetera es un producto del banco, no
          un agregador multibanco.
        </div>
        <div className="in-row">
          <div className="in-group">
            <label className="in-label">BANCO</label>
            <div className="in-field" style={{ display: 'flex', alignItems: 'center', color: 'var(--muted)' }}>
              {ownBank ? `${ownBank.name} · ${ownBank.code}` : 'No configurado'}
            </div>
          </div>
          <div className="in-group">
            <label className="in-label">TIPO DE CUENTA</label>
            <select className="in-field" value={accountType} onChange={(e) => setAccountType(e.target.value as BankAccountType)}>
              <option value="ahorro">Ahorro</option>
              <option value="corriente">Corriente</option>
            </select>
          </div>
        </div>
        <div className="in-group">
          <label className="in-label">NÚMERO DE CUENTA (20 DÍGITOS)</label>
          <input
            className="in-field"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder={`${ownBank?.code ?? '0000'} 0000 00 0000000000`}
          />
        </div>
        <div className="in-row">
          <div className="in-group">
            <label className="in-label">CÉDULA O RIF DEL TITULAR</label>
            <input className="in-field" value={holderIdDoc} onChange={(e) => setHolderIdDoc(e.target.value)} placeholder="V-12.345.678" />
          </div>
          <div className="in-group">
            <label className="in-label">TELÉFONO (PAGO MÓVIL)</label>
            <input className="in-field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0412-5558821" />
          </div>
        </div>
        <div className="in-group">
          <label className="in-label">NOMBRE DEL TITULAR</label>
          <input className="in-field" value={holderName} onChange={(e) => setHolderName(e.target.value)} />
        </div>
        <button className="btn full" disabled={linking || !account || !ownBank} onClick={handleLink}>
          {linking ? 'Vinculando...' : 'Vincular cuenta'}
        </button>
      </div>

      <div className="sec-h">
        <h2>Tus cuentas vinculadas</h2>
      </div>
      {linkedAccounts.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Todavía no vinculaste ninguna cuenta bancaria.
        </div>
      ) : (
        <div className="card">
          {linkedAccounts.map((linked) => {
            const bank = allyBanks.find((b) => b.id === linked.bankId);
            return (
              <div className="unit" key={linked.id}>
                <div className="ui">🏦</div>
                <div className="ub">
                  <div className="uid">{bank?.name ?? 'Banco aliado'}</div>
                  <div className="uo">
                    {ACCOUNT_TYPE_LABEL[linked.accountType]} •••• {linked.accountNumber.slice(-4)} · {linked.holderIdDoc} ·{' '}
                    {linked.phone} · vinculada {formatDate(linked.linkedAt)}
                  </div>
                </div>
                <div className="ur" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button className="cbtn" onClick={() => setOperation({ mode: 'deposit', linked })}>
                    Fondear vía Pago Móvil
                  </button>
                  <button className="cbtn" onClick={() => setOperation({ mode: 'withdraw', linked })}>
                    Retirar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {operation && account && (
        <BankOperationModal
          mode={operation.mode}
          linked={operation.linked}
          bank={allyBanks.find((b) => b.id === operation.linked.bankId)}
          accountId={account.id}
          onClose={() => setOperation(null)}
        />
      )}
    </>
  );
}
