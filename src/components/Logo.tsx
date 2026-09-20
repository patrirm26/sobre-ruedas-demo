interface LogoProps {
  height?: number;
  className?: string;
  /** 'light' (default) = marca a color, para fondos claros (Sidebar, Back
   * Office, tarjeta de login). 'dark' = marca en blanco, para el único panel
   * deliberadamente oscuro del sistema (`.login-left`, ver AuthScreen). */
  variant?: 'light' | 'dark';
  /** true = solo el ícono de rueda (favicon, espacios angostos), sin wordmark. */
  iconOnly?: boolean;
}

/** Wordmark de Sobre Ruedas — SVG inline (sin PNG, sin dependencia de red).
 * Ícono: una rueda de 3 rayos trazada con el acento de marca — legible a
 * cualquier tamaño, de favicon a header. Cada sandbox de marca blanca (ver
 * `state/tenant.ts`, `SANDBOX_TENANT`) es una copia de este repo con su
 * propio ícono/wordmark aplicado acá — este archivo es el de Sobre Ruedas. */
export function Logo({ height = 28, className, variant = 'light', iconOnly = false }: LogoProps) {
  const ink = variant === 'dark' ? '#ffffff' : 'var(--ink)';
  const accent = variant === 'dark' ? '#ffffff' : 'var(--accent)';

  return (
    <span
      className={`sr-logo ${className ?? ''}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: height * 0.28 }}
    >
      <svg width={height} height={height} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="17" stroke={accent} strokeWidth="3" />
        <circle cx="20" cy="20" r="4.5" fill={accent} />
        <path
          d="M20 8.5V15.5M20 24.5V31.5M9.5 26L15.2 22.6M24.8 17.4L30.5 14"
          stroke={accent}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {!iconOnly && (
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: height * 0.62,
            lineHeight: 1,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: ink }}>Sobre</span> <span style={{ color: accent }}>Ruedas</span>
        </span>
      )}
    </span>
  );
}
