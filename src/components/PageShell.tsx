import type { ReactNode } from 'react';

interface PageShellProps {
  /** Contenido grande del header — ej. un monto en display 52px. No fuerza
   * tipografía: cada vista decide qué tan grande necesita su título. */
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

/** Wrapper editorial mínimo (demo martes, ver Plan_5_Dias_Demo_Martes.md) —
 * no reemplaza a Topbar (que sigue dando el título estático de cada vista
 * vía viewMeta.ts), da un slot de header opcional para vistas que necesitan
 * algo dinámico que Topbar no puede dar (ej. el total del mes en Actividad).
 * Sin title/actions no renderiza nada de más — es puro paso de children. */
export function PageShell({ title, subtitle, actions, children }: PageShellProps) {
  return (
    <>
      {(title || actions) && (
        <div className="page-shell-head">
          <div>
            {title && <div className="page-shell-title">{title}</div>}
            {subtitle && <div className="page-shell-subtitle">{subtitle}</div>}
          </div>
          {actions && <div className="page-shell-actions">{actions}</div>}
        </div>
      )}
      {children}
    </>
  );
}
