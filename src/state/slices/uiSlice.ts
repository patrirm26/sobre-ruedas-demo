import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import { authService } from '../../services/authService';

export type ViewId =
  | 'home'
  | 'services'
  | 'historial'
  | 'tokens'
  | 'creditos'
  | 'cuotas'
  | 'govtech'
  | 'copilot'
  | 'cobrar'
  | 'pagar'
  | 'remesas'
  | 'marketplace'
  | 'consorcio'
  | 'alianzas'
  | 'fondos'
  | 'tarjeta'
  | 'perfil'
  | 'factoring';

export type ThemeMode = 'dark' | 'light';

export interface PlaceholderModal {
  icon: string;
  title: string;
  body: string;
}

export interface UiSlice {
  theme: ThemeMode;
  activeView: ViewId;
  loggedIn: boolean;
  toastMessage: string | null;
  /** Modal genérico para acciones cuya lógica de negocio real llega en fases
   * siguientes (ej. ledger, transferir, bandas de score) — Fase 2 es un
   * port visual, no implementa cada flujo todavía. */
  placeholderModal: PlaceholderModal | null;
  /** Drawer global del panel de simulación (Fase 6) — se abre desde el banner de sandbox. */
  simulationPanelOpen: boolean;
  /** Drawer flotante del Copilot (Sprint 1 — navegación): capa ambiental
   * persistente sobre cualquier vista, ya no es un destino del nav. */
  copilotPanelOpen: boolean;
  /** Sprint 8 — onboarding con activación por primera transacción: solo lo
   * setea `enterAfterSignup` (registro real), nunca `login()` — el sandbox
   * y el sign-in normal no lo tocan. Efímero, no persiste entre cargas. */
  justRegistered: boolean;

  toggleTheme: () => void;
  setActiveView: (view: ViewId) => void;
  login: () => void;
  /** Variante de `login()` para justo después de un registro real exitoso
   * — aterriza en Marketplace en vez de Home, con `justRegistered` en true
   * para mostrar el banner de bienvenida (ver MarketplaceView.tsx). */
  enterAfterSignup: () => void;
  dismissJustRegistered: () => void;
  logout: () => void;
  showToast: (message: string) => void;
  clearToast: () => void;
  openPlaceholder: (modal: PlaceholderModal) => void;
  closePlaceholder: () => void;
  openSimulationPanel: () => void;
  closeSimulationPanel: () => void;
  openCopilotPanel: () => void;
  closeCopilotPanel: () => void;
}

export const createUiSlice: StateCreator<StoreState, [], [], UiSlice> = (set) => ({
  // 'light' (el look "editorial cream") es el default — es el que se probó
  // y pulió toda la semana para la demo. 'dark' queda como alternativa real
  // que el usuario elige a propósito con el toggle, no el punto de partida.
  theme: 'light',
  activeView: 'home',
  loggedIn: false,
  toastMessage: null,
  placeholderModal: null,
  simulationPanelOpen: false,
  copilotPanelOpen: false,
  justRegistered: false,

  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setActiveView: (view) => set({ activeView: view }),
  login: () => set({ loggedIn: true, activeView: 'home' }),
  enterAfterSignup: () => set({ loggedIn: true, activeView: 'marketplace', justRegistered: true }),
  dismissJustRegistered: () => set({ justRegistered: false }),
  // Optimista: no espera el round-trip de red para volver al login. Si
  // signOut() fallara, el peor caso es que el token expire solo en vez de
  // invalidarse al instante — antes ni siquiera se intentaba, dejando la
  // sesión real de Supabase viva después de "cerrar sesión".
  logout: () => {
    void authService.signOut();
    set({ loggedIn: false });
  },
  showToast: (message) => set({ toastMessage: message }),
  clearToast: () => set({ toastMessage: null }),
  openPlaceholder: (modal) => set({ placeholderModal: modal }),
  closePlaceholder: () => set({ placeholderModal: null }),
  openSimulationPanel: () => set({ simulationPanelOpen: true }),
  closeSimulationPanel: () => set({ simulationPanelOpen: false }),
  openCopilotPanel: () => set({ copilotPanelOpen: true }),
  closeCopilotPanel: () => set({ copilotPanelOpen: false }),
});
