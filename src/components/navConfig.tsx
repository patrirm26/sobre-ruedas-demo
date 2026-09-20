import type { ComponentType, SVGProps } from 'react';
import type { ViewId } from '../state/slices/uiSlice';
import type { AccountType } from '../domain/user';
import {
  IconHome,
  IconList,
  IconCard,
  IconPay,
  IconCollect,
  IconRemesas,
  IconConsorcio,
  IconGov,
  IconCredit,
  IconInstallment,
  IconToken,
  IconMarket,
  IconFund,
  IconFactoring,
  IconKey,
  IconShield,
} from './icons';

export interface NavItem {
  id: ViewId;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  badge?: string;
  /** Solo visible si el `accountType` de la cuenta activa coincide (Sprint 4
   * — gate empresarial). Ausente = visible para cualquier tipo de cuenta. */
  requiresAccountType?: AccountType;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Navegación reestructurada en 4 secciones con propósito, alineadas al
 * modelo por capas (núcleo → mover dinero → crédito → crecer), en vez del
 * agrupamiento "por tipo de cosa" original.
 *
 * Cambios respecto a la versión anterior:
 * - "PRODUCTOS FINANCIEROS" (cajón de sastre con 5 badges NUEVO) se disuelve:
 *   cada ítem cae en la capa a la que pertenece por función, no por etiqueta.
 * - Créditos y Cuotas (antes huérfanos, ruteados pero fuera del nav) suben a
 *   su propia sección CRÉDITO — es el diferenciador del producto.
 * - Pagos al Estado pasa a MOVER DINERO (es una operación de pago, no un
 *   producto), eliminando la doble clasificación con las acciones rápidas.
 * - Tokens KRT entra en CRÉDITO: es el colateral que habilita el cupo.
 * - Copilot SALE del nav: es una capa ambiental (FAB flotante persistente,
 *   ver CopilotFab.tsx montado en App.tsx), no un destino más.
 * - Servicios sale del nav primario: la vista sigue ruteada, se alcanza vía
 *   el enlace "Ver todos los servicios" en Home.
 * - Alianzas Bancarias sale del nav: se alcanza desde "Fondear o retirar"
 *   en Home, junto a los flujos de billetera a los que pertenece.
 * - Se elimina el spam de badge NUEVO. El badge queda disponible en la
 *   interfaz para marcar como mucho UNA cosa realmente nueva a la vez.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'PRINCIPAL',
    items: [
      { id: 'home', label: 'Inicio', icon: IconHome },
      { id: 'historial', label: 'Actividad', icon: IconList },
      { id: 'tarjeta', label: 'Tarjeta', icon: IconCard },
    ],
  },
  {
    title: 'MOVER DINERO',
    items: [
      { id: 'pagar', label: 'Pagar', icon: IconPay },
      { id: 'cobrar', label: 'Cobrar', icon: IconCollect },
      { id: 'remesas', label: 'Remesas', icon: IconRemesas },
      { id: 'consorcio', label: 'Cobros y pagos', icon: IconConsorcio, requiresAccountType: 'empresa' },
      { id: 'govtech', label: 'Pagos al Estado', icon: IconGov },
    ],
  },
  {
    title: 'CRÉDITO',
    items: [
      { id: 'creditos', label: 'Créditos', icon: IconCredit },
      { id: 'cuotas', label: 'Cuotas', icon: IconInstallment },
      { id: 'tokens', label: 'Puntos', icon: IconToken },
      { id: 'factoring', label: 'Factoring', icon: IconFactoring, requiresAccountType: 'empresa' },
    ],
  },
  {
    title: 'CRECER',
    items: [
      { id: 'marketplace', label: 'Marketplace', icon: IconMarket },
      { id: 'alquiler', label: 'Alquiler', icon: IconKey },
      { id: 'seguros', label: 'Seguros', icon: IconShield },
      { id: 'fondos', label: 'Fondos', icon: IconFund },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

/**
 * Pestañas fijas del bottom nav móvil (las dos que flanquean el FAB izquierdo).
 * Antes: Inicio + Marketplace. Ahora: Inicio + Actividad — los dos destinos
 * del loop central. Marketplace baja a la sección CRECER y al menú.
 * (Las otras dos posiciones del mobilenav — FAB y "Crédito" — se resuelven
 * directo en BottomNav.tsx, no vienen de este array.)
 */
export const MOBILE_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Inicio', icon: IconHome },
  { id: 'historial', label: 'Actividad', icon: IconList },
];
