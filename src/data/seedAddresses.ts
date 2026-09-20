import type { ShippingAddress } from '../domain/shipping';

/** Una dirección por cuenta persona demo, simulando "la del registro" —
 * hoy no existe captura de dirección en `AuthScreen.tsx` (KORA no la pide
 * en el registro real todavía), así que se siembra directo. Direcciones
 * ilustrativas de Caracas `[AJUSTAR]`. El teléfono de María coincide con
 * el que ya aparece en la pantalla de login, para que la demo sea consistente. */
export const SEED_ADDRESSES: ShippingAddress[] = [
  {
    id: 'addr-maria-1',
    accountId: 'account-maria',
    fullName: 'María Fernández',
    phone: '0412-555 8821',
    line1: 'Av. Francisco de Miranda, Res. Parque Cristal, Torre Este, Piso 8, Apto 8-B',
    cityState: 'Chacao, Caracas, Distrito Capital',
    reference: 'Frente a la estación del Metro Altamira',
  },
  {
    id: 'addr-diego-1',
    accountId: 'account-diego',
    fullName: 'Diego Torres',
    phone: '0424-118 3390',
    line1: 'Calle Bolívar, Edif. Los Samanes, Piso 3, Apto 3-A',
    cityState: 'Baruta, Caracas, Miranda',
    reference: 'Al lado de la farmacia Saas',
  },
  {
    id: 'addr-carlos-1',
    accountId: 'account-carlos',
    fullName: 'Carlos Silva',
    phone: '0414-772 6015',
    line1: 'Av. Libertador, Res. Monte Elena, Torre B, Piso 5, Apto 5-C',
    cityState: 'Libertador, Caracas, Distrito Capital',
  },
];
