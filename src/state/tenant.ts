import { createContext, useContext } from 'react';

export interface Tenant {
  id: string;
  nombre: string;
  marcaJson: Record<string, string>;
  estado: string;
}

// El sandbox no hace ninguna llamada de red, arranca siempre con este
// valor fijo. `accent` es la única clave de `marcaJson` que hoy pinta algo
// real (ver `applyTenantTheme`); el logo vive aparte en
// `Logo.tsx`/`DigitalCard.tsx`. Cada vertical white-label (copia de este
// repo — ver `Kora-wallet`, la infraestructura base) reemplaza este objeto
// con su propia marca.
export const SANDBOX_TENANT: Tenant = {
  id: '00000000-0000-0000-0000-000000000002',
  nombre: 'Sobre Ruedas Demo',
  marcaJson: { accent: '#ff5a1f' },
  estado: 'activo',
};

export const TenantContext = createContext<Tenant>(SANDBOX_TENANT);

export function useTenant(): Tenant {
  return useContext(TenantContext);
}

// Solo las claves que de verdad alimentan una variable de tema existente
// (ver src/styles/tokens.css) — `marca_json` puede traer otras claves
// (ej. logoText) que un tenant use para otra cosa más adelante, sin que
// esta función tenga que conocerlas.
const CSS_VAR_BY_MARCA_KEY: Record<string, string> = {
  accent: '--accent',
};

export function applyTenantTheme(marcaJson: Record<string, string>) {
  for (const [key, value] of Object.entries(marcaJson)) {
    const cssVar = CSS_VAR_BY_MARCA_KEY[key];
    if (cssVar && value) document.documentElement.style.setProperty(cssVar, value);
  }
}
