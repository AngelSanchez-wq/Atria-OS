import { ExternalLink, Minus, Square, X } from 'lucide-react';
import { AppId } from '../../kernel/types';
import { APPS } from '../../config/apps';
import { IconoApp } from '../components/IconoApp';

type BarraTituloProps = {
  appId: AppId;
  maximizada: boolean;
  onMinimizar: () => void;
  onMaximizar: () => void;
  onCerrar: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
};

export function BarraTitulo({
  appId,
  maximizada,
  onMinimizar,
  onMaximizar,
  onCerrar,
  onPointerDown,
}: BarraTituloProps) {
  const info = APPS[appId];
  const urlExterna =
    info.url && (info.url.startsWith('http') ? info.url : `${import.meta.env.BASE_URL}${info.url}`);

  return (
    <div
      onPointerDown={onPointerDown}
      className="flex h-9 w-full select-none items-center justify-between border-b border-line bg-card px-3 cursor-move"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <IconoApp app={appId} size={18} decorativo={true} />
        <span className="truncate font-fredoka text-sm font-semibold text-ink">
          {info.nombre}
        </span>
      </div>

      <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
        {urlExterna && (
          <a
            href={urlExterna}
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir en pestaña nueva"
            title="Abrir en pestaña nueva"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-accent outline-none"
          >
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}

        <button
          type="button"
          onClick={onMinimizar}
          aria-label="Minimizar"
          title="Minimizar"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-accent outline-none"
        >
          <Minus size={14} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onMaximizar}
          aria-label={maximizada ? 'Restaurar' : 'Maximizar'}
          title={maximizada ? 'Restaurar' : 'Maximizar'}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-accent outline-none"
        >
          <Square size={13} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          title="Cerrar"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-accent outline-none"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
