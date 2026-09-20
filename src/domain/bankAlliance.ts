export interface AllyBank {
  id: string;
  name: string;
  /** 4 dígitos, estilo BCV — ej. "0199". */
  code: string;
  services: string[];
  /** El banco dueño de este sandbox — es el único banco contra el que se
   * puede *vincular* una cuenta (`AlianzasBancariasView`): la billetera es
   * un producto de ESE banco, vincular cuentas de otros bancos no es legal
   * en ese contexto. Los demás bancos de la lista siguen disponibles como
   * destino/origen de Pago Móvil (Pagar/Cobrar), que sí es interbancario
   * por diseño en Venezuela. Debe haber exactamente uno en `true`. */
  isOwnBank?: boolean;
}

export type BankAccountType = 'corriente' | 'ahorro';

export interface LinkedBankAccount {
  id: string;
  /** Cuenta KORA dueña del vínculo. */
  accountId: string;
  bankId: string;
  accountType: BankAccountType;
  /** 20 dígitos — los primeros 4 coinciden con el código del banco. */
  accountNumber: string;
  /** "V-12.345.678" / "J-50XXXXXX-0". */
  holderIdDoc: string;
  holderName: string;
  /** "0412-555 8821" — para Pago Móvil. */
  phone: string;
  linkedAt: string;
}
