import { useKoraStore } from '../state/store';

/** Atajo para los botones cuya lógica real todavía no existe (llega en fases
 * siguientes) — abre el modal placeholder con un mensaje consistente. */
export function useComingSoon() {
  const openPlaceholder = useKoraStore((s) => s.openPlaceholder);
  return (title: string, body?: string, icon = '🚧') =>
    openPlaceholder({
      icon,
      title,
      body: body ?? 'Esta función se conecta a lógica real en una fase siguiente del proyecto.',
    });
}
