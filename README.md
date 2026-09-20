# Sobre Ruedas — sandbox de movilidad y fintech (demo)

Sobre Ruedas es una demo interactiva de un ecosistema digital de movilidad para Venezuela: marketplace de vehículos nuevos y usados (con Escrow), motos, bicicletas y repuestos; financiamiento KORA Cuotas (BNPL); billetera con Pago Móvil C2B, cobro por QR y split payouts; y GovTech vehicular (INTT, SENIAT). Es un fork white-label de **KORA** (`../Kora-wallet`) — comparte toda su arquitectura de dominio/servicios/estado, solo cambia identidad visual y catálogo. Es un **sandbox de pitch**, no un producto en producción: no mueve dinero real, no usa blockchain real y no se conecta a ningún proveedor financiero real.

> 🧪 Dentro de la app, el banner superior y el **Panel de simulación** (botón "Panel de simulación") dejan esto explícito en todo momento y dan control sobre el reloj simulado, la tasa BCV, el resultado forzado de solicitudes de crédito, el perfil activo y el reset a los datos semilla.

## Cómo correrlo

```bash
npm install
npm run dev       # servidor de desarrollo (http://localhost:5173)
npm run build     # typecheck + build de producción a dist/
npm run lint      # oxlint
npm run preview   # sirve el build de dist/
```

Requiere Node 20+.

## Qué es real y qué es simulado

| Área | Estado |
|---|---|
| Dinero, saldos, KRT, crédito, transacciones | **100% simulado** — vive en memoria (Zustand) + `localStorage`, no hay backend. |
| Tasa BCV mostrada en el Topbar | **Real** — la única llamada de red del proyecto. Se sincroniza una vez por día real contra [dolarapi.com](https://dolarapi.com) (fuente pública, sin API key). Ver `src/services/bcvRateService.ts`. Si falla, se usa la última tasa conocida y se marca como "sin conexión". |
| Autenticación | Simulada — el login por PIN no valida nada; los "perfiles de demo" entran con un clic. |
| KYC / verificación de identidad | Flujo de UI completo, sin verificación real detrás. |

## Los 3 perfiles de demo

Pensados para mostrar casos de uso distintos sin tener que generar historial en vivo:

- **María Fernández** — score alto (86), cuenta antigua, saldo KRT amplio (para poder demostrar colateralización de crédito).
- **Diego Torres** — cuenta nueva (9 días), score bajo (29), solo califica para el tier "Micro Express".
- **Carlos Silva** — tiene una cuota en **mora** activa, lo que bloquea nuevas solicitudes de crédito (regla de negocio real, no solo copy).

Se cambia de perfil sin cerrar sesión desde el Panel de simulación, o eligiendo otro perfil en la pantalla de login.

## Arquitectura

React 19 + Vite + TypeScript. Sin backend, sin router (navegación por estado en `state/slices/uiSlice.ts`).

```
src/
├── domain/       Tipos de dominio puros (User, Account, BnplRequest, InstallmentPlan, KrtLedgerEntry, Product, Order...)
├── services/      Un archivo de interfaz por dominio (bnplService, tokenService, scoreService, marketplaceService...)
│   ├── mocks/     Implementación sandbox — toda la lógica de negocio real (underwriting, amortización francesa, mora, ledger)
│   └── real/       Stub que documenta la superficie a implementar contra un backend real (hoy: solo lanza "Not implemented")
├── state/        Zustand: store.ts + slices por dominio + selectors.ts
├── data/         Datos semilla (seedUsers, seedProducts, seedMerchants...)
├── lib/          finance.ts (amortización francesa), format.ts, hooks compartidos
├── features/     Una carpeta por vista (marketplace/, cuotas/, tokens/, etc.)
├── components/   Shell, navegación, modales genéricos
└── sandbox/      DemoBanner + SimulationPanel (solo sandbox)
```

### Patrón adapter — cómo se conectaría un backend real

Cada servicio (`services/bnplService.ts`, `services/tokenService.ts`, etc.) exporta una interfaz TypeScript. Qué implementación se usa se decide en un solo lugar según `services/env.ts`:

```ts
export const ENV: Env = (import.meta.env.VITE_APP_ENV as Env) ?? 'sandbox';
```

Con `ENV === 'sandbox'` (el único valor usado hoy) se resuelve a `mocks/*.mock.ts`. Cambiar a `production` resolvería a `real/*.real.ts` — hoy esos archivos son stubs que lanzan `Error('Not implemented: ...')` documentando qué endpoint/proveedor haría falta integrar. Ningún componente de UI importa un mock directamente: siempre pasan por la interfaz del servicio, así que conectar un backend real es un cambio de una sola bandera, no una reescritura de la UI.

### Reloj simulado vs. reloj real

Todas las fechas de dominio (vencimientos de cuotas, timestamps de transacciones y del ledger KRT) usan `state.simulatedNowIso`, no la hora real del sistema. El Panel de simulación puede adelantar este reloj para vencer cuotas y probar la máquina de estados de mora sin esperar días reales. La sincronización de la tasa BCV es la única excepción: se rige por el calendario real, porque es un dato de mercado externo.

### Persistencia

El estado completo se persiste en `localStorage` (`kora-sandbox-store`) vía el middleware `persist` de Zustand, solo para que la demo sobreviva a un refresh — no es custodia de datos real. El botón "Reiniciar a datos semilla" del Panel de simulación borra esa clave y recarga la página.

## Restricciones de producto respetadas

- Sin nombres de proveedores reales ni de proyectos anteriores en el código, copy o assets (verificado con grep antes de cada commit).
  - **Excepción consciente:** el catálogo de `data/seedProducts.ts` (Marketplace) sí usa nombres de marca de producto reales (Apple, Samsung, LG, Sony, Nike, Adidas, etc.) — decisión explícita de la dueña del proyecto, porque el Marketplace se usa como demo de venta a comercios reales que ya venden estos productos. Los **comercios** (sellers, `data/seedMerchants.ts`) siguen siendo ficticios, y las imágenes siguen sin ser renders de fabricante (LoremFlickr por categoría, no el producto exacto). Esta excepción no aplica al resto del código — proveedores de infraestructura, bancos aliados, etc. siguen siendo ficticios.
- Sin dinero real, sin blockchain real, sin backend real — ver tabla de arriba.
- KRT es un token de lealtad/utilidad ilustrativo, no un instrumento financiero regulado.

## Estado del proyecto

Construido fase por fase (ver historial de commits de git para el detalle de cada una): sistema de diseño → dominio y datos semilla → vistas núcleo → BNPL y mora → KRT y colateral → Marketplace → sandbox (perfiles/simulación/reset) → pulido de accesibilidad y documentación.
