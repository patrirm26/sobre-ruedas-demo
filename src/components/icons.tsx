import type { SVGProps } from 'react';

/** Íconos inline migrados 1:1 (paths) desde KORA_Demo_OF_1.html. Todos stroke-based,
 * heredan color con currentColor para funcionar en cualquier contexto de tema. */
function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

export const IconHome = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
    <path d="M9 22V12h6v10" />
  </Svg>
);

export const IconGrid = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </Svg>
);

export const IconList = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </Svg>
);

export const IconToken = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" />
  </Svg>
);

export const IconCredit = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M12 2a10 10 0 0 1 0 20V2z" fill="currentColor" opacity={0.3} />
    <circle cx="12" cy="12" r="10" />
  </Svg>
);

export const IconInstallment = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20M7 15h2M12 15h3" />
  </Svg>
);

export const IconGov = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11" />
  </Svg>
);

/** Audífonos de soporte — más asociado a "necesito ayuda" que la estrella
 * que tenía antes (pedido explícito, 19 ago). */
export const IconCopilot = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M4 13a8 8 0 0 1 16 0" />
    <rect x="2" y="13" width="5" height="7" rx="2.3" />
    <rect x="17" y="13" width="5" height="7" rx="2.3" />
    <path d="M19.5 20v1a2 2 0 0 1-2 2h-3" />
  </Svg>
);

export const IconCollect = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M12 2v15M5 12l7 7 7-7" />
    <path d="M4 20h16" />
  </Svg>
);

export const IconPay = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M12 22V7M5 12l7-7 7 7" />
    <path d="M4 4h16" />
  </Svg>
);

export const IconRemesas = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
  </Svg>
);

export const IconConsorcio = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M2 22h20M10 6h.01M14 6h.01M10 10h.01M14 10h.01M10 14h.01M14 14h.01" />
  </Svg>
);

export const IconMarket = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </Svg>
);

export const IconSplit = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M4 12h4l3-7h6" />
    <path d="M4 12h4l3 7h6" />
    <path d="M17 2l4 3-4 3M17 16l4 3-4 3" />
  </Svg>
);

export const IconFactoring = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="3" y="4" width="14" height="17" rx="2" />
    <path d="M7 9h6M7 13h6M7 17h3" />
    <path d="M17 8l4 2v9a2 2 0 0 1-2 2h-2" />
  </Svg>
);

export const IconBank = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M3 10l9-6 9 6" />
    <path d="M4 10h16v9H4z" />
    <path d="M4 21h16M8 13v4M12 13v4M16 13v4" />
  </Svg>
);

export const IconFund = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
    <path d="M3 21h18" />
  </Svg>
);

export const IconOperator = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="12" rx="2" />
    <path d="M3 10h18M8 21h8M12 15v6" />
  </Svg>
);

export const IconCard = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20M6 15h4" />
  </Svg>
);

export const IconMenu = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </Svg>
);

export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p} strokeWidth={2.4}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconMoon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p} strokeWidth={1.9}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Svg>
);

export const IconSun = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p} strokeWidth={1.9}>
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </Svg>
);

export const IconLogout = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p} strokeWidth={1.9}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </Svg>
);

export const IconUser = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a7 7 0 0 1 14 0v1" />
  </Svg>
);

export const IconBuilding = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M2 22h20" />
  </Svg>
);

export const IconDoc = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="M15 8h3M15 12h3M5 18h14" />
  </Svg>
);

export const IconUpload = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </Svg>
);

export const IconSelfie = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="10" r="3" />
    <path d="M5 20a7 7 0 0 1 14 0" />
    <rect x="2" y="3" width="20" height="18" rx="3" />
  </Svg>
);

export const IconUsers = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.5a3.2 3.2 0 0 1 0 6.4M21.5 20a6 6 0 0 0-5-5.9" />
  </Svg>
);

export const IconHistory = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v4h4" />
    <path d="M12 7v5l3.5 2" />
  </Svg>
);

export const IconShield = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
);

export const IconLock = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 018 0v3" />
  </Svg>
);

export const IconMic = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <path d="M12 19v3M8 22h8" />
  </Svg>
);

export const IconMicOff = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M9 9v3a3 3 0 0 0 4.6 2.5M15 6.5V5a3 3 0 0 0-5.9-.7" />
    <path d="M5 10a7 7 0 0 0 11.3 5.5" />
    <path d="M19 10a7 7 0 0 1-.7 3.1" />
    <path d="M12 19v3M8 22h8" />
    <path d="M2 2l20 20" />
  </Svg>
);

export const IconVolume = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7M19.5 5.5a9 9 0 0 1 0 13" />
  </Svg>
);

export const IconVolumeOff = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M23 9l-6 6M17 9l6 6" />
  </Svg>
);

export const IconEye = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const IconEyeOff = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.2A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.8 17.8 0 0 1-3.4 4.3M6.6 6.6C4 8.3 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4.2-.9" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Svg>
);

export const IconGauge = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M3 13a9 9 0 0 1 18 0" />
    <path d="M12 13l4-4" />
    <circle cx="12" cy="13" r="1.2" fill="currentColor" />
  </Svg>
);
