import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Notificacion } from '../../kernel/types';
import { DURACION_AVISO_URGENTE_MS } from '../../config/notificaciones';

type AvisoUrgenteProps = {
  aviso: Notificacion | null;
  onDescartar: () => void;
};

export function AvisoUrgente({ aviso, onDescartar }: AvisoUrgenteProps) {
  useEffect(() => {
    if (!aviso) return;

    const temporizador = setTimeout(() => {
      onDescartar();
    }, DURACION_AVISO_URGENTE_MS);

    return () => {
      clearTimeout(temporizador);
    };
  }, [aviso, onDescartar]);

  if (!aviso) {
    return null;
  }

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed right-4 top-14 z-50 flex max-w-sm items-start gap-3 rounded-2xl border-2 border-warm-line bg-card p-4 shadow-lg motion-reduce:transition-none"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warm text-warm-ink">
        <AlertTriangle size={20} aria-hidden="true" />
      </div>

      <div className="flex flex-1 flex-col pr-2">
        <div className="flex items-center gap-1.5 text-sm font-bold text-ink">
          <span>{aviso.titulo}</span>
          <span className="text-xs font-normal text-muted">· Ahora</span>
        </div>
        <p className="mt-0.5 text-xs text-muted">
          Atención prioritaria del sistema
        </p>
      </div>

      <button
        type="button"
        onClick={onDescartar}
        aria-label="Cerrar aviso urgente"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </aside>
  );
}
