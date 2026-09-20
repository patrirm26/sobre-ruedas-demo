import { useEffect } from 'react';
import { useKoraStore } from '../state/store';

export function Toast() {
  const toastMessage = useKoraStore((s) => s.toastMessage);
  const clearToast = useKoraStore((s) => s.clearToast);

  useEffect(() => {
    if (!toastMessage) return;
    const id = setTimeout(clearToast, 3800);
    return () => clearTimeout(id);
  }, [toastMessage, clearToast]);

  return (
    <div className="toast-zone">
      {toastMessage && (
        <div className="toast">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
