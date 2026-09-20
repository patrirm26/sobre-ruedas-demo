import { useEffect } from 'react';

/** Cierra overlays/drawers con la tecla Escape — requisito básico de
 * accesibilidad por teclado para cualquier diálogo modal (WCAG 2.1.2). */
export function useEscapeToClose(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
}
