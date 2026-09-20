import { useKoraStore } from '../../state/store';
import { generateId } from '../../lib/ids';
import type { LinkedBankAccount } from '../../domain/bankAlliance';
import type { BankAllianceService, LinkBankAccountInput, MobilePaymentInput, BankTransferInput } from '../bankAllianceService';
import { simulateLatency } from '../delay';
import { isValidPhone, isValidIdDoc, isValidAccountNumber, MIN_KYC_LEVEL_TO_LINK } from '../bankAllianceRules';

function generateReferenceCode(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

export const mockBankAllianceService: BankAllianceService = {
  async linkBankAccount(input: LinkBankAccountInput): Promise<LinkedBankAccount> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const bank = state.allyBanks.find((b) => b.id === input.bankId);
    if (!bank) throw new Error('Banco no encontrado.');

    const owner = Object.values(state.users).find((u) => u.primaryAccountId === input.accountId);
    if (!owner) throw new Error('Cuenta no encontrada.');
    if (owner.kycLevel < MIN_KYC_LEVEL_TO_LINK) {
      throw new Error(`Necesitas al menos verificación Nivel ${MIN_KYC_LEVEL_TO_LINK} para vincular un banco externo.`);
    }
    if (!isValidPhone(input.phone)) throw new Error('Teléfono inválido — usa un prefijo venezolano (0412/0414/0416/0424/0426) + 7 dígitos.');
    if (!isValidIdDoc(input.holderIdDoc)) throw new Error('Cédula o RIF inválido — formato esperado V-12.345.678 o J-50123456-0.');
    if (!isValidAccountNumber(input.accountNumber, bank.code)) {
      throw new Error(`Número de cuenta inválido — debe tener 20 dígitos y empezar con el código de ${bank.name} (${bank.code}).`);
    }
    if (!input.holderName.trim()) throw new Error('Falta el nombre del titular.');

    const linked: LinkedBankAccount = {
      id: generateId('bankacc'),
      accountId: input.accountId,
      bankId: input.bankId,
      accountType: input.accountType,
      accountNumber: input.accountNumber.replace(/\D/g, ''),
      holderIdDoc: input.holderIdDoc.trim(),
      holderName: input.holderName.trim(),
      phone: input.phone.trim(),
      linkedAt: state.simulatedNowIso,
    };
    state.addLinkedBankAccount(linked);
    return linked;
  },

  async depositViaMobilePayment({ linkedAccountId, amountCents, currency }: MobilePaymentInput): Promise<{ referenceCode: string }> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const linked = state.linkedBankAccounts.find((l) => l.id === linkedAccountId);
    if (!linked) throw new Error('Cuenta bancaria vinculada no encontrada.');
    if (amountCents <= 0) throw new Error('El monto debe ser mayor a cero.');
    const bank = state.allyBanks.find((b) => b.id === linked.bankId);

    state.adjustBalance(linked.accountId, currency, amountCents);
    const referenceCode = generateReferenceCode();

    state.pushTransaction({
      id: generateId('tx'),
      accountId: linked.accountId,
      at: state.simulatedNowIso,
      title: 'Pago Móvil recibido',
      subtitle: `${bank?.name ?? 'Banco aliado'} · Ref. ${referenceCode}`,
      amountCents,
      currency,
      direction: 'in',
      category: 'banco',
      relatedEntityId: linked.id,
    });

    return { referenceCode };
  },

  async withdrawViaBankTransfer({ linkedAccountId, amountCents, currency }: BankTransferInput): Promise<void> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const linked = state.linkedBankAccounts.find((l) => l.id === linkedAccountId);
    if (!linked) throw new Error('Cuenta bancaria vinculada no encontrada.');
    if (amountCents <= 0) throw new Error('El monto debe ser mayor a cero.');

    const account = state.accounts[linked.accountId];
    const available = currency === 'USD' ? account.balanceUsdCents : account.balanceVesCents;
    if (available < amountCents) throw new Error(`Saldo en ${currency} insuficiente.`);

    const bank = state.allyBanks.find((b) => b.id === linked.bankId);
    state.adjustBalance(linked.accountId, currency, -amountCents);

    state.pushTransaction({
      id: generateId('tx'),
      accountId: linked.accountId,
      at: state.simulatedNowIso,
      title: `Transferencia a ${bank?.name ?? 'banco aliado'}`,
      subtitle: `Cuenta •••• ${linked.accountNumber.slice(-4)}`,
      amountCents,
      currency,
      direction: 'out',
      category: 'banco',
      relatedEntityId: linked.id,
    });
  },
};
